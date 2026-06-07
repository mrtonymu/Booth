"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Mail } from "lucide-react";
import { TagList } from "@/components/tags/tag-picker";
import { StageBadge } from "@/components/clients/stage-badge";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { whatsappLink } from "@/lib/utils";
import type { ClientWithTags, PipelineStage } from "@/lib/types";

export function ClientGallery({
  clients,
  stages,
  whatsappTemplate,
}: {
  clients: ClientWithTags[];
  stages: PipelineStage[];
  whatsappTemplate?: string;
}) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {clients.map((c) => {
        const wa = whatsappLink(c.phone, {
          name: c.name,
          template: whatsappTemplate,
        });
        return (
          // Card body is a mouse-click convenience; the name link below is the
          // keyboard/semantic navigation, so no nested interactive controls.
          <div
            key={c.id}
            onClick={() => router.push(`/clients/${c.id}`)}
            className="flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/clients/${c.id}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate font-medium hover:underline"
              >
                {c.name}
              </Link>
              <StageBadge stage={c.stage} stages={stages} />
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {c.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0" />
                  <span className="truncate">{c.phone}</span>
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Message ${c.name} on WhatsApp`}
                      title="WhatsApp"
                      className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-md text-[#25D366] transition-colors hover:bg-[#25D366]/10"
                    >
                      <WhatsAppIcon className="size-4" />
                    </a>
                  )}
                </div>
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
          </div>
        );
      })}
    </div>
  );
}
