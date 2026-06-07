import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { TrashList } from "@/components/clients/trash-list";
import { requireUserId } from "@/lib/auth";
import { listDeletedClients } from "@/lib/data/clients";

export default async function TrashPage() {
  const userId = await requireUserId();
  const clients = await listDeletedClients(userId);

  return (
    <>
      <PageHeader title="Trash" description="Deleted clients. Restore or remove permanently.">
        <Link
          href="/clients"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft /> Back to clients
        </Link>
      </PageHeader>
      <div className="p-4 md:p-6">
        <TrashList clients={clients} />
      </div>
    </>
  );
}
