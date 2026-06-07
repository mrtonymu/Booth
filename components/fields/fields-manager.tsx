"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  type FieldDefinition,
  type FieldType,
} from "@/lib/types";
import {
  createFieldAction,
  deleteFieldAction,
  updateFieldAction,
} from "@/app/(app)/settings/fields/actions";

export function FieldsManager({ fields }: { fields: FieldDefinition[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<FieldDefinition | "new" | null>(
    null,
  );

  async function handleDelete(field: FieldDefinition) {
    if (
      !confirm(
        `Delete the "${field.label}" field? Existing values stay in each client's data but the column is removed.`,
      )
    )
      return;
    const res = await deleteFieldAction(field.id);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus /> New field
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No custom fields yet. Add fields like “Budget”, “Preferred area”, or
            “Viewing date” — they’ll appear on every client form and the table.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {fields.map((field) => (
            <li
              key={field.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{field.label}</span>
                  {field.required && (
                    <span className="text-xs text-destructive">required</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {FIELD_TYPE_LABELS[field.type]}
                  {field.type === "select" && field.options.length > 0 && (
                    <> · {field.options.join(", ")}</>
                  )}
                  {" · key: "}
                  <code className="font-mono">{field.key}</code>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(field)}
                aria-label="Edit field"
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(field)}
                aria-label="Delete field"
              >
                <Trash2 className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <FieldEditor
          field={editing === "new" ? null : editing}
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

function FieldEditor({
  field,
  onClose,
  onSaved,
}: {
  field: FieldDefinition | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = React.useState(field?.label ?? "");
  const [type, setType] = React.useState<FieldType>(field?.type ?? "text");
  const [optionsText, setOptionsText] = React.useState(
    (field?.options ?? []).join("\n"),
  );
  const [required, setRequired] = React.useState(field?.required ?? false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const options = optionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const values = { label, type, options, required };
    const res = field
      ? await updateFieldAction(field.id, values)
      : await createFieldAction(values);
    setSaving(false);
    if (!res.ok) setError(res.error ?? "Something went wrong");
    else onSaved();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={field ? "Edit field" : "New custom field"}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-label">Label</Label>
          <Input
            id="f-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Budget"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-type">Type</Label>
          <Select
            id="f-type"
            value={type}
            onChange={(e) => setType(e.target.value as FieldType)}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {FIELD_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>

        {type === "select" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-options">Options (one per line)</Label>
            <Textarea
              id="f-options"
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder={"Hot\nWarm\nCold"}
              rows={4}
            />
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="size-4 cursor-pointer rounded border-input accent-[var(--primary)]"
          />
          Required
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : field ? "Save" : "Create field"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
