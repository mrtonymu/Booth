"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Badge, TAG_COLOR_CLASSES } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tag, TagColor } from "@/lib/types";

interface Props {
  tags: Tag[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function TagPicker({ tags, selected, onChange }: Props) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  }

  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tags yet.{" "}
        <Link href="/settings/tags" className="text-primary hover:underline">
          Create one
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const active = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-all",
              active
                ? TAG_COLOR_CLASSES[tag.color as TagColor] ??
                    TAG_COLOR_CLASSES.gray
                : "border-border bg-transparent text-muted-foreground hover:bg-accent",
            )}
          >
            {active && <Check className="size-3" />}
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}

/** Read-only display of a client's tags. */
export function TagList({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <Badge key={t.id} color={t.color as TagColor}>
          {t.name}
        </Badge>
      ))}
    </div>
  );
}
