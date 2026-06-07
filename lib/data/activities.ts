import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  DEMO_MODE,
  demoCreateActivity,
  demoDeleteActivity,
  demoListActivities,
  demoListRecentActivities,
} from "@/lib/demo";
import type { Activity, ActivityType } from "@/lib/types";

export async function listActivities(
  userId: string,
  clientId: string,
): Promise<Activity[]> {
  if (DEMO_MODE) return demoListActivities(clientId);
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("activities")
    .select("*")
    .eq("owner_id", userId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Activity[];
}

/** Most recent activities across all of the user's clients (for the dashboard). */
export async function listRecentActivities(
  userId: string,
  limit = 6,
): Promise<Activity[]> {
  if (DEMO_MODE) return demoListRecentActivities(limit);
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("activities")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Activity[];
}

export async function createActivity(
  userId: string,
  clientId: string,
  type: ActivityType,
  content: string,
) {
  if (DEMO_MODE) return demoCreateActivity(clientId, type, content);
  const db = getSupabaseAdmin();

  // Confirm the client belongs to this user.
  const { data: owned, error: ownErr } = await db
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (ownErr) throw new Error(ownErr.message);
  if (!owned) throw new Error("Client not found");

  const { error } = await db.from("activities").insert({
    owner_id: userId,
    client_id: clientId,
    type,
    content: content.trim(),
  });
  if (error) throw new Error(error.message);
}

export async function deleteActivity(userId: string, id: string) {
  if (DEMO_MODE) return demoDeleteActivity(id);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("activities")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}
