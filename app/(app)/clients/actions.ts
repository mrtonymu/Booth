"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { listFields } from "@/lib/data/fields";
import {
  createClient,
  deleteClient,
  updateClient,
  updateClientStage,
} from "@/lib/data/clients";
import { createTag, listTags, setClientTags } from "@/lib/data/tags";
import { createActivity, deleteActivity } from "@/lib/data/activities";
import {
  ACTIVITY_TYPES,
  PIPELINE_STAGES,
  type ActivityType,
  type CustomData,
  type FieldDefinition,
} from "@/lib/types";

export interface ClientFormPayload {
  name: string;
  phone?: string;
  email?: string;
  stage: string;
  custom: Record<string, string | boolean | null>;
  tagIds: string[];
}

function normalizeStage(stage: string | undefined): string {
  return PIPELINE_STAGES.some((s) => s.key === stage) ? stage! : "new";
}

export interface ClientActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

/** Coerce + validate raw custom values against the field definitions. */
function buildCustomData(
  fields: FieldDefinition[],
  raw: Record<string, string | boolean | null>,
): { data: CustomData; error?: string } {
  const data: CustomData = {};
  for (const f of fields) {
    const v = raw[f.key];
    if (f.type === "checkbox") {
      data[f.key] = Boolean(v);
      continue;
    }
    const empty = v === null || v === undefined || v === "";
    if (empty) {
      if (f.required) return { data, error: `“${f.label}” is required` };
      data[f.key] = null;
      continue;
    }
    if (f.type === "number") {
      const n = Number(v);
      if (Number.isNaN(n)) return { data, error: `“${f.label}” must be a number` };
      data[f.key] = n;
    } else {
      data[f.key] = String(v);
    }
  }
  return { data };
}

export async function createClientAction(
  payload: ClientFormPayload,
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  const name = payload.name?.trim();
  if (!name) return { ok: false, error: "Name is required" };

  const fields = await listFields(userId);
  const { data: custom_data, error } = buildCustomData(fields, payload.custom);
  if (error) return { ok: false, error };

  let id: string;
  try {
    id = await createClient(userId, {
      name,
      phone: payload.phone?.trim() || null,
      email: payload.email?.trim() || null,
      stage: normalizeStage(payload.stage),
      custom_data,
    });
    await setClientTags(userId, id, payload.tagIds ?? []);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/clients");
  return { ok: true, id };
}

export async function updateClientAction(
  id: string,
  payload: ClientFormPayload,
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  const name = payload.name?.trim();
  if (!name) return { ok: false, error: "Name is required" };

  const fields = await listFields(userId);
  const { data: custom_data, error } = buildCustomData(fields, payload.custom);
  if (error) return { ok: false, error };

  try {
    await updateClient(userId, id, {
      name,
      phone: payload.phone?.trim() || null,
      email: payload.email?.trim() || null,
      stage: normalizeStage(payload.stage),
      custom_data,
    });
    await setClientTags(userId, id, payload.tagIds ?? []);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { ok: true, id };
}

export async function deleteClientAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await deleteClient(userId, id);
  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClientStageAction(
  id: string,
  stage: string,
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  if (!PIPELINE_STAGES.some((s) => s.key === stage)) {
    return { ok: false, error: "Invalid stage" };
  }
  try {
    await updateClientStage(userId, id, stage);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/pipeline");
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

// ---- Activities (follow-up timeline) ----

export async function addActivityAction(
  clientId: string,
  type: string,
  content: string,
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  const text = content?.trim();
  if (!text) return { ok: false, error: "Write something first" };
  const t: ActivityType = (ACTIVITY_TYPES as readonly string[]).includes(type)
    ? (type as ActivityType)
    : "note";
  try {
    await createActivity(userId, clientId, t, text);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function deleteActivityAction(
  clientId: string,
  activityId: string,
): Promise<ClientActionResult> {
  const userId = await requireUserId();
  try {
    await deleteActivity(userId, activityId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

// ---- CSV import ----

export interface ImportResult {
  ok: boolean;
  imported: number;
  skipped: number;
  error?: string;
}

const IMPORT_LIMIT = 1000;
const TRUTHY = new Set(["yes", "true", "1", "y", "✓", "x"]);
const norm = (s: string) => s.trim().toLowerCase();

function splitTags(cell: string): string[] {
  return cell
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Lenient coercion for imported values (no required-field enforcement). */
function coerceImport(
  field: FieldDefinition,
  raw: string | undefined,
): string | number | boolean | null {
  if (field.type === "checkbox") return raw ? TRUTHY.has(norm(raw)) : false;
  if (raw === undefined || raw.trim() === "") return null;
  if (field.type === "number") {
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  }
  return raw.trim();
}

export async function importClientsAction(
  rows: Record<string, string>[],
): Promise<ImportResult> {
  const userId = await requireUserId();
  const fields = await listFields(userId);

  // Map each row's headers once, normalized, so we can look up by label/name.
  const normalizeRow = (row: Record<string, string>) => {
    const m = new Map<string, string>();
    for (const [k, v] of Object.entries(row)) m.set(norm(k), v ?? "");
    return m;
  };

  // Ensure every tag named in the file exists, then build a name → id map.
  const wanted = new Set<string>();
  for (const row of rows) {
    const m = normalizeRow(row);
    const cell = m.get("tags");
    if (cell) splitTags(cell).forEach((t) => wanted.add(t));
  }
  let tags = await listTags(userId);
  const haveNames = new Set(tags.map((t) => norm(t.name)));
  for (const name of wanted) {
    if (!haveNames.has(norm(name))) {
      try {
        await createTag(userId, name, "gray");
      } catch {
        // ignore duplicates / invalid names
      }
    }
  }
  tags = await listTags(userId);
  const tagIdByName = new Map(tags.map((t) => [norm(t.name), t.id]));

  let imported = 0;
  let skipped = 0;

  for (const row of rows.slice(0, IMPORT_LIMIT)) {
    const m = normalizeRow(row);
    const name = (m.get("name") ?? "").trim();
    if (!name) {
      skipped++;
      continue;
    }
    const custom_data: CustomData = {};
    for (const f of fields) {
      custom_data[f.key] = coerceImport(f, m.get(norm(f.label)));
    }
    const tagIds = (m.get("tags") ? splitTags(m.get("tags")!) : [])
      .map((n) => tagIdByName.get(norm(n)))
      .filter((id): id is string => Boolean(id));

    // Accept a Stage column as either a key ("new") or a label ("New lead").
    const rawStage = norm(m.get("stage") ?? "");
    const stage =
      PIPELINE_STAGES.find(
        (s) => s.key === rawStage || norm(s.label) === rawStage,
      )?.key ?? "new";

    try {
      const id = await createClient(userId, {
        name,
        phone: (m.get("phone") ?? "").trim() || null,
        email: (m.get("email") ?? "").trim() || null,
        stage,
        custom_data,
      });
      if (tagIds.length) await setClientTags(userId, id, tagIds);
      imported++;
    } catch {
      skipped++;
    }
  }

  revalidatePath("/clients");
  return {
    ok: true,
    imported,
    skipped: skipped + Math.max(0, rows.length - IMPORT_LIMIT),
  };
}
