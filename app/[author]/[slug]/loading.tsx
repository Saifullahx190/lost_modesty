import { LoadingRegion } from "@/components/skeletons/Skeleton";
import { ArticleSkeleton } from "@/components/skeletons/ArticleSkeleton";

// Article loading UI — overrides the root grid skeleton for the read surface.
export default function Loading() {
  return (
    <LoadingRegion>
      <ArticleSkeleton />
    </LoadingRegion>
  );
}
