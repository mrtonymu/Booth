import { PageHeader } from "@/components/layout/page-header";
import {
  CalendarView,
  type CalendarEvent,
} from "@/components/calendar/calendar-view";
import { requireUserId } from "@/lib/auth";
import { listTasks } from "@/lib/data/tasks";
import { listClients } from "@/lib/data/clients";
import { listFields } from "@/lib/data/fields";
import { todayISO } from "@/lib/utils";

export default async function CalendarPage() {
  const userId = await requireUserId();
  const [tasks, clients, fields] = await Promise.all([
    listTasks(userId),
    listClients(userId),
    listFields(userId),
  ]);

  const dateFields = fields.filter((f) => f.type === "date");
  const events: CalendarEvent[] = [];

  // Open tasks with a due date.
  for (const t of tasks) {
    if (t.due_date && !t.done) {
      events.push({
        date: t.due_date,
        title: t.title,
        kind: "task",
        href: t.client_id ? `/clients/${t.client_id}` : "/tasks",
      });
    }
  }

  // Date-type custom field values (e.g. "Viewing date").
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  for (const c of clients) {
    for (const f of dateFields) {
      const v = c.custom_data?.[f.key];
      if (typeof v === "string" && ISO_DATE.test(v)) {
        events.push({
          date: v,
          title: `${c.name} · ${f.label}`,
          kind: "date",
          href: `/clients/${c.id}`,
        });
      }
    }
  }

  const today = todayISO();
  const [y, m] = today.split("-");

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Open tasks and key client dates in one view. Blue = tasks, purple = client dates."
      />
      <div className="p-4 md:p-6">
        <CalendarView
          events={events}
          initialYear={Number(y)}
          initialMonth={Number(m) - 1}
          today={today}
        />
      </div>
    </>
  );
}
