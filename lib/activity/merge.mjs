// ───────────────────────────────────────────────────────────────────────────
// ACTIVITY FEED — pure merge/sort core (REBUILD §4 Phase 6 #11 "activity history
// … derivable from existing event data … minimal recent-activity list"). Authored
// as .mjs (JSDoc-typed) so node --test exercises the merge/ordering without a Next
// runtime or the repo — same convention as ids.mjs / draft.mjs / migration.mjs.
//
// It only merges + orders already-fetched rows into one timeline; resolving each
// event's article (title/href) is the TS wrapper's job (lib/activity/feed.ts),
// because that needs the content repo.
// ───────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} RawActivity
 * @property {"comment"|"bookmark"|"post"} kind
 * @property {string} date       ISO 8601 — the event time.
 * @property {string} postId     Article the event is about (stable id).
 * @property {string} [commentId] For kind=comment: the `#comment-{id}` anchor.
 * @property {string} [snippet]  For kind=comment: the comment text.
 */

/**
 * Merge a user's comments, bookmarks, and authored posts into ONE newest-first
 * timeline. Pure + deterministic.
 * @param {{
 *   comments?: {id: string, postId: string, body: string, createdAt: string}[],
 *   bookmarks?: {postId: string, createdAt: string}[],
 *   posts?: {id: string, date: string}[],
 * }} sources
 * @returns {RawActivity[]}
 */
export function mergeActivity({ comments = [], bookmarks = [], posts = [] } = {}) {
  /** @type {RawActivity[]} */
  const items = [];
  for (const c of comments)
    items.push({ kind: "comment", date: c.createdAt, postId: c.postId, commentId: c.id, snippet: c.body });
  for (const b of bookmarks) items.push({ kind: "bookmark", date: b.createdAt, postId: b.postId });
  for (const p of posts) items.push({ kind: "post", date: p.date, postId: p.id });
  return items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
