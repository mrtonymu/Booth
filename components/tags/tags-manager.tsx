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
import { TAG_COLORS, type Tag, type TagColor } from "@/lib/types";
import {
  createTagAction,
  deleteTagAction,
  updateTagAction,
} from "@/app/(app)/settings/tags/actions";

export function TagsManager({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Tag | "new" | null>(null);

  async function handleDelete(tag: Tag) {
    if (!confirm(`Delete tag "${tag.name}"? It will be removed from all clients.`))
      return;
    const res = await deleteTagAction(tag.id);
    if (!res.ok) toast.error(res.error ?? "Could not delete tag");
    else {
      toast.success("Tag deleted");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus /> New tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No tags yet. Create tags like “Hot lead”, “Signed”, or a project name
            to label and filter clients.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {tags.map((tag) => (
            <li key={tag.id} className="flex items-center gap-3 px-4 py-3">
              <Badge color={tag.color as TagColor}>{tag.name}</Badge>
              <span className="flex-1" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(tag)}
                aria-label="Edit tag"
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(tag)}
                aria-label="Delete tag"
              >
                <Trash2 className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <TagEditor
          tag={editing === "new" ? null : editing}
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

function TagEditor({
  tag,
  onClose,
  onSaved,
}: {
  tag: Tag | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState(tag?.name ?? "");
  const [color, setColor] = React.useState<TagColor>(
    (tag?.color as TagColor) ?? "blue",
  );
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = tag
      ? await updateTagAction(tag.id, { name, color })
      : await createTagAction({ name, color });
    setSaving(false);
    if (!res.ok) setError(res.error ?? "Something went wrong");
    else onSaved();
  }

  return (
    <Modal open onClose={onClose} title={tag ? "Edit tag" : "New tag"}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="t-name">Name</Label>
          <Input
            id="t-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hot lead"
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
                aria-pressed={color === c}
                className={`cursor-pointer rounded-full p-0.5 transition ${
                  color === c ? "ring-2 ring-ring ring-offset-2 ring-offset-card" : ""
                }`}
              >
                <Badge color={c}>{c}</Badge>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : tag ? "Save" : "Create tag"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
