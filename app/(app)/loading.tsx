import { HeaderSkeleton, CardListSkeleton } from "@/components/ui/skeleton";

// Generic fallback shown while any app page streams from the server.
export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <div className="p-4 md:p-6">
        <CardListSkeleton />
      </div>
    </>
  );
}
