import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Turn a human label into a safe snake_case key for custom fields. */
export function slugifyKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

/**
 * Local date as YYYY-MM-DD (matches how due_date values are stored).
 * Uses the runtime's timezone. For "today"/"overdue" to match your local day
 * in production, set the server TZ env (e.g. TZ=Asia/Kuala_Lumpur on Vercel);
 * otherwise the server defaults to UTC. See .env.example.
 */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Compare two custom-field values for sorting. Number fields compare
 * numerically (not lexicographically); empty values always sort last,
 * regardless of direction.
 */
export function compareCustomValues(
  a: unknown,
  b: unknown,
  type: string,
  dir: "asc" | "desc",
): number {
  const ea = a === null || a === undefined || a === "";
  const eb = b === null || b === undefined || b === "";
  if (ea && eb) return 0;
  if (ea) return 1;
  if (eb) return -1;

  let r: number;
  if (type === "number") {
    const na = Number(a);
    const nb = Number(b);
    r = Number.isNaN(na) || Number.isNaN(nb) ? 0 : na - nb;
  } else {
    // ISO dates sort chronologically as text, so this also handles "date".
    r = String(a).localeCompare(String(b));
  }
  return dir === "desc" ? -r : r;
}

export function formatBytes(n: number | null | undefined): string {
  if (!n) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
