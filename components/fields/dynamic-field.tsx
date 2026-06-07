"use client";

import type { FieldDefinition } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Value = string | number | boolean | null;

interface Props {
  field: FieldDefinition;
  value: Value;
  onChange: (value: Value) => void;
}

/** Renders the right input for a custom field's type. */
export function DynamicFieldInput({ field, value, onChange }: Props) {
  const id = `field-${field.key}`;

  if (field.type === "checkbox") {
    return (
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-2 text-sm font-medium"
      >
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 cursor-pointer rounded border-input accent-[var(--primary)]"
        />
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
      </label>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>

      {field.type === "textarea" ? (
        <Textarea
          id={id}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "select" ? (
        <Select
          id={id}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">—</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          id={id}
          type={
            field.type === "number"
              ? "number"
              : field.type === "date"
                ? "date"
                : field.type === "email"
                  ? "email"
                  : field.type === "phone"
                    ? "tel"
                    : "text"
          }
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
