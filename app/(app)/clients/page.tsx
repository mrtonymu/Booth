import Link from "next/link";
import { Plus, Users, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ClientsToolbar } from "@/components/clients/clients-toolbar";
import { ClientTable } from "@/components/clients/client-table";
import { ClientGallery } from "@/components/clients/client-gallery";
import { ViewSwitcher } from "@/components/clients/view-switcher";
import { CsvControls } from "@/components/clients/csv-controls";
import { Fab } from "@/components/ui/fab";
import { requireUserId } from "@/lib/auth";
import { listClients } from "@/lib/data/clients";
import { listFields } from "@/lib/data/fields";
import { listTags } from "@/lib/data/tags";
import { listStages } from "@/lib/data/stages";
import { getSettings } from "@/lib/data/settings";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const dir = str(sp.dir) === "asc" ? "asc" : "desc";

  const [fields, tags, stages, settings, clients] = await Promise.all([
    listFields(userId),
    listTags(userId),
    listStages(userId),
    getSettings(userId),
    listClients(userId, {
      search: str(sp.q),
      tagId: str(sp.tag),
      sort: str(sp.sort),
      dir,
    }),
  ]);

  const filtered = Boolean(str(sp.q) || str(sp.tag));
  const view = str(sp.view) === "gallery" ? "gallery" : "table";

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${clients.length} ${clients.length === 1 ? "client" : "clients"}${filtered ? " (filtered)" : ""}`}
      >
        {/* Desktop actions; on mobile the FAB handles "new". */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/clients/trash"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Trash2 /> Trash
          </Link>
          <CsvControls hasClients={clients.length > 0} />
          <Link href="/clients/new" className={buttonVariants()}>
            <Plus /> New client
          </Link>
        </div>
      </PageHeader>

      <div className="space-y-4 p-4 md:p-6">
        <ClientsToolbar fields={fields} tags={tags} />

        {/* View toggle is a desktop power-feature; mobile is always cards. */}
        <div className="hidden items-center justify-between md:flex">
          <span className="text-xs text-muted-foreground">
            {clients.length} {clients.length === 1 ? "result" : "results"}
          </span>
          <ViewSwitcher />
        </div>

        {clients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              {filtered
                ? "No clients match your search."
                : "No clients yet. Add your first one to get started."}
            </p>
            {!filtered && (
              <Link
                href="/clients/new"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Plus /> New client
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: always a card list. */}
            <div className="md:hidden">
              <ClientGallery
                clients={clients}
                stages={stages}
                whatsappTemplate={settings.whatsapp_template}
              />
            </div>
            {/* Desktop: table or gallery per the toggle. */}
            <div className="hidden md:block">
              {view === "gallery" ? (
                <ClientGallery
                  clients={clients}
                  stages={stages}
                  whatsappTemplate={settings.whatsapp_template}
                />
              ) : (
                <ClientTable
                  clients={clients}
                  fields={fields}
                  stages={stages}
                  tags={tags}
                />
              )}
            </div>
          </>
        )}
      </div>

      <Fab href="/clients/new" label="New client" />
    </>
  );
}
