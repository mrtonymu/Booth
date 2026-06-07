"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { createTag, deleteTag, updateTag } from "@/lib/data/tags";
import { TAG_COLORS } from "@/lib/types";

const tagSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40),
  color: z.enum(TAG_COLORS).default("gray"),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createTagAction(values: {
  name: string;
  color: string;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = tagSchema.safeParse(values);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message };
  try {
    await createTag(userId, parsed.data.name, parsed.data.color);
  } catch (e) {
    const msg = (e as Error).message;
    return {
      ok: false,
      error: msg.includes("duplicate") ? "A tag with that name already exists" : msg,
    };
  }
  revalidatePath("/settings/tags");
  revalidatePath("/clients");
  return { ok: true };
}

export async function updateTagAction(
  id: string,
  values: { name: string; color: string },
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = tagSchema.safeParse(values);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message };
  try {
    await updateTag(userId, id, parsed.data);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/settings/tags");
  revalidatePath("/clients");
  return { ok: true };
}

export async function deleteTagAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  try {
    await deleteTag(userId, id);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/settings/tags");
  revalidatePath("/clients");
  return { ok: true };
}
