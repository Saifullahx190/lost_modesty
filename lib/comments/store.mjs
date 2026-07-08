import { POST_IDS } from "../content/ids.mjs";
import {
  PERSIST,
  dbCommentsEmpty,
  dbLoadComments,
  dbInsertComment,
} from "../db/index.mjs";

// ───────────────────────────────────────────────────────────────────────────
// LOCAL SAMPLE COMMENT STORE — Phase 3 stand-in for the comment DB, same
// convention as lib/content/posts.ts (read-replica) and lib/auth/users.mjs
// (auth store). In production, reads come via the shared data layer and writes
// are DUAL-WRITTEN to old + new stores until cutover (REBUILD §4 Phase 3:
// "backfill + dual-write so no comment is lost mid-transition").
//
// KEYS ARE THE MIGRATION CONTRACT (REBUILD §1#4):
//  • id      — the OLD platform's numeric comment key, carried over verbatim,
//              because `#comment-{id}` permalinks may be backlinked and MUST
//              keep resolving. Anchor = "comment-" + id, unchanged.
//  • postId  — stable post id from lib/content/ids.mjs (never the slug).
//  • userId  — stable user id from lib/auth/users.mjs.
//  • parentId — one-level threading, preserved exactly (no re-nesting: jarring
//              reader-habit changes are called out as a risk).
// Sort order preserved: oldest-first, the common blog default — pinned at
// Phase 3 pre-flight against the real old platform.
// ───────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Comment
 * @property {string} id        OLD-platform comment key (numeric string).
 * @property {string} postId    Stable post id ("p-####").
 * @property {string} userId    Stable user id ("u-####").
 * @property {string | null} parentId  Top-level = null; replies reference a
 *                                     top-level comment on the SAME post.
 * @property {string} body      Plain text (server renders — indexed content).
 * @property {string} createdAt ISO 8601.
 */

/** @type {Comment[]} Backfilled sample thread (migrated data stand-in). */
const SEED = [
  {
    id: "5001",
    postId: "p-1001",
    userId: "u-2001",
    parentId: null,
    body: "রাত জাগা মানুষদের জন্য লেখা। শেষ লাইনটা অনেকক্ষণ সঙ্গে রইলো।",
    createdAt: "2024-11-03T01:12:00+06:00",
  },
  {
    id: "5002",
    postId: "p-1001",
    userId: "u-1001",
    parentId: "5001",
    body: "পড়ার জন্য ধন্যবাদ। জানালাটা খোলা রাখলাম — পরের লেখায় দেখা হবে।",
    createdAt: "2024-11-03T09:40:00+06:00",
  },
  {
    id: "5003",
    postId: "p-1001",
    userId: "u-1002",
    parentId: null,
    body: "নীরবতা যে ভরা হতে পারে, এই ভাবনাটা নিয়েই একটা প্রবন্ধ হতে পারে।",
    createdAt: "2024-11-04T18:05:00+06:00",
  },
  {
    id: "5007",
    postId: "p-1005",
    userId: "u-2001",
    parentId: null,
    body: "পুরো ধারাবাহিকটা এক বসায় পড়লাম। খোলা জানালাটাই আসল শেষ।",
    createdAt: "2024-10-02T22:30:00+06:00",
  },
];

// Process singleton via globalThis — Next compiles server actions and page/RSC
// renders into separate module graphs, so a plain module-level array is created
// twice and a comment posted in the action layer would be invisible to the render
// layer (missing from the thread + the activity feed). Stand-in-store concern only:
// the real comment DB (REBUILD §4 Phase 3 dual-write) is shared by construction.
// Same pattern as lib/content/posts.ts and lib/auth/users.mjs.
/** @type {typeof globalThis & { __LM_COMMENTS__?: Comment[], __LM_COMMENT_SEQ__?: number }} */
const g = globalThis;
/** @type {Comment[]} */
const comments = (g.__LM_COMMENTS__ ??= hydrateComments());

// New-platform comment keys continue the old numeric sequence so old and new
// permalinks live in one keyspace (no re-keying, REBUILD §1#4). Past restarts
// the counter must resume above whatever was already written.
g.__LM_COMMENT_SEQ__ ??= computeCommentSeq();

function hydrateComments() {
  if (!PERSIST) return [...SEED];
  if (dbCommentsEmpty()) for (const c of SEED) dbInsertComment(c);
  return dbLoadComments();
}

function computeCommentSeq() {
  let max = 9000;
  for (const c of comments) {
    const n = Number(c.id);
    if (Number.isInteger(n)) max = Math.max(max, n);
  }
  return Math.max(9001, max + 1);
}

const byCreatedAsc = (a, b) =>
  a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;

/**
 * @typedef {Comment & { replies: Comment[] }} ThreadedComment
 */

/** Thread for one post: top-level oldest-first, replies nested oldest-first.
 * @param {string} postId
 * @returns {ThreadedComment[]} */
export function commentsForPost(postId) {
  const forPost = comments.filter((c) => c.postId === postId).sort(byCreatedAsc);
  return forPost
    .filter((c) => c.parentId === null)
    .map((top) => ({
      ...top,
      replies: forPost.filter((c) => c.parentId === top.id),
    }));
}

/** @param {string} postId @returns {number} */
export function commentCount(postId) {
  return comments.filter((c) => c.postId === postId).length;
}

/** A user's own comments, newest-first — feeds the activity history (REBUILD §4
 *  Phase 6 #11 "derivable from existing event data"). Replies included; the
 *  activity item links to each comment's `#comment-{id}` anchor on its article.
 *  @param {string} userId @returns {Comment[]} */
export function commentsForUser(userId) {
  return comments
    .filter((c) => c.userId === userId)
    .sort((a, b) => -byCreatedAsc(a, b))
    .map((c) => ({ ...c }));
}

/**
 * Append a comment (in production: dual-write). Validation errors throw with a
 * stable `code` the action layer maps to reader-facing Bengali copy.
 * @param {{ postId: string, userId: string, body: string, parentId?: string | null }} input
 * @returns {Comment}
 */
export function addComment({ postId, userId, body, parentId = null }) {
  const text = (body ?? "").trim();
  if (!text) throw Object.assign(new Error("empty body"), { code: "EMPTY" });
  if (text.length > 5000) throw Object.assign(new Error("too long"), { code: "TOO_LONG" });
  if (!POST_IDS.includes(postId))
    throw Object.assign(new Error("unknown post"), { code: "UNKNOWN_POST" });
  if (parentId !== null) {
    const parent = comments.find((c) => c.id === parentId);
    // One-level threading: replies attach only to a TOP-LEVEL comment of the
    // same post (preserves the old platform's structure exactly).
    if (!parent || parent.postId !== postId || parent.parentId !== null)
      throw Object.assign(new Error("bad parent"), { code: "BAD_PARENT" });
  }
  /** @type {Comment} */
  const comment = {
    id: String(g.__LM_COMMENT_SEQ__++),
    postId,
    userId,
    parentId,
    body: text,
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  dbInsertComment(comment);
  return comment;
}

/** Snapshot for validators/tests — not a live reference. @returns {Comment[]} */
export function allComments() {
  return comments.map((c) => ({ ...c }));
}

/**
 * Checkpoint-3 validator (REBUILD §4: "100% of comments map to correct
 * articles; counts match; permalinks/anchors resolve"). Pure so node --test
 * can run it against any snapshot.
 * @param {Comment[]} list
 * @param {string[]} postIds Known stable post ids.
 * @returns {string[]} Human-readable violations; empty = green.
 */
export function validateCommentIntegrity(list, postIds) {
  const errors = [];
  const ids = new Set();
  for (const c of list) {
    if (ids.has(c.id)) errors.push(`duplicate comment id ${c.id} (anchor collision)`);
    ids.add(c.id);
    if (!postIds.includes(c.postId))
      errors.push(`comment ${c.id} references unknown post ${c.postId} (thread would detach)`);
  }
  for (const c of list) {
    if (c.parentId === null) continue;
    const parent = list.find((p) => p.id === c.parentId);
    if (!parent) errors.push(`reply ${c.id} has missing parent ${c.parentId}`);
    else {
      if (parent.postId !== c.postId)
        errors.push(`reply ${c.id} nests under a different article (${parent.postId})`);
      if (parent.parentId !== null)
        errors.push(`reply ${c.id} nests deeper than one level (threading change)`);
    }
  }
  return errors;
}
