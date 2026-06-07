import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { TagList } from "@/components/tags/tag-picker";
import { Timeline } from "@/components/activities/timeline";
import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { StageBadge } from "@/components/clients/stage-badge";
import { ClientTasks } from "@/components/tasks/client-tasks";
import { ClientDocuments } from "@/components/documents/client-documents";
import { requireUserId } from "@/lib/auth";
import { getClient } from "@/lib/data/clients";
import { listFields } from "@/lib/data/fields";
import { listActivities } from "@/lib/data/activities";
import { listTasks } from "@/lib/data/tasks";
import { listDocuments } from "@/lib/data/documents";
import { listStages } from "@/lib/data/stages";
import { getSettings } from "@/lib/data/settings";
import { formatDate, whatsappLink } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import type { CustomData, FieldDefinition } from "@/lib/types";

function displayValue(field: FieldDefinition, value: CustomData[string]) {
  if (field.type === "checkbox") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "date") return formatDate(String(value));
  return String(value);
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const [client, fields, activities, tasks, documents, stages, settings] =
    await Promise.all([
      getClient(userId, id),
      listFields(userId),
      listActivities(userId, id),
      listTasks(userId, id),
      listDocuments(userId, id),
      listStages(userId),
      getSettings(userId),
    ]);

  if (!client) notFound();

  const waLink = whatsappLink(client.phone, {
    name: client.name,
    template: settings.whatsapp_template,
  });

  return (
    <>
      <PageHeader title={client.name}>
        <Link
          href="/clients"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft /> Back
        </Link>
        <Link
          href={`/clients/${client.id}/edit`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Pencil /> Edit
        </Link>
        <DeleteClientButton id={client.id} name={client.name} />
      </PageHeader>

      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* Profile */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 border-b border-border pb-3">
              <StageBadge stage={client.stage} stages={stages} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                {client.phone ? (
                  <a
                    href={`tel:${client.phone}`}
                    className="hover:text-primary hover:underline"
                  >
                    {client.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Message on WhatsApp"
                    title="Message on WhatsApp"
                    className="ml-auto inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <WhatsAppIcon className="size-3.5" /> WhatsApp
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                {client.email ? (
                  <a
                    href={`mailto:${client.email}`}
                    className="break-all hover:text-primary hover:underline"
                  >
                    {client.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>

            {client.tags.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <TagList tags={client.tags} />
              </div>
            )}
          </div>

          {fields.length > 0 && (
            <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {fields.map((f) => (
                <div
                  key={f.id}
                  className="flex justify-between gap-4 px-4 py-2.5 text-sm"
                >
                  <dt className="text-muted-foreground">{f.label}</dt>
                  <dd className="text-right font-medium">
                    {displayValue(f, client.custom_data?.[f.key] ?? null)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Documents
            </h2>
            <ClientDocuments clientId={client.id} documents={documents} />
          </div>

          <p className="px-1 text-xs text-muted-foreground">
            Added {formatDate(client.created_at)}
          </p>
        </div>

        {/* Tasks + activity timeline */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Tasks
            </h2>
            <ClientTasks clientId={client.id} tasks={tasks} />
          </div>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Activity
            </h2>
            <Timeline clientId={client.id} activities={activities} />
          </div>
        </div>
      </div>
    </>
  );
}
