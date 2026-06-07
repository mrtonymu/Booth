"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { TAG_COLORS, type PipelineStage, type TagColor } from "@/lib/types";
import {
  createStageAction,
  deleteStageAction,
  updateStageAction,
} from "@/app/(app)/settings/stages/actions";

export function StagesManager({ stages }: { stages: PipelineStage[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<PipelineStage | "new" | null>(
    null,
  );

  async function handleDelete(stage: PipelineStage) {
    if (
      !confirm(
        `Delete stage "${stage.label}"? Clients in this stage will move to another stage.`,
      )
    )
      return;
    const res = await deleteStageAction(stage.id);
    if (!res.ok) toast.error(res.error ?? "Could not delete stage");
    else {
      toast.success("Stage deleted");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus /> New stage
        </Button>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {stages.map((stage, i) => (
          <li key={stage.id} className="flex items-center gap-3 px-4 py-3">
            <span className="w-5 text-center text-xs text-muted-foreground">
              {i + 1}
            </span>
            <Badge color={stage.color as TagColor}>{stage.label}</Badge>
            <span className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditing(stage)}
              aria-label="Edit stage"
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(stage)}
              aria-label="Delete stage"
            >
              <Trash2 className="text-destructive" />
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Stages appear as columns on the Pipeline board and as a dropdown on each
        client.
      </p>

      {editing && (
        <StageEditor
          stage={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function StageEditor({
  stage,
  onClose,
  onSaved,
}: {
  stage: PipelineStage | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = React.useState(stage?.label ?? "");
  const [color, setColor] = React.useState<TagColor>(
    (stage?.color as TagColor) ?? "blue",
  );
  const [saving, setSaving] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = stage
      ? await updateStageAction(stage.id, { label, color })
      : await createStageAction({ label, color });
    setSaving(false);
    if (!res.ok) toast.error(res.error ?? "Something went wrong");
    else {
      toast.success(stage ? "Stage updated" : "Stage created");
      onSaved();
    }
  }

  return (
    <Modal open onClose={onClose} title={stage ? "Edit stage" : "New stage"}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-name">Name</Label>
          <Input
            id="s-name"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Negotiation"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={`cursor-pointer rounded-full p-0.5 transition ${
                  color === c
                    ? "ring-2 ring-ring ring-offset-2 ring-offset-card"
                    : ""
                }`}
              >
                <Badge color={c}>{c}</Badge>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : stage ? "Save" : "Create stage"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
