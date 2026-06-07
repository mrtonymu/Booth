"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createTask, deleteTask, toggleTask } from "@/lib/data/tasks";

export interface TaskActionResult {
  ok: boolean;
  error?: string;
}

function revalidate(clientId: string | null) {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function createTaskAction(input: {
  clientId: string | null;
  title: string;
  dueDate: string | null;
}): Promise<TaskActionResult> {
  const userId = await requireUserId();
  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Title is required" };
  try {
    await createTask(userId, input.clientId, title, input.dueDate || null);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidate(input.clientId);
  return { ok: true };
}

export async function toggleTaskAction(
  id: string,
  done: boolean,
  clientId: string | null = null,
): Promise<TaskActionResult> {
  const userId = await requireUserId();
  try {
    await toggleTask(userId, id, done);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidate(clientId);
  return { ok: true };
}

export async function deleteTaskAction(
  id: string,
  clientId: string | null = null,
): Promise<TaskActionResult> {
  const userId = await requireUserId();
  try {
    await deleteTask(userId, id);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidate(clientId);
  return { ok: true };
}
