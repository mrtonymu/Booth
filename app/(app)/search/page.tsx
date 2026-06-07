import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { SearchBox } from "@/components/search/search-box";
import { StageBadge } from "@/components/clients/stage-badge";
import { TaskRow } from "@/components/tasks/task-row";
import { requireUserId } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { listTasks } from "@/lib/data/tasks";
import { listStages } from "@/lib/data/stages";
import type { ClientWithTags, PipelineStage, TaskWithClient } from "@/lib/types";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (raw ?? "").trim();

  let clients: ClientWithTags[] = [];
  let tasks: TaskWithClient[] = [];
  let stages: PipelineStage[] = [];

  if (q) {
    const [cl, allTasks, stg] = await Promise.all([
      listClients(userId, { search: q }),
      listTasks(userId),
      listStages(userId),
    ]);
    clients = cl;
    stages = stg;
    const lower = q.toLowerCase();
    tasks = allTasks.filter((t) => t.title.toLowerCase().includes(lower));
  }

  const empty = q && clients.length === 0 && tasks.length === 0;

  return (
    <>
      <PageHeader title="Search" description="Find clients and tasks." />
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <SearchBox initialQuery={q} autoFocus />

        {!q && (
          <p className="text-center text-sm text-muted-foreground">
            Type to search across your clients and tasks.
          </p>
        )}

        {empty && (
          <p className="text-center text-sm text-muted-foreground">
            No results for “{q}”.
          </p>
        )}

        {clients.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Clients ({clients.length})
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {clients.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/clients/${c.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/60"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {c.name}
                    </span>
                    {c.phone && (
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {c.phone}
                      </span>
                    )}
                    <StageBadge stage={c.stage} stages={stages} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tasks.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tasks ({tasks.length})
            </h2>
            <div className="rounded-lg border border-border bg-card">
              {tasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
