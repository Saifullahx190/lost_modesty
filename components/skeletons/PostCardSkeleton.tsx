import { Skeleton } from "./Skeleton";

// Mirrors PostCard's box model EXACTLY so swapping skeleton → real card causes no
// layout shift (FRONTEND §1.3 CLS): same aspect-cover cover, same pt-3 gap stack,
// same number/height of text lines. If PostCard's structure changes, change this too.
export function PostCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-cover w-full rounded-lg" />
      <div className="flex flex-col gap-2 pt-3">
        {/* title: 2 lines at card-title size */}
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-3/4" />
        {/* byline */}
        <Skeleton className="h-4 w-1/2" />
        {/* excerpt: 2 lines at meta size */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        {/* tags */}
        <Skeleton className="mt-1 h-4 w-2/5" />
      </div>
    </div>
  );
}
