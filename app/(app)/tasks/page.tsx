import { PageHeader } from "@/components/layout/page-header";
import { TasksView } from "@/components/tasks/tasks-view";
import { requireUserId } from "@/lib/auth";
import { listTasks } from "@/lib/data/tasks";
import { listClients } from "@/lib/data/clients";

export default async function TasksPage() {
  const userId = await requireUserId();
  const [tasks, clients] = await Promise.all([
    listTasks(userId),
    listClients(userId),
  ]);
  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Follow-ups and to-dos, grouped by due date. Link any task to a client."
      />
      <TasksView tasks={tasks} clients={clientOptions} />
    </>
  );
}
