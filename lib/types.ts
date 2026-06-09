/** Shared domain types for the CRM. */

export const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "checkbox",
  "phone",
  "email",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Text",
  textarea: "Long text",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  checkbox: "Checkbox",
  phone: "Phone",
  email: "Email",
};

export interface FieldDefinition {
  id: string;
  owner_id: string;
  key: string;
  label: string;
  type: FieldType;
  options: string[];
  position: number;
  required: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  created_at: string;
}

export type CustomData = Record<string, string | number | boolean | null>;

// A user-editable pipeline stage (stored in the pipeline_stages table).
// `color` reuses the tag palette (TagColor).
export interface PipelineStage {
  id: string;
  owner_id: string;
  key: string;
  label: string;
  color: string;
  position: number;
}

// Seeded for every new user on first use; fully editable afterwards.
export const DEFAULT_STAGES = [
  { key: "new", label: "New lead", color: "blue" },
  { key: "contacted", label: "Contacted", color: "indigo" },
  { key: "viewing", label: "Viewing", color: "violet" },
  { key: "offer", label: "Offer", color: "amber" },
  { key: "won", label: "Won", color: "green" },
  { key: "lost", label: "Lost", color: "gray" },
] as const;

type StageLike = { key: string; label: string; color: string };

export function stageLabel(stages: StageLike[], key: string): string {
  return stages.find((s) => s.key === key)?.label ?? key;
}
export function stageColor(stages: StageLike[], key: string): string {
  return stages.find((s) => s.key === key)?.color ?? "gray";
}

export interface Client {
  id: string;
  owner_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  stage: string;
  /** Optional scheduled appointment (ISO timestamp); shown on the calendar. */
  appointment_at: string | null;
  custom_data: CustomData;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Client joined with its tags (used in list + detail views). */
export interface ClientWithTags extends Client {
  tags: Tag[];
}

export const ACTIVITY_TYPES = [
  "note",
  "call",
  "meeting",
  "whatsapp",
  "followup",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  note: "Note",
  call: "Call",
  meeting: "Meeting",
  whatsapp: "WhatsApp",
  followup: "Follow-up",
};

export interface Activity {
  id: string;
  client_id: string;
  owner_id: string;
  type: ActivityType;
  content: string;
  created_at: string;
}

export interface Task {
  id: string;
  owner_id: string;
  client_id: string | null;
  title: string;
  due_date: string | null;
  done: boolean;
  created_at: string;
}

/** Task joined with its client name (for the standalone tasks list). */
export interface TaskWithClient extends Task {
  client_name: string | null;
}

export interface ClientDocument {
  id: string;
  owner_id: string;
  client_id: string;
  name: string;
  mime: string | null;
  size: number | null;
  /** A ready-to-use download URL: a signed Storage URL (real) or data URL (demo). */
  url: string;
  created_at: string;
}

/** Tailwind-friendly palette for tags. */
export const TAG_COLORS = [
  "gray",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "indigo",
  "violet",
  "pink",
] as const;

export type TagColor = (typeof TAG_COLORS)[number];
