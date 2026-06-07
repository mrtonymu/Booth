import { PageHeader } from "@/components/layout/page-header";
import { PipelineBoard } from "@/components/clients/pipeline-board";
import { requireUserId } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";

export default async function PipelinePage() {
  const userId = await requireUserId();
  // Sort by name so cards have a stable order within each column.
  const clients = await listClients(userId, { sort: "name", dir: "asc" });

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Drag clients between stages, or use the stage menu on each card (works on touch too)."
      />
      <PipelineBoard clients={clients} />
    </>
  );
}
