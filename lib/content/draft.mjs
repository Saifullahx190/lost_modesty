// ───────────────────────────────────────────────────────────────────────────
// EDITOR DRAFT MODEL — pure, framework-free composer logic (REBUILD §4 Phase 5 /
// FRONTEND §3.2 Journey D). Authored as .mjs (JSDoc-typed), same rationale as
// lib/content/ids.mjs and lib/migration.mjs: the SAME module runs under plain
// Node (tests/editor.test.mjs, no TS build) AND bundles into the Next app +
// server actions.
//
// Its one job: turn what an author types into the SAME structured Post shape the
// read-replica/content API will supply (lib/content/types.ts `Post`), so the
// editor's output round-trips losslessly into the Phase-1 renderer with byte-
// equivalent canonical/meta/structured-data (Checkpoint 5). No HTML is ever
// produced here — the body is a structured Block[] document (FRONTEND §6.2:
// "structured content, not a pre-rendered HTML blob").
// ───────────────────────────────────────────────────────────────────────────

/** URL-safe slug from Latin input. Bengali titles can't transliterate cleanly,
 *  so the composer asks the author for the slug explicitly (it is URL-load-
 *  bearing, REBUILD §3A) — this only normalizes/validates what they type.
 *  @param {string} raw @returns {string} */
export function slugify(raw) {
  return (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-") // whitespace/underscores become separators FIRST…
    .replace(/[^a-z0-9-]/g, "") // …then drop anything that isn't slug-legal
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** A slug is valid iff it round-trips through slugify unchanged and is non-empty
 *  — i.e. only [a-z0-9-], no leading/trailing/double dashes. Keeps published URLs
 *  clean and collision-resistant. @param {string} slug @returns {boolean} */
export function isValidSlug(slug) {
  return typeof slug === "string" && slug.length > 0 && slugify(slug) === slug;
}

/**
 * Normalize an author-supplied publish date into an ISO 8601 string. Accepts a
 * `YYYY-MM-DD` value (from <input type="date">) or any Date-parsable string.
 * Returns `undefined` for empty input (the caller supplies its own default —
 * "now" on publish, the existing date on edit), `null` when the value is present
 * but unparseable (a validation error), or the ISO 8601 string otherwise.
 * Pure: the impure "now" fallback stays in the action layer.
 * @param {string} raw
 * @returns {string | null | undefined}
 */
export function normalizePublishDate(raw) {
  const s = (raw ?? "").trim();
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * ISO 8601 → the `YYYY-MM-DD` value an <input type="date"> expects, for
 * prefilling the composer's date field when editing. Empty string on an
 * unparseable input.
 * @param {string} iso
 * @returns {string}
 */
export function toDateInputValue(iso) {
  const d = new Date(iso ?? "");
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/** Comma/newline-separated term slugs → a de-duped, cleaned slug list.
 *  @param {string} raw @returns {string[]} */
export function parseTerms(raw) {
  const seen = new Set();
  const out = [];
  for (const part of (raw ?? "").split(/[,\n]/)) {
    const s = slugify(part);
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

/**
 * Markdown-lite body → structured Block[] (matches lib/content/types.ts `Block`).
 * Blocks are separated by blank lines. Per block, the first line's prefix decides
 * the type:
 *   "## "  → heading level 2      "### " → heading level 3
 *   "> "   → quote (optional "— cite" on the last line)
 *   else   → paragraph (soft line breaks joined with a space)
 * Heading ids are stable `section-{n}` (1-based across all headings) — Bengali
 * heading text can't produce a clean id, and these anchor the in-article outline
 * the structured-data/heading-outline parity check relies on (§1.3).
 * @param {string} raw
 * @returns {import("./types").Block[]}
 */
export function parseBody(raw) {
  /** @type {import("./types").Block[]} */
  const blocks = [];
  let headingN = 0;

  const chunks = (raw ?? "").replace(/\r\n/g, "\n").split(/\n{2,}/);
  for (const chunk of chunks) {
    const text = chunk.trim();
    if (!text) continue;

    if (text.startsWith("### ")) {
      headingN += 1;
      blocks.push({ type: "heading", level: 3, id: `section-${headingN}`, text: text.slice(4).trim() });
      continue;
    }
    if (text.startsWith("## ")) {
      headingN += 1;
      blocks.push({ type: "heading", level: 2, id: `section-${headingN}`, text: text.slice(3).trim() });
      continue;
    }
    if (text.startsWith("> ")) {
      const lines = text.split("\n").map((l) => l.replace(/^>\s?/, "").trim());
      const citeIdx = lines.findIndex((l) => l.startsWith("—") || l.startsWith("--"));
      let cite;
      let bodyLines = lines;
      if (citeIdx >= 0) {
        cite = lines[citeIdx].replace(/^(—|--)\s?/, "").trim();
        bodyLines = lines.slice(0, citeIdx);
      }
      blocks.push({ type: "quote", text: bodyLines.join(" ").trim(), ...(cite ? { cite } : {}) });
      continue;
    }
    // Paragraph: join soft-wrapped lines so [^n] footnote markers survive intact.
    blocks.push({ type: "paragraph", text: text.split("\n").map((l) => l.trim()).join(" ") });
  }
  return blocks;
}

/**
 * Footnote definitions, one per non-empty line, numbered by order → the shape
 * ArticleBody's `[^n]` in-text markers link to (FRONTEND §2.4). A line may lead
 * with "n." / "n)" / "[n]" — stripped, position wins so numbering can't skew.
 * @param {string} raw
 * @returns {import("./types").Footnote[]}
 */
export function parseFootnotes(raw) {
  /** @type {import("./types").Footnote[]} */
  const notes = [];
  for (const line of (raw ?? "").replace(/\r\n/g, "\n").split("\n")) {
    const text = line.replace(/^\s*(?:\[?\d+\]?[.)]?)\s*/, "").trim();
    if (!text) continue;
    const n = notes.length + 1;
    notes.push({ n, id: `fn-${n}`, text });
  }
  return notes;
}

/**
 * Per-field validation before a draft can preview/publish (FRONTEND §1.3 forms:
 * specific, per-field Bengali messages). Pure — slug UNIQUENESS is checked by the
 * publish action against the repo, not here (this module has no data access).
 * @param {ComposerInput} input
 * @returns {Record<string, string>} field → Bengali error; empty = valid
 */
export function validateDraft(input) {
  /** @type {Record<string, string>} */
  const errors = {};
  if (!input.title || !input.title.trim()) errors.title = "শিরোনাম লিখুন।";
  if (!input.slug || !input.slug.trim()) errors.slug = "ইউআরএল স্লাগ লিখুন।";
  else if (!isValidSlug(input.slug.trim()))
    errors.slug = "স্লাগে শুধু ইংরেজি ছোট হাতের অক্ষর, সংখ্যা আর হাইফেন চলবে (যেমন: raat-baarotar-por)।";
  if (!input.excerpt || !input.excerpt.trim()) errors.excerpt = "সংক্ষিপ্ত বিবরণ লিখুন — সার্চ ও শেয়ারে এটাই দেখা যায়।";
  if (parseTerms(input.category ?? "").length === 0) errors.category = "অন্তত একটি বিভাগ দিন।";
  if (parseBody(input.body ?? "").length === 0) errors.body = "লেখার মূল অংশ খালি রাখা যাবে না।";
  // Date is optional (empty → default), but a typed-in value must be a real date.
  if (input.date && normalizePublishDate(input.date) === null)
    errors.date = "প্রকাশের তারিখ সঠিক নয়।";
  return errors;
}

/**
 * @typedef {Object} ComposerInput
 * @property {string} title
 * @property {string} slug
 * @property {string} excerpt
 * @property {string} author        Author slug (the {author} URL segment).
 * @property {string} [date]        Publish date, `YYYY-MM-DD` (empty → default).
 * @property {string} [category]    Comma/newline term slugs.
 * @property {string} [tags]        Comma/newline term slugs.
 * @property {string} [body]        Markdown-lite body.
 * @property {string} [footnotes]   One definition per line.
 * @property {string} [series]      Existing series slug (optional).
 * @property {string} [seriesPart]  1-based part number (with series).
 * @property {string} [seriesPartLabel] Bengali label, e.g. "পর্ব ২".
 */

/**
 * Inverse of parseBody: a structured Block[] back to the markdown-lite text the
 * composer edits (FRONTEND §3.2 Journey D "edit"). Headings regain their ##/###
 * prefix, quotes their `> ` + `— cite`, paragraphs their raw text (footnote
 * markers already live inline). Image blocks are skipped — covers are authored
 * through the file field, not the body — so an edit round-trips paragraph/
 * heading/quote content without loss.
 * @param {import("./types").Block[]} blocks
 * @returns {string}
 */
export function blocksToBody(blocks) {
  return (blocks ?? [])
    .map((b) => {
      if (b.type === "heading") return `${b.level === 3 ? "###" : "##"} ${b.text}`;
      if (b.type === "quote") return `> ${b.text}${b.cite ? `\n— ${b.cite}` : ""}`;
      if (b.type === "image") return "";
      return b.text; // paragraph
    })
    .filter((s) => s !== "")
    .join("\n\n");
}

/**
 * Turn a stored Post into the flat, string-keyed values the composer prefills for
 * editing (the inverse of readValues+buildDraftPost). Matches ComposerValues in
 * lib/content/actions.tsx field-for-field.
 * @param {import("./types").Post} post
 * @returns {Record<string, string>}
 */
export function postToComposerValues(post) {
  return {
    title: post.title ?? "",
    slug: post.slug ?? "",
    excerpt: post.excerpt ?? "",
    date: toDateInputValue(post.date),
    category: (post.categories ?? []).join(", "),
    tags: (post.tags ?? []).join(", "),
    body: blocksToBody(post.body),
    footnotes: (post.footnotes ?? []).map((f) => f.text).join("\n"),
    series: post.series?.series ?? "",
    seriesPart: post.series ? String(post.series.part) : "",
    seriesPartLabel: post.series?.partLabel ?? "",
    coverAlt: post.cover?.alt ?? "",
  };
}

/**
 * Assemble the final Post from validated composer input. `id`, `date` and the
 * optional resolved `cover` are injected by the caller — the publish action
 * supplies a stable new id + now + a persisted cover, the preview supplies a
 * throwaway id + now + an inlined cover — so this stays pure/deterministic and
 * free of file IO (cover decoding lives in the impure action layer).
 * @param {ComposerInput} input
 * @param {{ id: string, date: string, cover?: import("./types").ImageRef }} meta
 * @returns {import("./types").Post}
 */
export function buildDraftPost(input, meta) {
  const series =
    input.series && input.series.trim()
      ? {
          series: slugify(input.series),
          part: Number.parseInt(input.seriesPart ?? "1", 10) || 1,
          partLabel: (input.seriesPartLabel ?? "").trim() || `পর্ব ${input.seriesPart ?? "1"}`,
        }
      : undefined;

  const footnotes = parseFootnotes(input.footnotes ?? "");

  return {
    id: meta.id,
    slug: input.slug.trim(),
    author: input.author,
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    date: meta.date,
    updated: meta.date,
    categories: parseTerms(input.category ?? ""),
    tags: parseTerms(input.tags ?? ""),
    ...(series ? { series } : {}),
    ...(meta.cover ? { cover: meta.cover } : {}),
    body: parseBody(input.body ?? ""),
    ...(footnotes.length ? { footnotes } : {}),
  };
}
