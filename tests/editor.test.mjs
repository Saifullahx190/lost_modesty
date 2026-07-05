import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugify,
  isValidSlug,
  parseTerms,
  parseBody,
  parseFootnotes,
  validateDraft,
  buildDraftPost,
} from "../lib/content/draft.mjs";

// Phase 5 editor — proves the composer produces the SAME structured Post shape the
// read path renders, so its output round-trips losslessly with byte-equivalent SEO
// (REBUILD §4 Checkpoint 5 / FRONTEND §6.2). Pure module → no TS build needed.

test("slugify normalizes Latin, isValidSlug is the round-trip", () => {
  assert.equal(slugify("  Raat  Baarotar Por  "), "raat-baarotar-por");
  assert.equal(slugify("Hello_World!!"), "hello-world");
  assert.ok(isValidSlug("raat-baarotar-por"));
  assert.ok(!isValidSlug("Raat Por")); // spaces + caps
  assert.ok(!isValidSlug("-leading"));
  assert.ok(!isValidSlug("")); // empty
});

test("parseTerms de-dupes and cleans comma/newline lists", () => {
  assert.deepEqual(parseTerms("golpo, Golpo\ndhara ,"), ["golpo", "dhara"]);
  assert.deepEqual(parseTerms(""), []);
});

test("parseBody maps prefixes to real block types with stable heading ids", () => {
  const blocks = parseBody(
    [
      "## প্রথম অধ্যায়",
      "",
      "একটি সাধারণ অনুচ্ছেদ[^1] এখানে।",
      "",
      "### উপ-অধ্যায়",
      "",
      "> একটি উদ্ধৃতি\n— কোনো একজন",
    ].join("\n"),
  );
  assert.equal(blocks.length, 4);
  assert.deepEqual(blocks[0], { type: "heading", level: 2, id: "section-1", text: "প্রথম অধ্যায়" });
  assert.equal(blocks[1].type, "paragraph");
  assert.match(blocks[1].text, /\[\^1\]/); // footnote marker preserved for ArticleBody
  assert.deepEqual(blocks[2], { type: "heading", level: 3, id: "section-2", text: "উপ-অধ্যায়" });
  assert.equal(blocks[3].type, "quote");
  assert.equal(blocks[3].cite, "কোনো একজন");
  assert.equal(blocks[3].text, "একটি উদ্ধৃতি");
});

test("parseFootnotes numbers by position and strips leading markers", () => {
  const notes = parseFootnotes("প্রথম টীকা\n2) দ্বিতীয় টীকা\n[3] তৃতীয়");
  assert.deepEqual(
    notes.map((n) => [n.n, n.id, n.text]),
    [
      [1, "fn-1", "প্রথম টীকা"],
      [2, "fn-2", "দ্বিতীয় টীকা"],
      [3, "fn-3", "তৃতীয়"],
    ],
  );
});

test("validateDraft flags each missing/invalid field", () => {
  const errs = validateDraft({ title: "", slug: "Bad Slug", excerpt: "", author: "tahsin", body: "" });
  assert.ok(errs.title && errs.slug && errs.excerpt && errs.category && errs.body);
  const ok = validateDraft({
    title: "শিরোনাম",
    slug: "notun-lekha",
    excerpt: "সংক্ষিপ্ত",
    author: "tahsin",
    category: "golpo",
    body: "একটি অনুচ্ছেদ।",
  });
  assert.deepEqual(ok, {});
});

test("buildDraftPost yields a well-formed Post the renderer/SEO builders accept", () => {
  const post = buildDraftPost(
    {
      title: "নতুন লেখা",
      slug: "notun-lekha",
      excerpt: "একটি নতুন গল্প।",
      author: "tahsin",
      category: "golpo, dhara",
      tags: "raat",
      body: "## শুরু\n\nপ্রথম অনুচ্ছেদ।\n\nদ্বিতীয় অনুচ্ছেদ।",
      footnotes: "একটি টীকা",
      series: "haariye-jawa-shohor",
      seriesPart: "4",
      seriesPartLabel: "পর্ব ৪",
    },
    { id: "p-5001", date: "2026-07-05T10:00:00+06:00" },
  );

  // The exact contract the article route + lib/seo builders consume.
  assert.equal(post.id, "p-5001");
  assert.equal(post.slug, "notun-lekha");
  assert.equal(post.author, "tahsin");
  assert.equal(post.title, "নতুন লেখা");
  assert.equal(post.excerpt, "একটি নতুন গল্প।"); // → meta description + articleLd.description
  assert.deepEqual(post.categories, ["golpo", "dhara"]); // → BreadcrumbList primary category
  assert.deepEqual(post.tags, ["raat"]); // → articleLd.keywords
  assert.equal(post.series.series, "haariye-jawa-shohor");
  assert.equal(post.series.part, 4);
  assert.equal(post.footnotes.length, 1);
  // Body is a structured Block[], never an HTML blob (FRONTEND §6.2).
  assert.ok(Array.isArray(post.body) && post.body.length === 3);
  assert.equal(post.body[0].type, "heading");
  assert.ok(post.body.every((b) => typeof b.type === "string"));
});
