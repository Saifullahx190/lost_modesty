// ───────────────────────────────────────────────────────────────────────────
// Bulk-publish a folder of book-chapter markdown files as blog posts, in
// filename order (NN-*.md), through the app's own pipeline: parseBody
// (markdown-lite → structured blocks) + dbUpsertPost (persistence layer) —
// so every post is shaped exactly like one published through /editor.
//
// Expected file shape (the "আকাশের ওপারে আকাশ" OCR export):
//   # শিরোনাম                ← post title
//   *সেকশন*                  ← section marker → category mapping below
//   …body…                   ← ##/### headings kept; whole-line **X** → ## X
//
// Usage (from the repo root, DATABASE_PATH set or present in .env.local):
//   node scripts/publish-book.mjs <book-dir> [--dry-run]
//
// Idempotent: chapters whose slug already exists under the author are skipped,
// so a rerun publishes only what's missing. Publish dates are "now", ascending
// 5 minutes per chapter, so listings keep the book's order.
// ───────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2).filter((a) => a !== "--dry-run");
const DRY = process.argv.includes("--dry-run");
const BOOK_DIR = args[0];
if (!BOOK_DIR || !fs.existsSync(BOOK_DIR)) {
  console.error("usage: node scripts/publish-book.mjs <book-dir> [--dry-run]");
  process.exit(1);
}

// Plain node doesn't load .env.local — pick DATABASE_PATH out of it if unset.
if (!process.env.DATABASE_PATH && fs.existsSync(".env.local")) {
  const m = /^DATABASE_PATH=(.+)$/m.exec(fs.readFileSync(".env.local", "utf8"));
  if (m) process.env.DATABASE_PATH = m[1].trim();
}
if (!process.env.DATABASE_PATH) {
  console.error("DATABASE_PATH is not set (env or .env.local) — refusing to publish into nothing.");
  process.exit(1);
}

const { parseBody } = await import("../lib/content/draft.mjs");
const { dbUpsertPost, dbLoadPosts } = await import("../lib/db/index.mjs");

const AUTHOR = "lostmodesty";
const BOOK_TAG = "akasher-opare-akash"; // আকাশের ওপারে আকাশ — existing subject tag

// Section (the *italic* line under each title) → existing category slugs.
const SECTION_CATEGORIES = {
  "ভূমিকা": ["probondho"],
  "ভালোবাসা": ["probondho", "love"],
  "সত্তার ব্যাকরণ": ["probondho"],
};

const files = fs
  .readdirSync(BOOK_DIR)
  .filter((f) => /^\d\d-/.test(f) && !/INDEX/i.test(f) && f.endsWith(".md"))
  .sort();

const existing = dbLoadPosts();
const taken = new Set(existing.map((p) => `${p.author}/${p.slug}`));
let seq = 5000;
for (const p of existing) {
  const m = /^p-(\d+)$/.exec(p.id);
  if (m) seq = Math.max(seq, Number(m[1]));
}

const base = Date.now();
const STEP = 5 * 60 * 1000;
const iso = (t) => {
  // Render as +06:00 local ISO to match the store's existing date style.
  const d = new Date(t + 6 * 3600 * 1000);
  return d.toISOString().replace(/\.\d{3}Z$/, "") + "+06:00";
};

// First sentences of the opening paragraph, capped near 160 chars, for the excerpt.
function makeExcerpt(paragraph) {
  const sentences = paragraph.split(/(?<=।)/).map((s) => s.trim()).filter(Boolean);
  let out = "";
  for (const s of sentences) {
    if (out && (out + " " + s).length > 160) break;
    out = out ? out + " " + s : s;
    if (out.length >= 90) break;
  }
  if (!out) out = paragraph.slice(0, 157) + "…";
  return out;
}

let published = 0;
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const slug = file.replace(/^\d\d-/, "").replace(/\.md$/, "");
  if (taken.has(`${AUTHOR}/${slug}`)) {
    console.log(`— skip (already published): ${slug}`);
    continue;
  }

  const raw = fs.readFileSync(path.join(BOOK_DIR, file), "utf8").replace(/\r\n/g, "\n");
  const lines = raw.split("\n");

  const titleIdx = lines.findIndex((l) => l.startsWith("# "));
  if (titleIdx < 0) throw new Error(`${file}: no "# title" line`);
  const title = lines[titleIdx].slice(2).trim();

  // The `*section*` marker line right after the title.
  let section = null;
  let bodyStart = titleIdx + 1;
  for (let k = titleIdx + 1; k < lines.length; k++) {
    const t = lines[k].trim();
    if (!t) continue;
    const m = /^\*([^*]+)\*$/.exec(t);
    if (m) {
      section = m[1].trim();
      bodyStart = k + 1;
    } else {
      bodyStart = k;
    }
    break;
  }
  if (!section || !SECTION_CATEGORIES[section]) {
    throw new Error(`${file}: unrecognized section marker: ${section}`);
  }

  // Body: whole-line **X** markers become ## X headings; everything else verbatim.
  const bodyText = lines
    .slice(bodyStart)
    .map((l) => {
      const m = /^\s*\*\*([^*]+)\*\*\s*$/.exec(l);
      return m ? `## ${m[1].trim()}` : l;
    })
    .join("\n")
    .trim();

  const body = parseBody(bodyText);
  const firstPara = body.find((b) => b.type === "paragraph");
  if (!firstPara) throw new Error(`${file}: no paragraph content`);

  const date = iso(base + i * STEP);
  const post = {
    id: `p-${++seq}`,
    slug,
    author: AUTHOR,
    title,
    excerpt: makeExcerpt(firstPara.text),
    date,
    updated: date,
    categories: SECTION_CATEGORIES[section],
    tags: [BOOK_TAG],
    body,
  };

  if (!DRY) dbUpsertPost(post);
  published += 1;
  console.log(`${DRY ? "would publish" : "✓"} ${String(published).padStart(2)} ${post.id}  /${AUTHOR}/${slug}  [${section}]  blocks=${body.length}`);
}

console.log(
  `\n${DRY ? "dry-run" : "done"}: ${published} ${DRY ? "to publish" : "published"}, ` +
    `${files.length - published} skipped, store now ${dbLoadPosts().length} posts`,
);
