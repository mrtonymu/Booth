"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import {
  createField,
  deleteField,
  listFields,
  updateField,
} from "@/lib/data/fields";
import { FIELD_TYPES } from "@/lib/types";
import { slugifyKey } from "@/lib/utils";

const fieldSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(60),
  type: z.enum(FIELD_TYPES),
  options: z.array(z.string().trim().min(1)).default([]),
  required: z.boolean().default(false),
});

export type FieldFormValues = z.input<typeof fieldSchema>;

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createFieldAction(
  values: FieldFormValues,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = fieldSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { label, type, options, required } = parsed.data;

  const existing = await listFields(userId);
  let key = slugifyKey(label);
  if (!key) return { ok: false, error: "Label must contain letters or numbers" };
  // Ensure unique key per owner.
  if (existing.some((f) => f.key === key)) {
    let i = 2;
    while (existing.some((f) => f.key === `${key}_${i}`)) i++;
    key = `${key}_${i}`;
  }
  const position = existing.length;

  try {
    await createField(userId, {
      key,
      label,
      type,
      options: type === "select" ? options : [],
      required,
      position,
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/settings/fields");
  revalidatePath("/clients");
  return { ok: true };
}

export async function updateFieldAction(
  id: string,
  values: FieldFormValues,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = fieldSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { label, type, options, required } = parsed.data;
  try {
    await updateField(userId, id, {
      label,
      type,
      options: type === "select" ? options : [],
      required,
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/settings/fields");
  revalidatePath("/clients");
  return { ok: true };
}

export async function deleteFieldAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  try {
    await deleteField(userId, id);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/settings/fields");
  revalidatePath("/clients");
  return { ok: true };
}
