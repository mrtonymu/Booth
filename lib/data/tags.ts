import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  DEMO_MODE,
  demoAddTagToClients,
  demoCreateTag,
  demoDeleteTag,
  demoListTags,
  demoSetClientTags,
  demoUpdateTag,
} from "@/lib/demo";
import type { Tag } from "@/lib/types";

export async function listTags(userId: string): Promise<Tag[]> {
  if (DEMO_MODE) return demoListTags();
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("tags")
    .select("*")
    .eq("owner_id", userId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Tag[];
}

export async function createTag(userId: string, name: string, color: string) {
  if (DEMO_MODE) return demoCreateTag(name, color);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("tags")
    .insert({ owner_id: userId, name: name.trim(), color });
  if (error) throw new Error(error.message);
}

export async function updateTag(
  userId: string,
  id: string,
  patch: { name?: string; color?: string },
) {
  if (DEMO_MODE) return demoUpdateTag(id, patch);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("tags")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteTag(userId: string, id: string) {
  if (DEMO_MODE) return demoDeleteTag(id);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("tags")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}

/** Add one tag to many clients (skips clients that already have it). */
export async function addTagToClients(
  userId: string,
  clientIds: string[],
  tagId: string,
) {
  if (!clientIds.length) return;
  if (DEMO_MODE) return demoAddTagToClients(clientIds, tagId);
  const db = getSupabaseAdmin();

  const { data: tag, error: tagErr } = await db
    .from("tags")
    .select("id")
    .eq("id", tagId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (tagErr) throw new Error(tagErr.message);
  if (!tag) throw new Error("Tag not found");

  const { data: owned, error: ownErr } = await db
    .from("clients")
    .select("id")
    .in("id", clientIds)
    .eq("owner_id", userId);
  if (ownErr) throw new Error(ownErr.message);

  const rows = (owned ?? []).map((c) => ({
    client_id: c.id as string,
    tag_id: tagId,
  }));
  if (rows.length) {
    const { error } = await db
      .from("client_tags")
      .upsert(rows, { onConflict: "client_id,tag_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }
}

/** Replace the full set of tags on a client (owner-checked). */
export async function setClientTags(
  userId: string,
  clientId: string,
  tagIds: string[],
) {
  if (DEMO_MODE) return demoSetClientTags(clientId, tagIds);
  const db = getSupabaseAdmin();

  // Ensure the client belongs to this user before touching the join table.
  const { data: owned, error: ownErr } = await db
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (ownErr) throw new Error(ownErr.message);
  if (!owned) throw new Error("Client not found");

  const { error: delErr } = await db
    .from("client_tags")
    .delete()
    .eq("client_id", clientId);
  if (delErr) throw new Error(delErr.message);

  if (tagIds.length > 0) {
    const rows = tagIds.map((tag_id) => ({ client_id: clientId, tag_id }));
    const { error: insErr } = await db.from("client_tags").insert(rows);
    if (insErr) throw new Error(insErr.message);
  }
}
