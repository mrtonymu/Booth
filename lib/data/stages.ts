import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  DEMO_MODE,
  demoCreateStage,
  demoDeleteStage,
  demoListStages,
  demoUpdateStage,
} from "@/lib/demo";
import { DEFAULT_STAGES, type PipelineStage } from "@/lib/types";
import { slugifyKey } from "@/lib/utils";

/** List a user's pipeline stages, seeding the defaults on first use. */
export async function listStages(userId: string): Promise<PipelineStage[]> {
  if (DEMO_MODE) return demoListStages();
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("pipeline_stages")
    .select("*")
    .eq("owner_id", userId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    const rows = DEFAULT_STAGES.map((s, i) => ({
      owner_id: userId,
      key: s.key,
      label: s.label,
      color: s.color,
      position: i,
    }));
    const { error: seedErr } = await db
      .from("pipeline_stages")
      .upsert(rows, { onConflict: "owner_id,key", ignoreDuplicates: true });
    if (seedErr) throw new Error(seedErr.message);
    const { data: seeded } = await db
      .from("pipeline_stages")
      .select("*")
      .eq("owner_id", userId)
      .order("position", { ascending: true });
    return (seeded ?? []) as PipelineStage[];
  }
  return data as PipelineStage[];
}

export async function createStage(userId: string, label: string, color: string) {
  if (DEMO_MODE) return demoCreateStage(label, color);
  const db = getSupabaseAdmin();
  const existing = await listStages(userId);
  let key = slugifyKey(label);
  if (!key) throw new Error("Label must contain letters or numbers");
  if (existing.some((s) => s.key === key)) {
    let i = 2;
    while (existing.some((s) => s.key === `${key}_${i}`)) i++;
    key = `${key}_${i}`;
  }
  const { error } = await db.from("pipeline_stages").insert({
    owner_id: userId,
    key,
    label,
    color,
    position: existing.length,
  });
  if (error) throw new Error(error.message);
}

export async function updateStage(
  userId: string,
  id: string,
  patch: { label?: string; color?: string },
) {
  if (DEMO_MODE) return demoUpdateStage(id, patch);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("pipeline_stages")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteStage(userId: string, id: string) {
  if (DEMO_MODE) return demoDeleteStage(id);
  const db = getSupabaseAdmin();
  const stages = await listStages(userId);
  if (stages.length <= 1) throw new Error("Keep at least one stage");
  const target = stages.find((s) => s.id === id);
  if (!target) return;
  const fallback = stages.find((s) => s.id !== id)!;

  // Move any clients on this stage to the fallback stage so none are orphaned.
  const { error: moveErr } = await db
    .from("clients")
    .update({ stage: fallback.key })
    .eq("owner_id", userId)
    .eq("stage", target.key);
  if (moveErr) throw new Error(moveErr.message);

  const { error } = await db
    .from("pipeline_stages")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}
