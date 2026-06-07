import { PageHeader } from "@/components/layout/page-header";
import { SettingsTabs } from "@/components/layout/settings-tabs";
import { WhatsappTemplateForm } from "@/components/settings/whatsapp-template-form";
import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/data/settings";

export default async function WhatsappSettingsPage() {
  const userId = await requireUserId();
  const settings = await getSettings(userId);

  return (
    <>
      <PageHeader
        title="Settings"
        description="The message that pre-fills when you tap WhatsApp on a client — edit the text, keep {name} as the placeholder."
      />
      <SettingsTabs />
      <WhatsappTemplateForm template={settings.whatsapp_template} />
    </>
  );
}
