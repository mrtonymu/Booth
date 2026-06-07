import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ClientForm } from "@/components/clients/client-form";
import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth";
import { listFields } from "@/lib/data/fields";
import { listTags } from "@/lib/data/tags";

export default async function NewClientPage() {
  const userId = await requireUserId();
  const [fields, tags] = await Promise.all([
    listFields(userId),
    listTags(userId),
  ]);

  return (
    <>
      <PageHeader title="New client">
        <Link
          href="/clients"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft /> Back
        </Link>
      </PageHeader>
      <ClientForm fields={fields} tags={tags} />
    </>
  );
}
