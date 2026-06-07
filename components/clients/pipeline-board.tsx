"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { updateClientStageAction } from "@/app/(app)/clients/actions";
import {
  PIPELINE_STAGES,
  type ClientWithTags,
  type TagColor,
} from "@/lib/types";

// Static dot classes per stage color (literal strings so Tailwind keeps them).
const STAGE_DOT: Record<string, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
  gray: "bg-slate-400",
};

export function PipelineBoard({ clients }: { clients: ClientWithTags[] }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  // useOptimistic derives from the `clients` prop, so it auto-resyncs after the
  // server action's revalidatePath refreshes this route — no manual state
  // seeding/revert and no divergence on concurrent drags.
  const [optimistic, applyMove] = React.useOptimistic(
    clients,
    (state, move: { id: string; stage: string }) =>
      state.map((c) => (c.id === move.id ? { ...c, stage: move.stage } : c)),
  );

  function move(id: string, toStage: string) {
    const current = optimistic.find((c) => c.id === id);
    if (!current || current.stage === toStage) return;
    startTransition(async () => {
      applyMove({ id, stage: toStage });
      const res = await updateClientStageAction(id, toStage);
      if (!res.ok) {
        // Optimistic value reverts to the (unchanged) base when the transition
        // ends; just surface the error.
        alert(res.error ?? "Could not move client");
      }
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 md:flex-row md:overflow-x-auto md:p-6",
        isPending && "opacity-90",
      )}
    >
      {PIPELINE_STAGES.map((stage) => {
        const cards = optimistic.filter((c) => c.stage === stage.key);
        return (
          <div
            key={stage.key}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(stage.key);
            }}
            onDragLeave={() => setDragOver((s) => (s === stage.key ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const id = e.dataTransfer.getData("text/plain");
              if (id) move(id, stage.key);
            }}
            className={cn(
              "flex w-full shrink-0 flex-col rounded-lg border border-border bg-muted/30 transition-colors md:w-72",
              dragOver === stage.key && "border-primary bg-primary/5",
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    STAGE_DOT[stage.color] ?? "bg-slate-400",
                  )}
                />
                <span className="text-sm font-medium">{stage.label}</span>
              </div>
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                {cards.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-2">
              {cards.map((c) => (
                <article
                  key={c.id}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", c.id)
                  }
                  onClick={() => router.push(`/clients/${c.id}`)}
                  className="cursor-grab rounded-md border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                >
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  {c.phone && (
                    <p className="truncate text-xs text-muted-foreground">
                      {c.phone}
                    </p>
                  )}
                  {c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <Badge key={t.id} color={t.color as TagColor}>
                          {t.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {/* Touch-friendly fallback: drag works on desktop, this works
                      everywhere (HTML5 drag doesn't fire on phones). */}
                  <select
                    value={c.stage}
                    aria-label={`Change stage for ${c.name}`}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => move(c.id, e.target.value)}
                    className="mt-2 w-full cursor-pointer rounded border border-border bg-background px-1.5 py-1 text-xs text-muted-foreground"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
              {cards.length === 0 && (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground md:py-6">
                  No clients
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
