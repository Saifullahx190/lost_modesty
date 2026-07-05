import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveNotifications, countUnread } from "../lib/notifications/derive.mjs";

// Phase 6 #8 in-app notifications — proves the derivation rules and unread count
// (REBUILD §1#8 "minimal unread count + list", derived from existing comment data).

// Mirrors the sample thread on p-1001 (lib/comments/store.mjs): nila(u-2001) top
// 5001, tahsin(u-1001) reply 5002 → 5001, rumki(u-1002) top 5003.
const COMMENTS = [
  { id: "5001", postId: "p-1001", userId: "u-2001", parentId: null, body: "A", createdAt: "2024-11-03T01:12:00+06:00" },
  { id: "5002", postId: "p-1001", userId: "u-1001", parentId: "5001", body: "B", createdAt: "2024-11-03T09:40:00+06:00" },
  { id: "5003", postId: "p-1001", userId: "u-1002", parentId: null, body: "C", createdAt: "2024-11-04T18:05:00+06:00" },
];

test("reply to your comment notifies you (type=reply)", () => {
  // nila wrote 5001; tahsin's 5002 replies to it.
  const n = deriveNotifications({ comments: COMMENTS, selfId: "u-2001", myCommentIds: ["5001"], myPostIds: [] });
  assert.equal(n.length, 1);
  assert.equal(n[0].type, "reply");
  assert.equal(n[0].commentId, "5002");
  assert.equal(n[0].actorId, "u-1001");
});

test("comments on your article notify you (type=comment_on_post), your own excluded", () => {
  // tahsin authored p-1001; others' comments on it (5001 nila, 5003 rumki) notify
  // him; his own 5002 does not. 5001/5003 are top-level (not replies to him).
  const n = deriveNotifications({ comments: COMMENTS, selfId: "u-1001", myCommentIds: ["5002"], myPostIds: ["p-1001"] });
  assert.equal(n.length, 2);
  assert.ok(n.every((x) => x.type === "comment_on_post"));
  assert.deepEqual(n.map((x) => x.commentId).sort(), ["5001", "5003"]);
  // newest-first: 5003 (Nov 4) before 5001 (Nov 3)
  assert.equal(n[0].commentId, "5003");
});

test("a reply on your own post classifies as 'reply' (more specific), never double", () => {
  // If tahsin were notified for 5002 both ways, else-if keeps it single + as reply.
  const n = deriveNotifications({ comments: COMMENTS, selfId: "u-9999", myCommentIds: ["5001"], myPostIds: ["p-1001"] });
  const forReply = n.filter((x) => x.commentId === "5002");
  assert.equal(forReply.length, 1);
  assert.equal(forReply[0].type, "reply");
});

test("no notifications when nothing targets you", () => {
  const n = deriveNotifications({ comments: COMMENTS, selfId: "u-1002", myCommentIds: ["5003"], myPostIds: ["p-1002"] });
  assert.deepEqual(n, []);
});

test("countUnread: null readAt = all unread; else strictly-newer count", () => {
  const n = deriveNotifications({ comments: COMMENTS, selfId: "u-1001", myCommentIds: ["5002"], myPostIds: ["p-1001"] });
  assert.equal(countUnread(n, null), 2);
  // read up to Nov 3 noon → only 5003 (Nov 4) remains unread
  assert.equal(countUnread(n, "2024-11-03T12:00:00+06:00"), 1);
  assert.equal(countUnread(n, "2024-11-05T00:00:00+06:00"), 0);
});
