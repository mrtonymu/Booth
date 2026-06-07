"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, MessageSquare, Phone, Users, Calendar, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  type Activity,
  type ActivityType,
} from "@/lib/types";
import {
  addActivityAction,
  deleteActivityAction,
} from "@/app/(app)/clients/actions";
import { formatDateTime } from "@/lib/utils";

const ICONS: Record<ActivityType, React.ElementType> = {
  note: MessageSquare,
  call: Phone,
  meeting: Users,
  whatsapp: Send,
  followup: Calendar,
};

export function Timeline({
  clientId,
  activities,
}: {
  clientId: string;
  activities: Activity[];
}) {
  const router = useRouter();
  const [type, setType] = React.useState<ActivityType>("note");
  const [content, setContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError(null);
    const res = await addActivityAction(clientId, type, content);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Could not save");
      return;
    }
    setContent("");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this entry?")) return;
    const res = await deleteActivityAction(clientId, id);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={add}
        className="rounded-lg border border-border bg-card p-3"
      >
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Log a call, note, or next follow-up…"
          rows={2}
          className="border-0 p-0 shadow-none focus-visible:ring-0"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
            className="h-8 w-auto min-w-[110px] text-xs"
            aria-label="Entry type"
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm" disabled={saving || !content.trim()}>
            {saving ? "Adding…" : "Add entry"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </form>

      {activities.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">
          No activity yet. Add your first note above.
        </p>
      ) : (
        <ul className="space-y-1">
          {activities.map((a) => {
            const Icon = ICONS[a.type] ?? MessageSquare;
            return (
              <li key={a.id} className="group flex gap-3 rounded-md p-2 hover:bg-accent/50">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {ACTIVITY_TYPE_LABELS[a.type]}
                    </span>
                    <span>·</span>
                    <span>{formatDateTime(a.created_at)}</span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm">
                    {a.content}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  aria-label="Delete entry"
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground opacity-100 transition hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
