import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  DEMO_MODE,
  demoBulkSoftDelete,
  demoBulkUpdateStage,
  demoCreateClient,
  demoDeleteClient,
  demoGetClient,
  demoHardDeleteClient,
  demoListClients,
  demoListDeletedClients,
  demoRestoreClient,
  demoUpdateClient,
  demoUpdateClientStage,
} from "@/lib/demo";
import { compareCustomValues } from "@/lib/utils";
import type { Client, ClientWithTags, CustomData, Tag } from "@/lib/types";

export interface ListClientsParams {
  search?: string;
  tagId?: string;
  sort?: string; // "name" | "created_at" | "updated_at" | "custom:<key>"
  dir?: "asc" | "desc";
}

const FIXED_SORTS = new Set(["name", "created_at", "updated_at"]);

/** Shape returned by the embedded select before we flatten tags. */
type ClientRow = Client & { client_tags: { tags: Tag | null }[] | null };

function flattenTags(row: ClientRow): ClientWithTags {
  const tags = (row.client_tags ?? [])
    .map((ct) => ct.tags)
    .filter((t): t is Tag => Boolean(t))
    .sort((a, b) => a.name.localeCompare(b.name));
  const { client_tags: _ignore, ...client } = row;
  void _ignore;
  return { ...(client as Client), tags };
}

export async function listClients(
  userId: string,
  params: ListClientsParams = {},
): Promise<ClientWithTags[]> {
  if (DEMO_MODE) return demoListClients(params);
  const db = getSupabaseAdmin();

  // Tag filter: resolve to a set of client ids first.
  let idFilter: string[] | null = null;
  if (params.tagId) {
    const { data: links, error } = await db
      .from("client_tags")
      .select("client_id")
      .eq("tag_id", params.tagId);
    if (error) throw new Error(error.message);
    idFilter = (links ?? []).map((l) => l.client_id as string);
    if (idFilter.length === 0) return [];
  }

  let query = db
    .from("clients")
    .select("*, client_tags(tags(*))")
    .eq("owner_id", userId)
    .is("deleted_at", null);

  if (params.search?.trim()) {
    const q = params.search.trim();
    query = query.or(
      `name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }

  if (idFilter) query = query.in("id", idFilter);

  // Sorting. Fixed columns sort in the DB; custom fields sort in JS below so
  // numbers order numerically (the JSON ->> operator would compare them as text).
  const sort = params.sort ?? "updated_at";
  const isCustom = sort.startsWith("custom:");
  if (FIXED_SORTS.has(sort)) {
    query = query.order(sort, { ascending: params.dir === "asc" });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  let rows = ((data as ClientRow[] | null) ?? []).map(flattenTags);

  if (isCustom) {
    // sort param is "custom:<type>:<key>" (type set by the toolbar).
    const [, type = "text", ...keyParts] = sort.split(":");
    const key = keyParts.join(":");
    const dir = params.dir === "asc" ? "asc" : "desc";
    rows = [...rows].sort((x, y) =>
      compareCustomValues(x.custom_data?.[key], y.custom_data?.[key], type, dir),
    );
  }
  return rows;
}

export async function getClient(
  userId: string,
  id: string,
): Promise<ClientWithTags | null> {
  if (DEMO_MODE) return demoGetClient(id);
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("clients")
    .select("*, client_tags(tags(*))")
    .eq("id", id)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return flattenTags(data as ClientRow);
}

export interface ClientInput {
  name: string;
  phone: string | null;
  email: string | null;
  stage: string;
  custom_data: CustomData;
}

export async function createClient(
  userId: string,
  input: ClientInput,
): Promise<string> {
  if (DEMO_MODE) return demoCreateClient(input);
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("clients")
    .insert({ owner_id: userId, ...input })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateClient(
  userId: string,
  id: string,
  input: ClientInput,
) {
  if (DEMO_MODE) return demoUpdateClient(id, input);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("clients")
    .update(input)
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}

export async function updateClientStage(
  userId: string,
  id: string,
  stage: string,
) {
  if (DEMO_MODE) return demoUpdateClientStage(id, stage);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("clients")
    .update({ stage })
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}

/** Soft delete — moves the client to the trash (recoverable). */
export async function deleteClient(userId: string, id: string) {
  if (DEMO_MODE) return demoDeleteClient(id);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}

export async function restoreClient(userId: string, id: string) {
  if (DEMO_MODE) return demoRestoreClient(id);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("clients")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}

/** Permanent delete — removes the client and cascades tasks/activities/docs. */
export async function hardDeleteClient(userId: string, id: string) {
  if (DEMO_MODE) return demoHardDeleteClient(id);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}

export async function bulkUpdateStage(
  userId: string,
  ids: string[],
  stage: string,
) {
  if (!ids.length) return;
  if (DEMO_MODE) return demoBulkUpdateStage(ids, stage);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("clients")
    .update({ stage })
    .in("id", ids)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}

export async function bulkSoftDelete(userId: string, ids: string[]) {
  if (!ids.length) return;
  if (DEMO_MODE) return demoBulkSoftDelete(ids);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}

export async function listDeletedClients(
  userId: string,
): Promise<ClientWithTags[]> {
  if (DEMO_MODE) return demoListDeletedClients();
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("clients")
    .select("*, client_tags(tags(*))")
    .eq("owner_id", userId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as ClientRow[] | null) ?? []).map(flattenTags);
}
