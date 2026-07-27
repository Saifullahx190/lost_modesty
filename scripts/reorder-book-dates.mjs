// ───────────────────────────────────────────────────────────────────────────
// Re-stamp the publish dates of already-published book chapters so that
// newest-first listings (index, feed, archives — lib/content/repo byDateDesc)
// show the book SERIALLY: chapter 1 at the top, then 2, 3, … — i.e. dates
// descend through the book order (chapter 1 gets the newest timestamp).
//
// Only posts whose slug matches a NN-*.md file in <book-dir> are touched;
// title/body/categories/tags/ids stay exactly as published. Safe to rerun.
//
// Usage (from the repo root, DATABASE_PATH set or present in .env.local):
//   node scripts/reorder-book-dates.mjs <book-dir> [--dry-run]
// ───────────────────────────────────────────────────────────────────────────
import fs from "node:fs";

const args = process.argv.slice(2).filter((a) => a !== "--dry-run");
const DRY = process.argv.includes("--dry-run");
const BOOK_DIR = args[0];
if (!BOOK_DIR || !fs.existsSync(BOOK_DIR)) {
  console.error("usage: node scripts/reorder-book-dates.mjs <book-dir> [--dry-run]");
  process.exit(1);
}

if (!process.env.DATABASE_PATH && fs.existsSync(".env.local")) {
  const m = /^DATABASE_PATH=(.+)$/m.exec(fs.readFileSync(".env.local", "utf8"));
  if (m) process.env.DATABASE_PATH = m[1].trim();
}
if (!process.env.DATABASE_PATH) {
  console.error("DATABASE_PATH is not set (env or .env.local) — nothing to reorder.");
  process.exit(1);
}

const { dbUpsertPost, dbLoadPosts } = await import("../lib/db/index.mjs");

const AUTHOR = "lostmodesty";

// Book order = filename order (NN- prefixes), same rule as publish-book.mjs.
const orderedSlugs = fs
  .readdirSync(BOOK_DIR)
  .filter((f) => /^\d\d-/.test(f) && !/INDEX/i.test(f) && f.endsWith(".md"))
  .sort()
  .map((f) => f.replace(/^\d\d-/, "").replace(/\.md$/, ""));

const posts = new Map(
  dbLoadPosts()
    .filter((p) => p.author === AUTHOR)
    .map((p) => [p.slug, p]),
);

// Chapter 1 gets "now"; each later chapter 5 minutes older, so the whole book
// stays the newest block in the store but reads top-to-bottom in book order.
const base = Date.now();
const STEP = 5 * 60 * 1000;
const iso = (t) => {
  const d = new Date(t + 6 * 3600 * 1000);
  return d.toISOString().replace(/\.\d{3}Z$/, "") + "+06:00";
};

let changed = 0;
orderedSlugs.forEach((slug, i) => {
  const post = posts.get(slug);
  if (!post) {
    console.log(`— not in store, skipped: ${slug}`);
    return;
  }
  const date = iso(base - i * STEP);
  if (!DRY) dbUpsertPost({ ...post, date, updated: date });
  changed += 1;
  console.log(`${DRY ? "would set" : "✓"} ${String(i + 1).padStart(2)} ${date}  /${AUTHOR}/${slug}`);
});

console.log(`\n${DRY ? "dry-run" : "done"}: ${changed}/${orderedSlugs.length} chapters ${DRY ? "to restamp" : "restamped"}`);
