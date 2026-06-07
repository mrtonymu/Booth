import { PageHeader } from "@/components/layout/page-header";
import { SettingsTabs } from "@/components/layout/settings-tabs";
import { TagsManager } from "@/components/tags/tags-manager";
import { requireUserId } from "@/lib/auth";
import { listTags } from "@/lib/data/tags";

export default async function TagsPage() {
  const userId = await requireUserId();
  const tags = await listTags(userId);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Create colored labels to categorize and filter your clients."
      />
      <SettingsTabs />
      <TagsManager tags={tags} />
    </>
  );
}
