import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  DEMO_MODE,
  demoCreateTask,
  demoDeleteTask,
  demoListTasks,
  demoToggleTask,
} from "@/lib/demo";
import type { Task, TaskWithClient } from "@/lib/types";

type TaskRow = Task & { clients: { name: string } | null };

function flattenClient(row: TaskRow): TaskWithClient {
  const { clients, ...task } = row;
  return { ...(task as Task), client_name: clients?.name ?? null };
}

export async function listTasks(
  userId: string,
  clientId?: string,
): Promise<TaskWithClient[]> {
  if (DEMO_MODE) return demoListTasks(clientId);
  const db = getSupabaseAdmin();
  let query = db
    .from("tasks")
    .select("*, clients(name)")
    .eq("owner_id", userId);
  if (clientId) query = query.eq("client_id", clientId);
  // Open before done, then earliest due date (nulls last), then newest.
  query = query
    .order("done", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data as TaskRow[] | null) ?? []).map(flattenClient);
}

export async function createTask(
  userId: string,
  clientId: string | null,
  title: string,
  dueDate: string | null,
) {
  if (DEMO_MODE) return demoCreateTask(clientId, title, dueDate);
  const db = getSupabaseAdmin();
  // If linked to a client, confirm ownership.
  if (clientId) {
    const { data: owned, error: ownErr } = await db
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (ownErr) throw new Error(ownErr.message);
    if (!owned) throw new Error("Client not found");
  }
  const { error } = await db.from("tasks").insert({
    owner_id: userId,
    client_id: clientId,
    title: title.trim(),
    due_date: dueDate,
  });
  if (error) throw new Error(error.message);
}

export async function toggleTask(userId: string, id: string, done: boolean) {
  if (DEMO_MODE) return demoToggleTask(id, done);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("tasks")
    .update({ done })
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteTask(userId: string, id: string) {
  if (DEMO_MODE) return demoDeleteTask(id);
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
}
