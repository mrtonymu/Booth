import { PageHeader } from "@/components/layout/page-header";
import { SettingsTabs } from "@/components/layout/settings-tabs";
import { StagesManager } from "@/components/stages/stages-manager";
import { requireUserId } from "@/lib/auth";
import { listStages } from "@/lib/data/stages";

export default async function StagesPage() {
  const userId = await requireUserId();
  const stages = await listStages(userId);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Customize your sales pipeline stages — rename, recolor, add or remove."
      />
      <SettingsTabs />
      <StagesManager stages={stages} />
    </>
  );
}
