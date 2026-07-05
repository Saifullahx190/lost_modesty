import { allComments, commentsForUser } from "@/lib/comments/store.mjs";
import { getUser } from "@/lib/auth/users.mjs";
import { getPostsByAuthor, getPostById, postHref } from "@/lib/content/repo";
import type { SessionUser } from "@/lib/auth/session";
import { deriveNotifications, countUnread } from "./derive.mjs";
import { getReadAt } from "./store.mjs";

// Notifications for one user (REBUILD §4 Phase 6 #8). Derived from the comment
// store via the pure core; here we resolve each event's article + actor name and
// flag unread against the read-state store. Reading-only — never mutates.

export interface NotificationItem {
  type: "reply" | "comment_on_post";
  date: string;
  actor: string;
  post: { title: string; href: string };
  commentId: string;
  snippet: string;
  unread: boolean;
}

function rawFor(user: SessionUser) {
  const myCommentIds = commentsForUser(user.id).map((c) => c.id);
  const myPostIds =
    user.role === "author" && user.authorSlug
      ? getPostsByAuthor(user.authorSlug).map((p) => p.id)
      : [];
  return deriveNotifications({
    comments: allComments(),
    selfId: user.id,
    myCommentIds,
    myPostIds,
  });
}

export function notificationsForUser(user: SessionUser): NotificationItem[] {
  const readAt = getReadAt(user.id);
  const items: NotificationItem[] = [];
  for (const n of rawFor(user)) {
    const post = getPostById(n.postId);
    if (!post) continue; // never surface a notification whose article is gone
    items.push({
      type: n.type,
      date: n.date,
      actor: getUser(n.actorId)?.name ?? "একজন পাঠক",
      post: { title: post.title, href: postHref(post) },
      commentId: n.commentId,
      snippet: n.snippet,
      unread: !readAt || n.date > readAt,
    });
  }
  return items;
}

/** Unread count for the header bell — cheap, no post/actor resolution. */
export function unreadCountForUser(user: SessionUser): number {
  return countUnread(rawFor(user), getReadAt(user.id));
}
