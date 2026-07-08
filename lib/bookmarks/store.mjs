import { POST_IDS } from "../content/ids.mjs";
import {
  PERSIST,
  dbBookmarksEmpty,
  dbLoadBookmarks,
  dbInsertBookmark,
  dbDeleteBookmark,
} from "../db/index.mjs";

// ───────────────────────────────────────────────────────────────────────────
// LOCAL SAMPLE BOOKMARK STORE — Phase 4 stand-in for the bookmarks table.
// Bookmarks reference the CANONICAL POST ID, never the slug (REBUILD §1#6:
// "if bookmarks store slugs and slugs change, every saved bookmark 404s" —
// re-pointing at ids via the Phase-1 slug map is the whole migration). The
// seeded rows model migrated data; writes are per-process until the real
// store lands (dual-write during transition, REBUILD §2).
// ───────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Bookmark
 * @property {string} userId   Stable user id.
 * @property {string} postId   Stable post id — the immutable key.
 * @property {string} createdAt ISO 8601 save time.
 */

/** @type {Bookmark[]} Migrated sample rows. */
const SEED = [
  { userId: "u-2001", postId: "p-1003", createdAt: "2024-09-02T08:00:00+06:00" },
  { userId: "u-2001", postId: "p-1001", createdAt: "2024-11-03T01:20:00+06:00" },
];

// Process singleton via globalThis — a bookmark toggled in the server-action layer
// must be visible to the dashboard/activity render layer despite Next's action/RSC
// module split (same reason as lib/content/posts.ts). Stand-in-store concern only;
// the real bookmarks table (REBUILD §4 Phase 4) is shared by construction.
/** @type {typeof globalThis & { __LM_BOOKMARKS__?: Bookmark[] }} */
const g = globalThis;
/** @type {Bookmark[]} */
const bookmarks = (g.__LM_BOOKMARKS__ ??= hydrateBookmarks());

function hydrateBookmarks() {
  if (!PERSIST) return [...SEED];
  if (dbBookmarksEmpty()) for (const b of SEED) dbInsertBookmark(b);
  return dbLoadBookmarks();
}

/** Newest-saved first — the "resume where I left off" order (§3.2 Journey C).
 * @param {string} userId @returns {Bookmark[]} */
export function bookmarksForUser(userId) {
  return bookmarks
    .filter((b) => b.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((b) => ({ ...b }));
}

/** @param {string} userId @param {string} postId @returns {boolean} */
export function isBookmarked(userId, postId) {
  return bookmarks.some((b) => b.userId === userId && b.postId === postId);
}

/**
 * Toggle. Unknown post ids throw — a bookmark that can't resolve must never be
 * written (that IS the Checkpoint-4 failure mode).
 * @param {string} userId @param {string} postId
 * @returns {{ saved: boolean }} state AFTER the toggle
 */
export function toggleBookmark(userId, postId) {
  if (!POST_IDS.includes(postId))
    throw Object.assign(new Error("unknown post"), { code: "UNKNOWN_POST" });
  const idx = bookmarks.findIndex((b) => b.userId === userId && b.postId === postId);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
    dbDeleteBookmark(userId, postId);
    return { saved: false };
  }
  const row = { userId, postId, createdAt: new Date().toISOString() };
  bookmarks.push(row);
  dbInsertBookmark(row);
  return { saved: true };
}

/** Snapshot for validators/tests. @returns {Bookmark[]} */
export function allBookmarks() {
  return bookmarks.map((b) => ({ ...b }));
}

/**
 * Checkpoint-4 validator (REBUILD §4: "every existing bookmark resolves to its
 * live article"). Pure; run by node --test against any snapshot.
 * @param {Bookmark[]} list
 * @param {string[]} postIds
 * @returns {string[]} violations; empty = green
 */
export function validateBookmarkResolution(list, postIds) {
  const errors = [];
  const seen = new Set();
  for (const b of list) {
    const key = `${b.userId}:${b.postId}`;
    if (seen.has(key)) errors.push(`duplicate bookmark ${key}`);
    seen.add(key);
    if (!postIds.includes(b.postId))
      errors.push(`bookmark ${key} references unknown post ${b.postId} (would 404)`);
  }
  return errors;
}
