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

/**
 * Default WhatsApp opening message. `{name}` is replaced with the client's
 * name; the surrounding * makes it bold in WhatsApp. Editable in Settings →
 * WhatsApp, so this is only the fallback when nothing has been saved.
 */
export const DEFAULT_WHATSAPP_TEMPLATE = `Hi *{name}* 👋

This is Tony From IOI City Mall

You can save my contact first ya 😆`;

/**
 * Fill a WhatsApp template with a client's name. Case-insensitive `{name}`
 * (so {Name}/{NAME} also work). A blank name just drops the token.
 */
export function renderWhatsappMessage(
  template: string,
  name: string | null | undefined,
): string {
  return template.replace(/\{name\}/gi, (name ?? "").trim());
}

/**
 * Build a wa.me link from a phone number. Strips +, spaces, dashes, etc., so
 * "+60 12-345 6789" → "https://wa.me/60123456789".
 *
 * A leading 0 (local format, e.g. "012-345 6789") is treated as a Malaysian
 * number and gets +60 — change "60" below if your clients are mostly elsewhere.
 * Returns null if there aren't enough digits.
 *
 * Pass `template` (+ `name`) to pre-fill the chat with a message via `?text=`,
 * so tapping the button opens WhatsApp with the greeting already typed.
 */
export function whatsappLink(
  phone: string | null | undefined,
  opts?: { name?: string | null; template?: string | null },
): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "60" + digits.slice(1);
  if (digits.length < 8) return null;
  const base = `https://wa.me/${digits}`;
  const template = opts?.template;
  if (!template || !template.trim()) return base;
  const msg = renderWhatsappMessage(template, opts?.name);
  return `${base}?text=${encodeURIComponent(msg)}`;
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

const pad2 = (n: number) => String(n).padStart(2, "0");

/** ISO timestamp → value for an <input type="datetime-local"> (local time). */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** datetime-local value (local wall-clock) → ISO timestamp (UTC), or null. */
export function localInputToISO(local: string | null | undefined): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** ISO timestamp → local YYYY-MM-DD (for placing on the calendar grid). */
export function isoToLocalDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** ISO timestamp → short local time like "2:00 pm". */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
