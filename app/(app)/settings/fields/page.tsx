import { PageHeader } from "@/components/layout/page-header";
import { SettingsTabs } from "@/components/layout/settings-tabs";
import { FieldsManager } from "@/components/fields/fields-manager";
import { requireUserId } from "@/lib/auth";
import { listFields } from "@/lib/data/fields";

export default async function FieldsPage() {
  const userId = await requireUserId();
  const fields = await listFields(userId);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Define your own fields. They appear on every client form, the table, and CSV import/export."
      />
      <SettingsTabs />
      <FieldsManager fields={fields} />
    </>
  );
}
