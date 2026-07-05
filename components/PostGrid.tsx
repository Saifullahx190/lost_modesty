import type { Post } from "@/lib/content/types";
import { PostCard } from "./PostCard";

// Index card grid (FRONTEND §2.5): 2-column on desktop/tablet, single column on
// mobile, capped at 2 columns (the max-w-index container does the capping — never
// a 3rd column even on wide screens, §2.5). auto-fit/minmax keeps it fluid between.
// First card gets `priority` so its cover is the eager LCP image (§2.6).
export function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2">
      {posts.map((post, i) => (
        <li key={post.id}>
          <PostCard post={post} priority={i === 0} />
        </li>
      ))}
    </ul>
  );
}
