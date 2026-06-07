import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  DEMO_MODE,
  demoCreateField,
  demoDeleteField,
  demoListFields,
  demoUpdateField,
} from "@/lib/demo";
import type { FieldDefinition, FieldType } from "@/lib/types";

export async function listFields(userId: string): Promise<FieldDefinition[]> {
  if (DEMO_MODE) return demoListFields();
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("field_definitions")
    .select("*")
    .eq("owner_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as FieldDefinition[];
}

export interface FieldInput {
  key: string;
  label: string;
  type: FieldType;
  options: string[];
  required: boolean;
  position: number;
}

export async function createField(userId: string, input: FieldInput) {
  if (DEMO_MODE) return demoCreateField(input);
  const db = getSupabaseAdmin();
  const { error } = await db.from("field_definitions").insert({
    owner_id: userId,
    key: input.key,
    label: input.label,
    type: input.type,
    options: input.options,
    required: input.required,
    position: input.position,
  });
  if (error) throw new Error(error.message);
}

export async function updateField(
  userId: string,
  id: string,
  input: Partial<FieldInput>,
) {
  if (DEMO_MODE) return demoUpdateField(id, input);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("field_definitions")
    .update(input)
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteField(userId: string, id: string) {
  if (DEMO_MODE) return demoDeleteField(id);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("field_definitions")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}
