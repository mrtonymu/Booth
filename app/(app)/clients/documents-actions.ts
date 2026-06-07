"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { deleteDocument, uploadDocument } from "@/lib/data/documents";

export interface DocActionResult {
  ok: boolean;
  error?: string;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function uploadDocumentAction(
  formData: FormData,
): Promise<DocActionResult> {
  const userId = await requireUserId();
  const clientId = String(formData.get("clientId") ?? "");
  const file = formData.get("file");

  if (!clientId) return { ok: false, error: "Missing client" };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file selected" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File too large (max 10 MB)" };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    // Re-check the actual byte length (don't trust the reported file.size).
    if (bytes.length > MAX_BYTES) {
      return { ok: false, error: "File too large (max 10 MB)" };
    }
    await uploadDocument(userId, clientId, {
      name: file.name,
      mime: file.type || null,
      size: file.size,
      bytes,
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function deleteDocumentAction(
  id: string,
  clientId: string,
): Promise<DocActionResult> {
  const userId = await requireUserId();
  try {
    await deleteDocument(userId, id);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}
