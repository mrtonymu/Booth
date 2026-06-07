import { HeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ClientsLoading() {
  return (
    <>
      <HeaderSkeleton />
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-9 w-full" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    </>
  );
}
