"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { TagList } from "@/components/tags/tag-picker";
import { StageBadge } from "@/components/clients/stage-badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  bulkAddTagAction,
  bulkDeleteAction,
  bulkSetStageAction,
} from "@/app/(app)/clients/actions";
import { formatDate } from "@/lib/utils";
import type {
  ClientWithTags,
  CustomData,
  FieldDefinition,
  PipelineStage,
  Tag,
} from "@/lib/types";

function renderCustom(field: FieldDefinition, value: CustomData[string]) {
  if (field.type === "checkbox") return value ? "Yes" : "—";
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "date") return formatDate(String(value));
  return String(value);
}

export function ClientTable({
  clients,
  fields,
  stages,
  tags,
}: {
  clients: ClientWithTags[];
  fields: FieldDefinition[];
  stages: PipelineStage[];
  tags: Tag[];
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);

  const cols = fields.filter((f) => f.type !== "textarea").slice(0, 3);
  const ids = React.useMemo(() => [...selected], [selected]);
  const allSelected =
    clients.length > 0 && clients.every((c) => selected.has(c.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(clients.map((c) => c.id)));
  }

  async function run(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
  ) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "Action failed");
      return;
    }
    toast.success(success);
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-accent/50 px-3 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <span className="flex-1" />
          <Select
            value=""
            disabled={busy}
            aria-label="Set stage for selected"
            className="h-8 w-auto text-xs"
            onChange={(e) =>
              e.target.value &&
              run(
                () => bulkSetStageAction(ids, e.target.value),
                "Stage updated",
              )
            }
          >
            <option value="">Set stage…</option>
            {stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
          <Select
            value=""
            disabled={busy || tags.length === 0}
            aria-label="Add tag to selected"
            className="h-8 w-auto text-xs"
            onChange={(e) =>
              e.target.value &&
              run(() => bulkAddTagAction(ids, e.target.value), "Tag added")
            }
          >
            <option value="">Add tag…</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            className="h-8 text-destructive hover:bg-destructive/10"
            onClick={() =>
              confirm(`Move ${selected.size} client(s) to trash?`) &&
              run(() => bulkDeleteAction(ids), "Moved to trash")
            }
          >
            Delete
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Clear selection"
            onClick={() => setSelected(new Set())}
          >
            <X />
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-4 cursor-pointer accent-[var(--primary)]"
                />
              </th>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Stage</th>
              <th className="px-4 py-2.5 font-medium">Phone</th>
              <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
                Email
              </th>
              {cols.map((f) => (
                <th
                  key={f.id}
                  className="hidden px-4 py-2.5 font-medium md:table-cell"
                >
                  {f.label}
                </th>
              ))}
              <th className="px-4 py-2.5 font-medium">Tags</th>
              <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/clients/${c.id}`)}
                className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent/60"
              >
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    aria-label={`Select ${c.name}`}
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="size-4 cursor-pointer accent-[var(--primary)]"
                  />
                </td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">
                  <StageBadge stage={c.stage} stages={stages} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.phone || "—"}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {c.email || "—"}
                </td>
                {cols.map((f) => (
                  <td
                    key={f.id}
                    className="hidden px-4 py-3 text-muted-foreground md:table-cell"
                  >
                    {renderCustom(f, c.custom_data?.[f.key] ?? null)}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <TagList tags={c.tags} />
                </td>
                <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground sm:table-cell">
                  {formatDate(c.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
