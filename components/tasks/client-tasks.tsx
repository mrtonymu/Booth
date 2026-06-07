"use client";

import { AddTaskForm } from "@/components/tasks/add-task-form";
import { TaskRow } from "@/components/tasks/task-row";
import type { TaskWithClient } from "@/lib/types";

/** Tasks panel scoped to a single client (used on the client detail page). */
export function ClientTasks({
  clientId,
  tasks,
}: {
  clientId: string;
  tasks: TaskWithClient[];
}) {
  return (
    <div className="space-y-3">
      <AddTaskForm clientId={clientId} />
      {tasks.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} showClient={false} />
          ))}
        </div>
      )}
    </div>
  );
}
