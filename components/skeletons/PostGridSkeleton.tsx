import { PostCardSkeleton } from "./PostCardSkeleton";

// Grid skeleton matching PostGrid's columns/gaps (FRONTEND §2.5). Renders a default
// of 6 cards (≈ half a 12-per-page index) — enough to fill the first viewport.
export function PostGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <PostCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
