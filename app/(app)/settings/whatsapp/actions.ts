"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { updateWhatsappTemplate } from "@/lib/data/settings";

const schema = z.string().trim().min(1, "Message can't be empty").max(1000);

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function saveWhatsappTemplateAction(
  template: string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = schema.safeParse(template);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message };
  try {
    await updateWhatsappTemplate(userId, parsed.data);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  // Detail + clients pages embed the rendered wa.me links.
  revalidatePath("/settings/whatsapp");
  revalidatePath("/clients", "layout");
  return { ok: true };
}
