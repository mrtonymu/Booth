"use client";

import { useRouter } from "next/navigation";
import { TagList } from "@/components/tags/tag-picker";
import { StageBadge } from "@/components/clients/stage-badge";
import { formatDate } from "@/lib/utils";
import type {
  ClientWithTags,
  CustomData,
  FieldDefinition,
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
}: {
  clients: ClientWithTags[];
  fields: FieldDefinition[];
}) {
  const router = useRouter();
  // Show the first few custom fields as columns to keep the table readable.
  const cols = fields
    .filter((f) => f.type !== "textarea")
    .slice(0, 3);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
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
              <td className="px-4 py-3 font-medium">{c.name}</td>
              <td className="px-4 py-3">
                <StageBadge stage={c.stage} />
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
  );
}
