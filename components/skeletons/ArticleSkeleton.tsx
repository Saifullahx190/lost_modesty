import { Skeleton } from "./Skeleton";

// Mirrors the article page layout (ArticleHeader + ArticleBody) within the same
// max-w-article column so there's no shift when the real content swaps in
// (FRONTEND §1.3 CLS). Title → byline → tags → hero cover → body paragraphs.
export function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-article px-4 py-10">
      {/* header block */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-11/12" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      {/* hero cover — same 16:10 box the real cover reserves */}
      <Skeleton className="mt-4 aspect-cover w-full rounded-lg" />
      {/* body paragraphs */}
      <div className="mt-8 flex flex-col gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}
