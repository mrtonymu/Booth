"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { deleteDocument } from "@/lib/data/documents";

export interface DocActionResult {
  ok: boolean;
  error?: string;
}

// Note: uploads go through the route handler at
// app/api/clients/[id]/documents/route.ts so the browser can show real upload
// progress. Deletion stays a server action.
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
