import { test } from "node:test";
import assert from "node:assert/strict";
import { extractSeo, diffSeo, urlPath } from "../scripts/lib/seo-extract.mjs";

// Exercises the shadow-parity comparator (scripts/lib/seo-extract.mjs) with inline
// fixtures so the "what is an SEO regression" rules are themselves regression-tested
// in `npm test` — no snapshots or network needed. The same code runs in
// scripts/parity-check.mjs (offline) and scripts/shadow-diff.mjs (live).

const OLD = `<!doctype html><html lang="bn"><head>
<title>রাত বারোটার পর — লস্টমডেস্টি</title>
<meta name="description" content="দিনের শব্দ সরে গেলে যে নীরবতা নামে।">
<link rel="canonical" href="https://www.lostmodesty.com/tahsin/raat-baarotar-por">
<meta name="robots" content="index, follow">
<meta property="og:title" content="রাত বারোটার পর — লস্টমডেস্টি">
<meta property="og:type" content="article">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"NewsArticle","headline":"রাত বারোটার পর","datePublished":"2024-11-02T20:30:00+06:00","author":{"@type":"Person","name":"তাহসিন আহমেদ"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList"}</script>
</head><body><h1>রাত বারোটার পর</h1><h2>১) একটা শহর, একা</h2><h2>২) চলে যাওয়া</h2></body></html>`;

// Same SEO surface, different staging host + reordered <head> + extra non-SEO markup.
const NEW_PARITY = `<!doctype html><html lang="bn"><head>
<meta property="og:type" content="article">
<title>রাত বারোটার পর — লস্টমডেস্টি</title>
<link rel="canonical" href="https://new-staging.internal/tahsin/raat-baarotar-por">
<meta property="og:title" content="রাত বারোটার পর — লস্টমডেস্টি">
<meta name="description" content="দিনের শব্দ সরে গেলে যে নীরবতা নামে।">
<meta name="robots" content="index, follow">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"NewsArticle","headline":"রাত বারোটার পর","datePublished":"2024-11-02T20:30:00+06:00","author":{"@type":"Person","name":"তাহসিন আহমেদ"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList"}</script>
</head><body><div class="extra"></div><h1>রাত বারোটার পর</h1><h2>১) একটা শহর, একা</h2><h2>২) চলে যাওয়া</h2></body></html>`;

test("parity: identical SEO surface across hosts → zero diffs", () => {
  const diffs = diffSeo(extractSeo(OLD), extractSeo(NEW_PARITY));
  assert.deepEqual(diffs, []);
});

test("urlPath strips host + trailing slash so staging host is not a false diff", () => {
  assert.equal(urlPath("https://new-staging.internal/a/b/"), "/a/b");
  assert.equal(urlPath("https://www.lostmodesty.com/a/b"), "/a/b");
});

test("parity DETECTS a changed <title>", () => {
  const broken = NEW_PARITY.replace(/<title>[^<]*<\/title>/, "<title>Wrong Title</title>");
  const diffs = diffSeo(extractSeo(OLD), extractSeo(broken));
  assert.ok(diffs.some((d) => d.field === "title"));
});

test("parity DETECTS a changed canonical path", () => {
  const broken = NEW_PARITY.replace("/tahsin/raat-baarotar-por", "/tahsin/wrong-slug");
  const diffs = diffSeo(extractSeo(OLD), extractSeo(broken));
  assert.ok(diffs.some((d) => d.field === "canonical"));
});

test("parity DETECTS a dropped JSON-LD type (NewsArticle removed)", () => {
  const broken = NEW_PARITY.replace(/<script type="application\/ld\+json">\{[^]*?NewsArticle[^]*?<\/script>/, "");
  const diffs = diffSeo(extractSeo(OLD), extractSeo(broken));
  assert.ok(diffs.some((d) => d.field === "jsonld.types" || d.field === "jsonld.article"));
});

test("parity DETECTS more than one <h1>", () => {
  const broken = NEW_PARITY.replace("</body>", "<h1>second</h1></body>");
  const diffs = diffSeo(extractSeo(OLD), extractSeo(broken));
  assert.ok(diffs.some((d) => d.field === "h1.count"));
});

test("parity DETECTS a changed heading outline", () => {
  const broken = NEW_PARITY.replace("২) চলে যাওয়া", "২) অন্য কিছু");
  const diffs = diffSeo(extractSeo(OLD), extractSeo(broken));
  assert.ok(diffs.some((d) => d.field === "headings"));
});

test("extractSeo flags malformed JSON-LD instead of throwing", () => {
  const bad = OLD.replace('{"@context":"https://schema.org","@type":"BreadcrumbList"}', "{not json");
  const sig = extractSeo(bad);
  assert.ok(sig.jsonldTypes.includes("PARSE_ERROR"));
});
