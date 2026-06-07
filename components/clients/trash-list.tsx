"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  permanentlyDeleteClientAction,
  restoreClientAction,
} from "@/app/(app)/clients/actions";
import { formatDate } from "@/lib/utils";
import type { ClientWithTags } from "@/lib/types";

export function TrashList({ clients }: { clients: ClientWithTags[] }) {
  const router = useRouter();

  async function restore(c: ClientWithTags) {
    const res = await restoreClientAction(c.id);
    if (!res.ok) toast.error(res.error ?? "Could not restore");
    else {
      toast.success(`"${c.name}" restored`);
      router.refresh();
    }
  }

  async function purge(c: ClientWithTags) {
    if (
      !confirm(
        `Permanently delete "${c.name}"? This cannot be undone — all their tasks, notes, and files are removed too.`,
      )
    )
      return;
    const res = await permanentlyDeleteClientAction(c.id);
    if (!res.ok) toast.error(res.error ?? "Could not delete");
    else {
      toast.success("Permanently deleted");
      router.refresh();
    }
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Trash is empty. Deleted clients show up here and can be restored.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {clients.map((c) => (
        <li
          key={c.id}
          className="flex flex-wrap items-center gap-3 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">
              Deleted {formatDate(c.deleted_at)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => restore(c)}>
            <RotateCcw /> Restore
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => purge(c)}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 /> Delete forever
          </Button>
        </li>
      ))}
    </ul>
  );
}
