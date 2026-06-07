import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  DEMO_MODE,
  demoCreateDocument,
  demoDeleteDocument,
  demoListDocuments,
} from "@/lib/demo";
import type { ClientDocument } from "@/lib/types";

const BUCKET = "documents";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

export interface UploadInput {
  name: string;
  mime: string | null;
  size: number;
  bytes: Uint8Array;
}

/** Keep only safe filename chars to avoid path traversal in the storage key. */
function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

export async function listDocuments(
  userId: string,
  clientId: string,
): Promise<ClientDocument[]> {
  if (DEMO_MODE) return demoListDocuments(clientId);
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("documents")
    .select("*")
    .eq("owner_id", userId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  // Generate a short-lived signed URL for each file.
  const out: ClientDocument[] = [];
  for (const r of rows) {
    const { data: signed, error: signErr } = await db.storage
      .from(BUCKET)
      .createSignedUrl(r.path as string, SIGNED_URL_TTL);
    if (signErr) {
      // Don't fail the whole list for one bad file — surface it in logs and
      // mark this row's URL as unavailable.
      console.error(`Signed URL failed for ${r.path}:`, signErr.message);
    }
    out.push({
      id: r.id,
      owner_id: r.owner_id,
      client_id: r.client_id,
      name: r.name,
      mime: r.mime,
      size: r.size,
      url: signed?.signedUrl ?? "#",
      created_at: r.created_at,
    });
  }
  return out;
}

export async function uploadDocument(
  userId: string,
  clientId: string,
  input: UploadInput,
) {
  if (DEMO_MODE) {
    const b64 = Buffer.from(input.bytes).toString("base64");
    return demoCreateDocument(clientId, {
      name: input.name,
      mime: input.mime,
      size: input.size,
      url: `data:${input.mime ?? "application/octet-stream"};base64,${b64}`,
    });
  }

  const db = getSupabaseAdmin();
  // Confirm client ownership.
  const { data: owned, error: ownErr } = await db
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (ownErr) throw new Error(ownErr.message);
  if (!owned) throw new Error("Client not found");

  const path = `${userId}/${clientId}/${crypto.randomUUID()}-${safeName(input.name)}`;
  const { error: upErr } = await db.storage
    .from(BUCKET)
    .upload(path, input.bytes, {
      contentType: input.mime ?? "application/octet-stream",
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  const { error: insErr } = await db.from("documents").insert({
    owner_id: userId,
    client_id: clientId,
    name: input.name,
    mime: input.mime,
    size: input.size,
    path,
  });
  if (insErr) {
    // Roll back the uploaded object if the row insert fails. Don't let a
    // cleanup failure mask the original error — log and continue to throw it.
    try {
      await db.storage.from(BUCKET).remove([path]);
    } catch (cleanupErr) {
      console.error(`Orphaned file cleanup failed for ${path}:`, cleanupErr);
    }
    throw new Error(insErr.message);
  }
}

export async function deleteDocument(userId: string, id: string) {
  if (DEMO_MODE) return demoDeleteDocument(id);
  const db = getSupabaseAdmin();
  const { data: row, error } = await db
    .from("documents")
    .select("path")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return;

  await db.storage.from(BUCKET).remove([row.path as string]);
  const { error: delErr } = await db
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);
  if (delErr) throw new Error(delErr.message);
}
