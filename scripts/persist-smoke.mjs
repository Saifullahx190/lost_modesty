// Persistence smoke test. Run WRITE in one process, READ in a fresh one
// (a real restart) against the same DATABASE_PATH.
//   node scripts/persist-smoke.mjs write
//   node scripts/persist-smoke.mjs read
const mode = process.argv[2];

const { createUser, findUserByEmail } = await import("../lib/auth/users.mjs");
const { addComment, commentsForPost } = await import("../lib/comments/store.mjs");
const { toggleBookmark, isBookmarked } = await import("../lib/bookmarks/store.mjs");
const { markAllRead, getReadAt } = await import("../lib/notifications/store.mjs");
const db = await import("../lib/db/index.mjs");

const SAMPLE_POST = {
  id: "p-5001",
  slug: "test-post",
  author: "lostmodesty",
  title: "টেস্ট পোস্ট",
  excerpt: "persistence check",
  date: "2026-07-08T00:00:00+06:00",
  categories: ["golpo"],
  tags: ["blog"],
  cover: { src: "/uploads/x.avif", alt: "cover", width: 800, height: 400 },
  body: [{ type: "paragraph", text: "restart-এও থাকবে তো?" }],
};

if (mode === "write") {
  const u = createUser({ name: "টেস্ট ইউজার", email: "test@persist.com", password: "secret-123" });
  console.log("created user:", u.id, u.email);
  addComment({ postId: "p-1001", userId: u.id, body: "নতুন কমেন্ট, টিকে থাকো।" });
  toggleBookmark(u.id, "p-1001");
  markAllRead(u.id);
  db.dbUpsertPost(SAMPLE_POST); // exact path posts.ts addPost() takes
  console.log("WRITE done.");
} else if (mode === "read") {
  const u = findUserByEmail("test@persist.com");
  console.log("user after restart:", u ? `${u.id} ${u.name}` : "❌ MISSING");
  const gotComment = commentsForPost("p-1001").some((c) => c.body.includes("টিকে থাকো"));
  const gotBookmark = u ? isBookmarked(u.id, "p-1001") : false;
  const gotRead = u ? Boolean(getReadAt(u.id)) : false;
  const posts = db.dbLoadPosts();
  const gotPost = posts.find((p) => p.id === "p-5001");
  const coverOk = gotPost && gotPost.cover && gotPost.cover.src === "/uploads/x.avif";
  const bodyOk = gotPost && Array.isArray(gotPost.body) && gotPost.body[0].text.includes("restart");

  const results = {
    user: Boolean(u),
    comment: gotComment,
    bookmark: gotBookmark,
    notif_read: gotRead,
    post: Boolean(gotPost),
    "post.cover (image ref)": Boolean(coverOk),
    "post.body (json blocks)": Boolean(bodyOk),
  };
  console.log("READ after restart:");
  let allPass = true;
  for (const [k, v] of Object.entries(results)) {
    console.log(`  ${v ? "✅" : "❌"} ${k}`);
    if (!v) allPass = false;
  }
  process.exit(allPass ? 0 : 1);
} else {
  console.error("usage: node scripts/persist-smoke.mjs write|read");
  process.exit(2);
}
