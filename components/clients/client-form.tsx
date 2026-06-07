"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DynamicFieldInput } from "@/components/fields/dynamic-field";
import { TagPicker } from "@/components/tags/tag-picker";
import {
  createClientAction,
  updateClientAction,
  type ClientFormPayload,
} from "@/app/(app)/clients/actions";
import {
  PIPELINE_STAGES,
  type ClientWithTags,
  type FieldDefinition,
  type Tag,
} from "@/lib/types";

type CustomValue = string | boolean | null;

function initialCustom(
  fields: FieldDefinition[],
  client?: ClientWithTags,
): Record<string, CustomValue> {
  const out: Record<string, CustomValue> = {};
  for (const f of fields) {
    const v = client?.custom_data?.[f.key];
    if (f.type === "checkbox") out[f.key] = Boolean(v);
    else if (v === null || v === undefined) out[f.key] = "";
    else out[f.key] = String(v);
  }
  return out;
}

export function ClientForm({
  fields,
  tags,
  client,
}: {
  fields: FieldDefinition[];
  tags: Tag[];
  client?: ClientWithTags;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(client?.name ?? "");
  const [phone, setPhone] = React.useState(client?.phone ?? "");
  const [email, setEmail] = React.useState(client?.email ?? "");
  const [stage, setStage] = React.useState(client?.stage ?? "new");
  const [custom, setCustom] = React.useState(() =>
    initialCustom(fields, client),
  );
  const [tagIds, setTagIds] = React.useState<string[]>(
    client?.tags.map((t) => t.id) ?? [],
  );
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  function setFieldValue(key: string, value: string | number | boolean | null) {
    setCustom((prev) => ({ ...prev, [key]: value as CustomValue }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: ClientFormPayload = {
      name,
      phone,
      email,
      stage,
      custom,
      tagIds,
    };
    const res = client
      ? await updateClientAction(client.id, payload)
      : await createClientAction(payload);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong");
      setSaving(false);
      return;
    }
    router.push(`/clients/${client?.id ?? res.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      {/* Fixed fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="c-name">
            Name<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="c-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoFocus
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-phone">Phone</Label>
          <Input
            id="c-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+60 12-345 6789"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-email">Email</Label>
          <Input
            id="c-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-stage">Pipeline stage</Label>
          <Select
            id="c-stage"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            {PIPELINE_STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Custom fields */}
      {fields.length > 0 && (
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div
                key={f.id}
                className={f.type === "textarea" ? "sm:col-span-2" : ""}
              >
                <DynamicFieldInput
                  field={f}
                  value={custom[f.key] ?? (f.type === "checkbox" ? false : "")}
                  onChange={(v) => setFieldValue(f.key, v)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Tags</h3>
        <TagPicker tags={tags} selected={tagIds} onChange={setTagIds} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-border pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : client ? "Save changes" : "Create client"}
        </Button>
      </div>
    </form>
  );
}
