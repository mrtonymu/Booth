import { Badge } from "@/components/ui/badge";
import { STAGE_COLORS, STAGE_LABELS, type TagColor } from "@/lib/types";

export function StageBadge({ stage }: { stage: string }) {
  return (
    <Badge color={(STAGE_COLORS[stage] ?? "gray") as TagColor}>
      {STAGE_LABELS[stage] ?? stage}
    </Badge>
  );
}
