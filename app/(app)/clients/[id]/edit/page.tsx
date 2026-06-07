import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ClientForm } from "@/components/clients/client-form";
import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth";
import { getClient } from "@/lib/data/clients";
import { listFields } from "@/lib/data/fields";
import { listTags } from "@/lib/data/tags";
import { listStages } from "@/lib/data/stages";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const [client, fields, tags, stages] = await Promise.all([
    getClient(userId, id),
    listFields(userId),
    listTags(userId),
    listStages(userId),
  ]);

  if (!client) notFound();

  return (
    <>
      <PageHeader title={`Edit ${client.name}`}>
        <Link
          href={`/clients/${client.id}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft /> Back
        </Link>
      </PageHeader>
      <ClientForm fields={fields} tags={tags} stages={stages} client={client} />
    </>
  );
}
