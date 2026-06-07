"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createTaskAction } from "@/app/(app)/tasks/actions";
import { cn } from "@/lib/utils";

interface ClientOption {
  id: string;
  name: string;
}

/**
 * Add-task form. Pass `clients` to show a client picker (tasks page), or
 * `clientId` to fix the task to one client (client detail page).
 */
export function AddTaskForm({
  clients,
  clientId = null,
  onDone,
  bare = false,
}: {
  clients?: ClientOption[];
  clientId?: string | null;
  onDone?: () => void;
  bare?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [due, setDue] = React.useState("");
  const [selectedClient, setSelectedClient] = React.useState(clientId ?? "");
  const [saving, setSaving] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const res = await createTaskAction({
      clientId: clients ? selectedClient || null : clientId,
      title,
      dueDate: due || null,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not add task");
      return;
    }
    setTitle("");
    setDue("");
    if (clients) setSelectedClient("");
    router.refresh();
    onDone?.();
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center",
        !bare && "rounded-lg border border-border bg-card p-3",
      )}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task or follow-up…"
        className="w-full sm:min-w-[180px] sm:flex-1"
      />
      <div className="flex gap-2">
        {clients && (
          <Select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="min-w-0 flex-1 sm:w-auto sm:min-w-[140px] sm:flex-none"
            aria-label="Link to client"
          >
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
        <Input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="min-w-0 flex-1 sm:w-auto sm:flex-none"
          aria-label="Due date"
        />
        <Button type="submit" disabled={saving || !title.trim()}>
          <Plus /> Add
        </Button>
      </div>
    </form>
  );
}
