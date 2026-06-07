import { requireUserId } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { listFields } from "@/lib/data/fields";
import { toCSV } from "@/lib/csv";
import { STAGE_LABELS } from "@/lib/types";

export async function GET() {
  const userId = await requireUserId();
  const [fields, clients] = await Promise.all([
    listFields(userId),
    listClients(userId),
  ]);

  const header = [
    "Name",
    "Phone",
    "Email",
    "Stage",
    ...fields.map((f) => f.label),
    "Tags",
  ];

  const rows = clients.map((c) => [
    c.name,
    c.phone ?? "",
    c.email ?? "",
    STAGE_LABELS[c.stage] ?? c.stage,
    ...fields.map((f) => {
      const v = c.custom_data?.[f.key];
      if (f.type === "checkbox") return v ? "Yes" : "";
      return v === null || v === undefined ? "" : String(v);
    }),
    c.tags.map((t) => t.name).join("; "),
  ]);

  const csv = toCSV([header, ...rows]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients.csv"`,
    },
  });
}
