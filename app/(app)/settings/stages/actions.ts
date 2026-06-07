"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { createStage, deleteStage, updateStage } from "@/lib/data/stages";
import { TAG_COLORS } from "@/lib/types";

const schema = z.object({
  label: z.string().trim().min(1, "Name is required").max(40),
  color: z.enum(TAG_COLORS).default("gray"),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createStageAction(values: {
  label: string;
  color: string;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = schema.safeParse(values);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message };
  try {
    await createStage(userId, parsed.data.label, parsed.data.color);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidateStages();
  return { ok: true };
}

export async function updateStageAction(
  id: string,
  values: { label: string; color: string },
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = schema.safeParse(values);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message };
  try {
    await updateStage(userId, id, parsed.data);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidateStages();
  return { ok: true };
}

export async function deleteStageAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  try {
    await deleteStage(userId, id);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidateStages();
  return { ok: true };
}

function revalidateStages() {
  revalidatePath("/settings/stages");
  revalidatePath("/pipeline");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}
