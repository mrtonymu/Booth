"use client";

import { useRouter } from "next/navigation";
import { Phone, Mail } from "lucide-react";
import { TagList } from "@/components/tags/tag-picker";
import { StageBadge } from "@/components/clients/stage-badge";
import type { ClientWithTags, PipelineStage } from "@/lib/types";

export function ClientGallery({
  clients,
  stages,
}: {
  clients: ClientWithTags[];
  stages: PipelineStage[];
}) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {clients.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => router.push(`/clients/${c.id}`)}
          className="flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="truncate font-medium">{c.name}</span>
            <StageBadge stage={c.stage} stages={stages} />
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            {c.phone && (
              <p className="flex items-center gap-1.5">
                <Phone className="size-3.5 shrink-0" />
                <span className="truncate">{c.phone}</span>
              </p>
            )}
            {c.email && (
              <p className="flex items-center gap-1.5">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{c.email}</span>
              </p>
            )}
          </div>
          {c.tags.length > 0 && (
            <div className="mt-auto pt-1">
              <TagList tags={c.tags} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
