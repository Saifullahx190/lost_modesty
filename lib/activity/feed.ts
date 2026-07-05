import { commentsForUser } from "@/lib/comments/store.mjs";
import { bookmarksForUser } from "@/lib/bookmarks/store.mjs";
import { getPostsByAuthor, getPostById, postHref } from "@/lib/content/repo";
import type { SessionUser } from "@/lib/auth/session";
import { mergeActivity } from "./merge.mjs";

// Activity feed for one user (REBUILD §4 Phase 6 #11). Derives a minimal recent-
// activity list from the SAME stores the rest of the app uses — comments the user
// wrote, posts they authored, articles they bookmarked — with no new event table
// (the plan: "derivable from existing event data"). The pure merge/ordering lives
// in feed.mjs; here we resolve each event's article through the content repo.

export interface ActivityItem {
  kind: "comment" | "bookmark" | "post";
  date: string;
  post: { title: string; href: string };
  /** kind=comment: the `#comment-{id}` anchor on the article. */
  commentId?: string;
  /** kind=comment: the comment text, for a one-line preview. */
  snippet?: string;
}

export function activityForUser(user: SessionUser): ActivityItem[] {
  const comments = commentsForUser(user.id);
  const bookmarks = bookmarksForUser(user.id);
  // Only authors have authored posts; a reader's `posts` source is empty.
  const posts =
    user.role === "author" && user.authorSlug ? getPostsByAuthor(user.authorSlug) : [];

  const raw = mergeActivity({ comments, bookmarks, posts });

  const items: ActivityItem[] = [];
  for (const r of raw) {
    const post = getPostById(r.postId);
    if (!post) continue; // never surface an event whose article no longer resolves
    items.push({
      kind: r.kind,
      date: r.date,
      post: { title: post.title, href: postHref(post) },
      commentId: r.commentId,
      snippet: r.snippet,
    });
  }
  return items;
}
