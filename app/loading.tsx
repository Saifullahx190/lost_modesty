import { LoadingRegion } from "@/components/skeletons/Skeleton";
import { PostGridSkeleton } from "@/components/skeletons/PostGridSkeleton";
import { Skeleton } from "@/components/skeletons/Skeleton";

// Root loading UI — cascades to the index and all archive routes (category, tag,
// author) that don't define their own. Matches IndexView's container + header rhythm
// so the shimmer occupies the same box the real content will (no CLS).
export default function Loading() {
  return (
    <LoadingRegion>
      <div className="mx-auto max-w-index px-4 py-10">
        <div className="mb-10 flex flex-col gap-4">
          <Skeleton className="h-9 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <PostGridSkeleton />
      </div>
    </LoadingRegion>
  );
}
