"use client";

import * as React from "react";
import { AddTaskForm } from "@/components/tasks/add-task-form";
import { TaskRow } from "@/components/tasks/task-row";
import { Fab } from "@/components/ui/fab";
import { Modal } from "@/components/ui/modal";
import { todayISO } from "@/lib/utils";
import type { TaskWithClient } from "@/lib/types";

interface ClientOption {
  id: string;
  name: string;
}

type GroupKey = "overdue" | "today" | "upcoming" | "someday" | "done";

const GROUP_LABELS: Record<GroupKey, string> = {
  overdue: "Overdue",
  today: "Today",
  upcoming: "Upcoming",
  someday: "No date",
  done: "Done",
};
const GROUP_ORDER: GroupKey[] = ["overdue", "today", "upcoming", "someday", "done"];

function groupOf(task: TaskWithClient, today: string): GroupKey {
  if (task.done) return "done";
  if (!task.due_date) return "someday";
  if (task.due_date < today) return "overdue";
  if (task.due_date === today) return "today";
  return "upcoming";
}

export function TasksView({
  tasks,
  clients,
}: {
  tasks: TaskWithClient[];
  clients: ClientOption[];
}) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const today = todayISO();
  const groups = React.useMemo(() => {
    const out: Record<GroupKey, TaskWithClient[]> = {
      overdue: [],
      today: [],
      upcoming: [],
      someday: [],
      done: [],
    };
    for (const t of tasks) out[groupOf(t, today)].push(t);
    return out;
  }, [tasks, today]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      {/* Desktop: inline add form. Mobile: FAB + bottom sheet (below). */}
      <div className="hidden md:block">
        <AddTaskForm clients={clients} />
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No tasks yet. Add your first follow-up.
        </div>
      ) : (
        GROUP_ORDER.filter((g) => groups[g].length > 0).map((g) => (
          <section key={g} className="space-y-1">
            <h2 className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {GROUP_LABELS[g]}
              <span className="rounded-full bg-muted px-1.5 text-[10px]">
                {groups[g].length}
              </span>
            </h2>
            <div className="rounded-lg border border-border bg-card">
              {groups[g].map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Mobile add: FAB opens a bottom-sheet form. */}
      <Fab label="New task" onClick={() => setSheetOpen(true)} />
      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="New task"
      >
        <AddTaskForm
          clients={clients}
          bare
          onDone={() => setSheetOpen(false)}
        />
      </Modal>
    </div>
  );
}
