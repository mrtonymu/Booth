"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating action button — mobile only (hidden on desktop, where headers carry
 * the primary action). Sits above the bottom tab bar, in the thumb zone.
 */
export function Fab({
  href,
  onClick,
  label,
  className,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  const cls = cn(
    "fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:hidden",
    className,
  );
  if (href) {
    return (
      <Link href={href} aria-label={label} className={cls}>
        <Plus className="size-6" />
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cls}>
      <Plus className="size-6" />
    </button>
  );
}
