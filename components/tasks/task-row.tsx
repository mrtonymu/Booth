"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Check } from "lucide-react";
import {
  deleteTaskAction,
  toggleTaskAction,
} from "@/app/(app)/tasks/actions";
import { cn, formatDate, todayISO } from "@/lib/utils";
import type { TaskWithClient } from "@/lib/types";

export function TaskRow({
  task,
  showClient = true,
}: {
  task: TaskWithClient;
  showClient?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const overdue = !task.done && !!task.due_date && task.due_date < todayISO();
  const dueToday = !task.done && task.due_date === todayISO();

  function toggle() {
    startTransition(async () => {
      await toggleTaskAction(task.id, !task.done, task.client_id);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("Delete this task?")) return;
    startTransition(async () => {
      await deleteTaskAction(task.id, task.client_id);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent/50",
        pending && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={task.done ? "Mark as not done" : "Mark as done"}
        className={cn(
          "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
          task.done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input hover:border-primary",
        )}
      >
        {task.done && <Check className="size-3.5" />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm",
            task.done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.due_date && (
            <span
              className={cn(
                overdue && "font-medium text-destructive",
                dueToday && "font-medium text-primary",
              )}
            >
              {overdue ? "Overdue · " : dueToday ? "Today · " : ""}
              {formatDate(task.due_date)}
            </span>
          )}
          {showClient && task.client_id && task.client_name && (
            <>
              {task.due_date && <span>·</span>}
              <Link
                href={`/clients/${task.client_id}`}
                className="hover:text-foreground hover:underline"
              >
                {task.client_name}
              </Link>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={remove}
        aria-label="Delete task"
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground opacity-100 transition hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
