import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/** A page header placeholder matching <PageHeader>. */
export function HeaderSkeleton() {
  return (
    <div className="border-b border-border px-4 py-4 md:px-6 md:py-5">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-2 h-4 w-56" />
    </div>
  );
}

/** A few stacked card rows (used by list/detail loading states). */
export function CardListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}
