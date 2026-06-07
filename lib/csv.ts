/** Minimal RFC-4180 CSV serializer (shared, no deps). */
export function toCSV(rows: (string | number | boolean | null)[][]): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

function escapeCell(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
