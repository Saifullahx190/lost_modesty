// Shared SEO-signal extractor + comparator (REBUILD §3C / Verification #2). ONE
// implementation used by both the live shadow diff (scripts/shadow-diff.mjs, fetches
// NEW vs OLD origins) and the offline parity check (scripts/parity-check.mjs, compares
// saved snapshots) and the unit test (tests/parity.test.mjs). Keeping a single source
// means "what counts as an SEO regression" is defined once, not three times.
//
// Dependency-free regex parsing — deliberately. These checkpoints must run anywhere
// (CI, pre-deploy, a laptop with no install) the way the rest of the Phase-0 gates do.

const pick = (html, re) => (html.match(re)?.[1] ?? "").trim();
const pickAll = (html, re) => [...html.matchAll(re)].map((m) => m[1].trim());

const stripTags = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** Canonical/OG URLs differ by host between OLD and a NEW staging origin; comparing
 *  by path+query avoids false diffs while still catching a real slug/param change. */
export function urlPath(u) {
  if (!u) return "";
  try {
    const { pathname, search } = new URL(u);
    return pathname.replace(/\/+$/, "") + search || "/";
  } catch {
    return u; // already a path, or malformed — compare raw
  }
}

/** Parse every <script type="application/ld+json"> into objects (bad JSON → skipped,
 *  surfaced as a `_parseError` marker so a broken block is itself a detectable diff). */
export function extractJsonLd(html) {
  const blocks = pickAll(
    html,
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  return blocks.map((raw) => {
    try {
      return JSON.parse(raw.trim());
    } catch {
      return { _parseError: true, raw: raw.trim().slice(0, 80) };
    }
  });
}

/** Extract the SEO-load-bearing surface of an HTML document. */
export function extractSeo(html) {
  const jsonld = extractJsonLd(html);
  return {
    title: stripTags(pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i)),
    description: pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i),
    canonical: pick(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([\s\S]*?)["']/i),
    robots: pick(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([\s\S]*?)["']/i),
    ogTitle: pick(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([\s\S]*?)["']/i),
    ogType: pick(html, /<meta[^>]+property=["']og:type["'][^>]+content=["']([\s\S]*?)["']/i),
    // h1 must be exactly one per page (FRONTEND §1.3 semantic structure).
    h1: pickAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).map(stripTags),
    // Heading outline (order + level) — structure parity, not just presence.
    headings: [...html.matchAll(/<(h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => ({
      level: m[1].toLowerCase(),
      text: stripTags(m[2]),
    })),
    jsonldTypes: jsonld.map((o) => o["@type"] ?? (o._parseError ? "PARSE_ERROR" : "?")).sort(),
    jsonld,
  };
}

/** Pull the comparable essence of an Article JSON-LD node, if present (the fields
 *  Google actually reads). Lets parity assert these survived, ignoring incidental
 *  ordering/whitespace. */
function articleNode(jsonld) {
  const a = jsonld.find((o) => o["@type"] === "NewsArticle" || o["@type"] === "Article");
  if (!a) return null;
  const authorName = Array.isArray(a.author) ? a.author[0]?.name : a.author?.name;
  return {
    headline: a.headline ?? "",
    datePublished: a.datePublished ?? "",
    author: authorName ?? "",
  };
}

/**
 * Compare OLD vs NEW SEO signals. Returns an array of {field, old, new} diffs (empty
 * = parity). `compareCanonicalHost: false` (default) compares canonical/og by path so
 * a staging host doesn't false-positive; set true once NEW serves the canonical host.
 */
export function diffSeo(oldSig, newSig, { compareCanonicalHost = false } = {}) {
  const diffs = [];
  const eq = (field, a, b) => {
    if (a !== b) diffs.push({ field, old: a, new: b });
  };

  eq("title", oldSig.title, newSig.title);
  eq("description", oldSig.description, newSig.description);
  eq("robots", oldSig.robots, newSig.robots);
  eq("ogTitle", oldSig.ogTitle, newSig.ogTitle);
  eq("ogType", oldSig.ogType, newSig.ogType);

  const can = (s) => (compareCanonicalHost ? s.canonical : urlPath(s.canonical));
  eq("canonical", can(oldSig), can(newSig));

  // h1: both must have exactly one, and they must match.
  if (oldSig.h1.length !== 1 || newSig.h1.length !== 1) {
    diffs.push({ field: "h1.count", old: oldSig.h1.length, new: newSig.h1.length });
  } else {
    eq("h1", oldSig.h1[0], newSig.h1[0]);
  }

  eq("headings", JSON.stringify(oldSig.headings), JSON.stringify(newSig.headings));
  eq("jsonld.types", oldSig.jsonldTypes.join(","), newSig.jsonldTypes.join(","));

  const oa = articleNode(oldSig.jsonld);
  const na = articleNode(newSig.jsonld);
  if (oa || na) eq("jsonld.article", JSON.stringify(oa), JSON.stringify(na));

  return diffs;
}
