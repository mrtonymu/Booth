/**
 * Local demo mode.
 *
 * When DEMO_MODE=true, the app runs WITHOUT Clerk or Supabase: auth returns a
 * fixed demo user and all data lives in an in-memory store (seeded below).
 * This lets you preview the full UI at localhost before wiring up real keys.
 * The real auth/data paths are untouched — flip DEMO_MODE=false to use them.
 */
import { DEFAULT_STAGES } from "@/lib/types";
import type {
  Activity,
  ActivityType,
  Client,
  ClientDocument,
  ClientWithTags,
  CustomData,
  FieldDefinition,
  PipelineStage,
  Tag,
  Task,
  TaskWithClient,
} from "@/lib/types";
import { compareCustomValues, slugifyKey } from "@/lib/utils";
import type { ClientInput, ListClientsParams } from "@/lib/data/clients";
import type { FieldInput } from "@/lib/data/fields";

export const DEMO_MODE = process.env.DEMO_MODE === "true";
export const DEMO_USER_ID = "demo-user";

// Bump when the store shape changes so a stale dev (hot-reload) store reseeds.
const STORE_VERSION = 5;

interface Store {
  _v: number;
  fields: FieldDefinition[];
  tags: Tag[];
  clients: Client[];
  clientTags: { client_id: string; tag_id: string }[];
  activities: Activity[];
  tasks: Task[];
  documents: ClientDocument[];
  stages: PipelineStage[];
}

// Persist the store on globalThis so it survives across requests in dev.
declare global {
  var __demoStore: Store | undefined;
}

const O = DEMO_USER_ID;

function seed(): Store {
  const fields: FieldDefinition[] = [
    f("budget_rm", "Budget (RM)", "number", [], 0),
    f("preferred_area", "Preferred area", "select", [
      "Bukit Jalil",
      "Mont Kiara",
      "KLCC",
      "Cheras",
      "Bangsar",
    ], 1),
    f("property_type", "Property type", "select", [
      "Condo",
      "Serviced apt",
      "Landed",
      "SOHO",
    ], 2),
    f("viewing_date", "Viewing date", "date", [], 3),
    f("financing_ready", "Financing ready", "checkbox", [], 4),
  ];

  const tags: Tag[] = [
    t("tag_hot", "Hot lead", "red"),
    t("tag_warm", "Warm", "amber"),
    t("tag_signed", "Signed", "green"),
    t("tag_park", "Park Green", "blue"),
    t("tag_invest", "Investor", "violet"),
  ];

  const clients: Client[] = [
    c("cl_1", "Lim Wei Jie", "+60 12-345 6789", "weijie.lim@gmail.com", "viewing",
      { budget_rm: 850000, preferred_area: "Bukit Jalil", property_type: "Serviced apt", viewing_date: "2026-06-10", financing_ready: true },
      "2026-05-28T09:12:00Z", "2026-06-03T14:20:00Z"),
    c("cl_2", "Nurul Aisyah", "+60 13-876 5432", "nurul.aisyah@outlook.com", "contacted",
      { budget_rm: 1200000, preferred_area: "Mont Kiara", property_type: "Condo", viewing_date: null, financing_ready: false },
      "2026-05-30T03:40:00Z", "2026-06-02T08:05:00Z"),
    c("cl_3", "Tan Chee Keong", "+60 16-223 1190", "ck.tan@yahoo.com", "viewing",
      { budget_rm: 650000, preferred_area: "Cheras", property_type: "Condo", viewing_date: "2026-06-07", financing_ready: false },
      "2026-06-01T06:15:00Z", "2026-06-03T10:30:00Z"),
    c("cl_4", "Siti Rahmah", "+60 19-554 8821", "siti.r@gmail.com", "won",
      { budget_rm: 2000000, preferred_area: "KLCC", property_type: "Serviced apt", viewing_date: null, financing_ready: true },
      "2026-05-20T02:00:00Z", "2026-06-01T11:45:00Z"),
    c("cl_5", "David Wong", "+60 11-2098 7766", "davidwong.my@gmail.com", "new",
      { budget_rm: 980000, preferred_area: "Bangsar", property_type: "Landed", viewing_date: null, financing_ready: false },
      "2026-06-02T07:30:00Z", "2026-06-02T07:30:00Z"),
    c("cl_6", "Farah Lee", "+60 17-330 4455", "farah.lee@gmail.com", "offer",
      { budget_rm: 780000, preferred_area: "Bukit Jalil", property_type: "Serviced apt", viewing_date: "2026-06-12", financing_ready: true },
      "2026-06-03T05:10:00Z", "2026-06-03T16:00:00Z"),
  ];

  const clientTags = [
    { client_id: "cl_1", tag_id: "tag_hot" },
    { client_id: "cl_1", tag_id: "tag_park" },
    { client_id: "cl_2", tag_id: "tag_warm" },
    { client_id: "cl_2", tag_id: "tag_invest" },
    { client_id: "cl_3", tag_id: "tag_hot" },
    { client_id: "cl_4", tag_id: "tag_signed" },
    { client_id: "cl_4", tag_id: "tag_invest" },
    { client_id: "cl_5", tag_id: "tag_warm" },
    { client_id: "cl_6", tag_id: "tag_park" },
    { client_id: "cl_6", tag_id: "tag_hot" },
  ];

  const activities: Activity[] = [
    a("ac_1", "cl_1", "note", "Lead from Facebook ad — Park Green @ Bukit Jalil.", "2026-05-28T09:13:00Z"),
    a("ac_2", "cl_1", "call", "Called — interested in 2-bedroom facing pool. Asked about financing options.", "2026-05-30T02:20:00Z"),
    a("ac_3", "cl_1", "followup", "Site visit booked for Park Green show unit, 10 June 2pm.", "2026-06-03T14:20:00Z"),
    a("ac_4", "cl_4", "meeting", "Met at office, confirmed unit A-12-3. Reviewing SPA.", "2026-05-25T03:00:00Z"),
    a("ac_5", "cl_4", "note", "Signed SPA 🎉 — booking fee received.", "2026-06-01T11:45:00Z"),
    a("ac_6", "cl_3", "whatsapp", "Sent floor plans and pricing for Cheras condo.", "2026-06-03T10:30:00Z"),
  ];

  const tasks: Task[] = [
    tk("tk_1", "cl_3", "Send Cheras condo floor plans & pricing", "2026-06-04", false),
    tk("tk_2", "cl_6", "Prepare offer letter for Park Green unit", "2026-06-05", false),
    tk("tk_3", "cl_2", "Follow up on financing decision", "2026-06-06", false),
    tk("tk_4", "cl_1", "Confirm Park Green viewing time (10 June 2pm)", "2026-06-09", false),
    tk("tk_5", null, "Renew REN license", "2026-06-20", false),
    tk("tk_6", "cl_4", "Collect signed SPA documents", "2026-06-01", true),
  ];

  const documents: ClientDocument[] = [
    {
      id: "doc_1",
      owner_id: O,
      client_id: "cl_4",
      name: "SPA-summary.txt",
      mime: "text/plain",
      size: 14,
      url: "data:text/plain;base64,RGVtbyBkb2N1bWVudC4=",
      created_at: "2026-06-01T12:05:00Z",
    },
  ];

  const stages: PipelineStage[] = DEFAULT_STAGES.map((s, i) => ({
    id: `stg_${s.key}`,
    owner_id: O,
    key: s.key,
    label: s.label,
    color: s.color,
    position: i,
  }));

  return {
    _v: STORE_VERSION,
    fields,
    tags,
    clients,
    clientTags,
    activities,
    tasks,
    documents,
    stages,
  };
}

// ---- seed helpers ----
function f(key: string, label: string, type: FieldDefinition["type"], options: string[], position: number): FieldDefinition {
  return { id: `fld_${key}`, owner_id: O, key, label, type, options, position, required: false, created_at: "2026-05-20T00:00:00Z" };
}
function t(id: string, name: string, color: string): Tag {
  return { id, owner_id: O, name, color, created_at: "2026-05-20T00:00:00Z" };
}
function c(id: string, name: string, phone: string, email: string, stage: string, custom: CustomData, created: string, updated: string): Client {
  return { id, owner_id: O, name, phone, email, stage, custom_data: custom, created_at: created, updated_at: updated, deleted_at: null };
}
function a(id: string, client_id: string, type: ActivityType, content: string, created: string): Activity {
  return { id, client_id, owner_id: O, type, content, created_at: created };
}
function tk(id: string, client_id: string | null, title: string, due_date: string | null, done: boolean): Task {
  return { id, owner_id: O, client_id, title, due_date, done, created_at: "2026-06-01T00:00:00Z" };
}

export function getStore(): Store {
  if (!globalThis.__demoStore || globalThis.__demoStore._v !== STORE_VERSION) {
    globalThis.__demoStore = seed();
  }
  return globalThis.__demoStore;
}

const uid = (prefix: string) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
const now = () => new Date().toISOString();

function attachTags(store: Store, client: Client): ClientWithTags {
  const tagIds = store.clientTags
    .filter((ct) => ct.client_id === client.id)
    .map((ct) => ct.tag_id);
  const tags = store.tags
    .filter((tg) => tagIds.includes(tg.id))
    .sort((x, y) => x.name.localeCompare(y.name));
  // Copy custom_data so callers can't mutate the stored object by reference.
  return { ...client, custom_data: { ...client.custom_data }, tags };
}

// ---- fields ----
export function demoListFields(): FieldDefinition[] {
  return [...getStore().fields].sort((x, y) => x.position - y.position);
}
export function demoCreateField(input: FieldInput) {
  getStore().fields.push({
    id: uid("fld"), owner_id: O, created_at: now(),
    key: input.key, label: input.label, type: input.type,
    options: [...input.options], position: input.position, required: input.required,
  });
}
export function demoUpdateField(id: string, patch: Partial<FieldInput>) {
  const fld = getStore().fields.find((x) => x.id === id);
  if (fld) {
    Object.assign(fld, patch);
    if (patch.options) fld.options = [...patch.options];
  }
}
export function demoDeleteField(id: string) {
  const s = getStore();
  s.fields = s.fields.filter((x) => x.id !== id);
}

// ---- tags ----
export function demoListTags(): Tag[] {
  return [...getStore().tags].sort((x, y) => x.name.localeCompare(y.name));
}
export function demoCreateTag(name: string, color: string) {
  getStore().tags.push({ id: uid("tag"), owner_id: O, name, color, created_at: now() });
}
export function demoUpdateTag(id: string, patch: { name?: string; color?: string }) {
  const tg = getStore().tags.find((x) => x.id === id);
  if (tg) Object.assign(tg, patch);
}
export function demoDeleteTag(id: string) {
  const s = getStore();
  s.tags = s.tags.filter((x) => x.id !== id);
  s.clientTags = s.clientTags.filter((ct) => ct.tag_id !== id);
}
export function demoSetClientTags(clientId: string, tagIds: string[]) {
  const s = getStore();
  s.clientTags = s.clientTags.filter((ct) => ct.client_id !== clientId);
  for (const tag_id of tagIds) s.clientTags.push({ client_id: clientId, tag_id });
}

// ---- clients ----
export function demoListClients(params: ListClientsParams = {}): ClientWithTags[] {
  const s = getStore();
  let rows = s.clients.filter((cl) => cl.owner_id === O && !cl.deleted_at);

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter((cl) =>
      [cl.name, cl.phone ?? "", cl.email ?? ""].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }
  if (params.tagId) {
    const ids = new Set(
      s.clientTags.filter((ct) => ct.tag_id === params.tagId).map((ct) => ct.client_id),
    );
    rows = rows.filter((cl) => ids.has(cl.id));
  }

  const sort = params.sort ?? "updated_at";
  if (sort.startsWith("custom:")) {
    // "custom:<type>:<key>" — match the real path's type-aware ordering.
    const [, type = "text", ...keyParts] = sort.split(":");
    const key = keyParts.join(":");
    const dir = params.dir === "asc" ? "asc" : "desc";
    rows = [...rows].sort((x, y) =>
      compareCustomValues(x.custom_data?.[key], y.custom_data?.[key], type, dir),
    );
  } else {
    const dirNum = params.dir === "asc" ? 1 : -1;
    const field: "name" | "created_at" | "updated_at" =
      sort === "name" ? "name" : sort === "created_at" ? "created_at" : "updated_at";
    rows = [...rows].sort((x, y) =>
      x[field] < y[field] ? -dirNum : x[field] > y[field] ? dirNum : 0,
    );
  }

  return rows.map((cl) => attachTags(s, cl));
}
export function demoGetClient(id: string): ClientWithTags | null {
  const s = getStore();
  const cl = s.clients.find(
    (x) => x.id === id && x.owner_id === O && !x.deleted_at,
  );
  return cl ? attachTags(s, cl) : null;
}
export function demoCreateClient(input: ClientInput): string {
  const id = uid("cl");
  getStore().clients.push({
    id, owner_id: O, name: input.name, phone: input.phone, email: input.email,
    stage: input.stage ?? "new", custom_data: { ...input.custom_data },
    created_at: now(), updated_at: now(), deleted_at: null,
  });
  return id;
}
export function demoUpdateClient(id: string, input: ClientInput) {
  const cl = getStore().clients.find((x) => x.id === id && x.owner_id === O);
  if (cl)
    Object.assign(cl, input, {
      custom_data: { ...input.custom_data },
      updated_at: now(),
    });
}
export function demoUpdateClientStage(id: string, stage: string) {
  const cl = getStore().clients.find((x) => x.id === id && x.owner_id === O);
  if (cl) {
    cl.stage = stage;
    cl.updated_at = now();
  }
}
/** Soft delete — flag deleted_at so it's recoverable from the trash. */
export function demoDeleteClient(id: string) {
  const cl = getStore().clients.find((x) => x.id === id && x.owner_id === O);
  if (cl) cl.deleted_at = now();
}
export function demoRestoreClient(id: string) {
  const cl = getStore().clients.find((x) => x.id === id && x.owner_id === O);
  if (cl) cl.deleted_at = null;
}
export function demoListDeletedClients(): ClientWithTags[] {
  const s = getStore();
  return s.clients
    .filter((cl) => cl.owner_id === O && cl.deleted_at)
    .sort((a, b) => (a.deleted_at! < b.deleted_at! ? 1 : -1))
    .map((cl) => attachTags(s, cl));
}
/** Permanent delete — removes the client and cascades related records. */
export function demoHardDeleteClient(id: string) {
  const s = getStore();
  s.clients = s.clients.filter((x) => x.id !== id);
  s.clientTags = s.clientTags.filter((ct) => ct.client_id !== id);
  s.activities = s.activities.filter((ac) => ac.client_id !== id);
  s.tasks = s.tasks.filter((tsk) => tsk.client_id !== id);
  s.documents = s.documents.filter((d) => d.client_id !== id);
}
export function demoBulkUpdateStage(ids: string[], stage: string) {
  const idset = new Set(ids);
  for (const c of getStore().clients) {
    if (idset.has(c.id) && c.owner_id === O) {
      c.stage = stage;
      c.updated_at = now();
    }
  }
}
export function demoBulkSoftDelete(ids: string[]) {
  const idset = new Set(ids);
  for (const c of getStore().clients) {
    if (idset.has(c.id) && c.owner_id === O) c.deleted_at = now();
  }
}
export function demoAddTagToClients(clientIds: string[], tagId: string) {
  const s = getStore();
  for (const clientId of clientIds) {
    const owned = s.clients.some((c) => c.id === clientId && c.owner_id === O);
    const exists = s.clientTags.some(
      (ct) => ct.client_id === clientId && ct.tag_id === tagId,
    );
    if (owned && !exists) s.clientTags.push({ client_id: clientId, tag_id: tagId });
  }
}

// ---- activities ----
export function demoListActivities(clientId: string): Activity[] {
  return getStore()
    .activities.filter((ac) => ac.client_id === clientId && ac.owner_id === O)
    .sort((x, y) => (x.created_at < y.created_at ? 1 : -1));
}
export function demoCreateActivity(clientId: string, type: ActivityType, content: string) {
  getStore().activities.push({ id: uid("ac"), client_id: clientId, owner_id: O, type, content, created_at: now() });
}
export function demoDeleteActivity(id: string) {
  const s = getStore();
  s.activities = s.activities.filter((x) => x.id !== id);
}

export function demoListRecentActivities(limit: number): Activity[] {
  return getStore()
    .activities.filter((ac) => ac.owner_id === O)
    .sort((x, y) => (x.created_at < y.created_at ? 1 : -1))
    .slice(0, limit);
}

// ---- tasks ----
export function demoListTasks(clientId?: string): TaskWithClient[] {
  const s = getStore();
  return s.tasks
    .filter((t) => t.owner_id === O)
    .filter((t) => (clientId ? t.client_id === clientId : true))
    .map((t) => ({
      ...t,
      client_name: t.client_id
        ? (s.clients.find((c) => c.id === t.client_id)?.name ?? null)
        : null,
    }))
    .sort((x, y) => {
      // Open before done; then by due date (nulls last); then newest.
      if (x.done !== y.done) return x.done ? 1 : -1;
      if (x.due_date && y.due_date) return x.due_date < y.due_date ? -1 : 1;
      if (x.due_date) return -1;
      if (y.due_date) return 1;
      return x.created_at < y.created_at ? 1 : -1;
    });
}
export function demoCreateTask(
  clientId: string | null,
  title: string,
  dueDate: string | null,
) {
  getStore().tasks.push({
    id: uid("tk"),
    owner_id: O,
    client_id: clientId,
    title,
    due_date: dueDate,
    done: false,
    created_at: now(),
  });
}
export function demoToggleTask(id: string, done: boolean) {
  const t = getStore().tasks.find((x) => x.id === id);
  if (t) t.done = done;
}
export function demoDeleteTask(id: string) {
  const s = getStore();
  s.tasks = s.tasks.filter((x) => x.id !== id);
}

// ---- documents ----
export function demoListDocuments(clientId: string): ClientDocument[] {
  return getStore()
    .documents.filter((d) => d.owner_id === O && d.client_id === clientId)
    .sort((x, y) => (x.created_at < y.created_at ? 1 : -1));
}
export function demoCreateDocument(
  clientId: string,
  input: { name: string; mime: string | null; size: number; url: string },
) {
  // Cap total in-memory demo storage so long dev sessions can't OOM.
  const total = getStore().documents.reduce((s, d) => s + (d.size ?? 0), 0);
  if (total + input.size > 50 * 1024 * 1024) {
    throw new Error("Demo storage limit reached (50 MB). Refresh to reset.");
  }
  getStore().documents.push({
    id: uid("doc"),
    owner_id: O,
    client_id: clientId,
    name: input.name,
    mime: input.mime,
    size: input.size,
    url: input.url,
    created_at: now(),
  });
}
export function demoDeleteDocument(id: string) {
  const s = getStore();
  s.documents = s.documents.filter((d) => d.id !== id);
}

// ---- pipeline stages ----
export function demoListStages(): PipelineStage[] {
  return [...getStore().stages].sort((a, b) => a.position - b.position);
}
export function demoCreateStage(label: string, color: string) {
  const s = getStore();
  let key = slugifyKey(label);
  if (!key) throw new Error("Label must contain letters or numbers");
  if (s.stages.some((x) => x.key === key)) {
    let i = 2;
    while (s.stages.some((x) => x.key === `${key}_${i}`)) i++;
    key = `${key}_${i}`;
  }
  s.stages.push({
    id: uid("stg"),
    owner_id: O,
    key,
    label,
    color,
    position: s.stages.length,
  });
}
export function demoUpdateStage(
  id: string,
  patch: { label?: string; color?: string },
) {
  const stg = getStore().stages.find((x) => x.id === id);
  if (stg) Object.assign(stg, patch);
}
export function demoDeleteStage(id: string) {
  const s = getStore();
  if (s.stages.length <= 1) throw new Error("Keep at least one stage");
  const target = s.stages.find((x) => x.id === id);
  if (!target) return;
  const fallback = s.stages.find((x) => x.id !== id)!;
  for (const c of s.clients) if (c.stage === target.key) c.stage = fallback.key;
  s.stages = s.stages.filter((x) => x.id !== id);
}
