// ───────────────────────────────────────────────────────────────────────────
// NOTIFICATION DERIVATION — pure core (REBUILD §1#8 "minimal unread count + list",
// §4 Phase 6 "read from existing data"). Notifications are DERIVED from the comment
// store, not stored separately: a user is notified when someone ELSE
//   • replies to one of their comments      → type "reply"
//   • comments on an article they authored   → type "comment_on_post"
// Authored as .mjs (JSDoc-typed) so node --test exercises the rules without a Next
// runtime or the repo — same convention as merge.mjs / draft.mjs.
// ───────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} RawNotification
 * @property {"reply"|"comment_on_post"} type
 * @property {string} date       ISO 8601 (the comment's createdAt).
 * @property {string} actorId    Who did it (stable user id).
 * @property {string} postId     Article it happened on.
 * @property {string} commentId  The comment (its `#comment-{id}` anchor).
 * @property {string} snippet    The comment text.
 */

/**
 * Newest-first notifications for a user. A reply that is ALSO on the user's own
 * post is classified as the more specific "reply" (else-if), so it's never
 * double-counted. The user's own comments never notify themselves.
 * @param {{
 *   comments?: {id: string, postId: string, userId: string, parentId: string|null, body: string, createdAt: string}[],
 *   selfId: string,
 *   myCommentIds?: string[],
 *   myPostIds?: string[],
 * }} input
 * @returns {RawNotification[]}
 */
export function deriveNotifications({ comments = [], selfId, myCommentIds = [], myPostIds = [] }) {
  const mine = new Set(myCommentIds);
  const posts = new Set(myPostIds);
  /** @type {RawNotification[]} */
  const out = [];
  for (const c of comments) {
    if (c.userId === selfId) continue; // your own actions aren't notifications
    let type = null;
    if (c.parentId && mine.has(c.parentId)) type = "reply";
    else if (posts.has(c.postId)) type = "comment_on_post";
    if (!type) continue;
    out.push({
      type,
      date: c.createdAt,
      actorId: c.userId,
      postId: c.postId,
      commentId: c.id,
      snippet: c.body,
    });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/**
 * How many of `notifications` are newer than the user's last-read mark. `readAt`
 * null (never read) ⇒ all are unread.
 * @param {{date: string}[]} notifications
 * @param {string | null} readAt ISO 8601 or null
 * @returns {number}
 */
export function countUnread(notifications, readAt) {
  if (!readAt) return notifications.length;
  return notifications.reduce((n, x) => n + (x.date > readAt ? 1 : 0), 0);
}
