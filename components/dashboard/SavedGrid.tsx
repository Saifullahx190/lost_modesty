import type { Post } from "@/lib/content/types";
import { PostCard } from "@/components/PostCard";
import { getSeriesContext, postHref } from "@/lib/content/repo";

// Saved-bookmarks grid on the dashboard (REBUILD §4 Phase 4 #6 / FRONTEND §3.2
// Journey C). Reuses the index PostCard verbatim so a saved item looks identical
// to how the reader first met it — same 16:10 cover, same series part label, same
// CLS-safe sizing (design-system reuse over a bespoke saved-list style).
//
// The one addition over the plain grid is the series-resume affordance Journey C
// asks for: when a saved part has a NEXT part, a quiet "পরের পর্ব" link lets the
// reader continue the serialized story instead of re-opening the part they saved.
// Only rendered when a next part exists, so a final/standalone part shows nothing.
export function SavedGrid({ posts }: { posts: Post[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2">
      {posts.map((post) => {
        const next = getSeriesContext(post)?.next;
        return (
          <li key={post.id} className="flex flex-col">
            <PostCard post={post} />
            {next && (
              <a
                href={postHref(next)}
                className="mt-3 inline-flex items-center gap-1 self-start rounded-sm text-meta text-link hover:underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
              >
                পরের পর্ব: <span className="line-clamp-1">{next.title}</span>
                <span aria-hidden="true">→</span>
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
