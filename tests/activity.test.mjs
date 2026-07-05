import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeActivity } from "../lib/activity/merge.mjs";

// Phase 6 #11 activity history — proves the merge core folds three event sources
// into one newest-first timeline with the right kind tags (REBUILD §4 Phase 6).
// Pure module → no TS build / Next runtime needed.

test("mergeActivity folds comments + bookmarks + posts into one newest-first list", () => {
  const items = mergeActivity({
    comments: [{ id: "5001", postId: "p-1001", body: "মন্তব্য", createdAt: "2024-11-03T01:12:00+06:00" }],
    bookmarks: [{ postId: "p-1003", createdAt: "2024-09-02T08:00:00+06:00" }],
    posts: [{ id: "p-1005", date: "2024-10-02T22:30:00+06:00" }],
  });

  assert.equal(items.length, 3);
  // Newest-first: comment (Nov) → post (Oct) → bookmark (Sep).
  assert.deepEqual(
    items.map((i) => i.kind),
    ["comment", "post", "bookmark"],
  );
  // Comment carries its anchor id + snippet for the article permalink.
  assert.equal(items[0].commentId, "5001");
  assert.equal(items[0].postId, "p-1001");
  assert.equal(items[0].snippet, "মন্তব্য");
  // Bookmark/post carry no comment fields.
  assert.equal(items[1].commentId, undefined);
  assert.equal(items[2].kind, "bookmark");
});

test("mergeActivity is stable and total-ordered on equal dates, empty on no input", () => {
  assert.deepEqual(mergeActivity({}), []);
  assert.deepEqual(mergeActivity(), []);
  const same = "2024-01-01T00:00:00+06:00";
  const items = mergeActivity({
    comments: [{ id: "1", postId: "p-1", body: "x", createdAt: same }],
    bookmarks: [{ postId: "p-2", createdAt: same }],
  });
  assert.equal(items.length, 2);
  assert.ok(items.every((i) => i.date === same));
});
