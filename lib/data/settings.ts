import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { DEMO_MODE, demoGetSettings, demoSetWhatsappTemplate } from "@/lib/demo";
import { DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/utils";

export interface AppSettings {
  whatsapp_template: string;
}

/** A user's settings, falling back to defaults when nothing is saved yet. */
export async function getSettings(userId: string): Promise<AppSettings> {
  if (DEMO_MODE) return demoGetSettings();
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("app_settings")
    .select("whatsapp_template")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) {
    // 42P01 = table doesn't exist yet (migration 0005 not run). Don't break the
    // clients pages over an optional setting — just use the default template.
    if (error.code === "42P01") return { whatsapp_template: DEFAULT_WHATSAPP_TEMPLATE };
    throw new Error(error.message);
  }
  return {
    whatsapp_template: data?.whatsapp_template ?? DEFAULT_WHATSAPP_TEMPLATE,
  };
}

export async function updateWhatsappTemplate(userId: string, template: string) {
  if (DEMO_MODE) return demoSetWhatsappTemplate(template);
  const db = getSupabaseAdmin();
  const { error } = await db.from("app_settings").upsert(
    {
      owner_id: userId,
      whatsapp_template: template,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" },
  );
  if (error) throw new Error(error.message);
}
