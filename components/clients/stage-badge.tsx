import { Badge } from "@/components/ui/badge";
import {
  stageColor,
  stageLabel,
  type PipelineStage,
  type TagColor,
} from "@/lib/types";

export function StageBadge({
  stage,
  stages,
}: {
  stage: string;
  stages: PipelineStage[];
}) {
  return (
    <Badge color={stageColor(stages, stage) as TagColor}>
      {stageLabel(stages, stage)}
    </Badge>
  );
}
