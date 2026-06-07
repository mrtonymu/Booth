import Link from "next/link";
import { Users, UserPlus, Trophy, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskRow } from "@/components/tasks/task-row";
import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { listTasks } from "@/lib/data/tasks";
import { listRecentActivities } from "@/lib/data/activities";
import { listStages } from "@/lib/data/stages";
import { formatDateTime, todayISO } from "@/lib/utils";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";

const STAGE_BAR: Record<string, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
  gray: "bg-slate-400",
};

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [clients, tasks, recent, stages] = await Promise.all([
    listClients(userId),
    listTasks(userId),
    listRecentActivities(userId, 6),
    listStages(userId),
  ]);

  const today = todayISO();
  const thisMonth = today.slice(0, 7);

  const newThisMonth = clients.filter(
    (c) => c.created_at.slice(0, 7) === thisMonth,
  ).length;
  const won = clients.filter((c) => c.stage === "won").length;

  const openTasks = tasks.filter((t) => !t.done);
  const overdue = openTasks.filter(
    (t) => t.due_date && t.due_date < today,
  ).length;
  const upcoming = openTasks.slice(0, 6);

  const stageCounts = stages.map((s) => ({
    ...s,
    count: clients.filter((c) => c.stage === s.key).length,
  }));
  const maxStage = Math.max(1, ...stageCounts.map((s) => s.count));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your pipeline and follow-ups at a glance."
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total clients" value={clients.length} icon={Users} />
          <StatCard
            label="New this month"
            value={newThisMonth}
            icon={UserPlus}
          />
          <StatCard label="Won" value={won} icon={Trophy} />
          <StatCard
            label="Open tasks"
            value={openTasks.length}
            icon={ListChecks}
            hint={overdue > 0 ? `${overdue} overdue` : undefined}
            tone="danger"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pipeline overview */}
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Pipeline</h2>
              <Link
                href="/pipeline"
                className="text-xs text-primary hover:underline"
              >
                Open board →
              </Link>
            </div>
            <div className="space-y-2.5">
              {stageCounts.map((s) => (
                <div key={s.key} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-muted-foreground">
                    {s.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${STAGE_BAR[s.color] ?? "bg-slate-400"}`}
                      style={{ width: `${(s.count / maxStage) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-medium">{s.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming tasks */}
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Upcoming tasks</h2>
              <Link
                href="/tasks"
                className="text-xs text-primary hover:underline"
              >
                All tasks →
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing due. You&apos;re all caught up.
              </p>
            ) : (
              <div className="-mx-1">
                {upcoming.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Recent activity */}
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity logged yet.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {recent.map((a) => (
                <li key={a.id} className="flex gap-2 text-sm">
                  <span className="shrink-0 font-medium text-muted-foreground">
                    {ACTIVITY_TYPE_LABELS[a.type]}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{a.content}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(a.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex gap-2">
          <Link href="/clients/new" className={buttonVariants({ size: "sm" })}>
            New client
          </Link>
          <Link
            href="/clients"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            View all clients
          </Link>
        </div>
      </div>
    </>
  );
}
