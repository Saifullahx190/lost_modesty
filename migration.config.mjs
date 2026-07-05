// ───────────────────────────────────────────────────────────────────────────
// EDGE ROUTER — per-route migration switch (REBUILD_PLAN.md §2 "strangler-fig",
// §4 Phase 0). Single place that decides, per route class, whether a request is
// served by the NEW Next.js app or rewritten to the OLD live platform.
//
// PHASE 0 INVARIANT (CP0): every route → OLD, canaryPercent = 0.
//   "Live site untouched, 0% traffic on new app."  ← asserted by tests/migration.test.mjs
// A route is promoted only after its phase checkpoint passes, by raising
// canaryPercent 1 → 5 → 25 → 100 (REBUILD §3D / §4 Phase 1).
// ROLLBACK = set the route's canaryPercent back to 0 (or target 'OLD'); one edit,
// flips in seconds (REBUILD §3D rollback runbook, CP0 "rollback switch verified").
//
// Authored as .mjs (JSDoc-typed) so the SAME module runs under Node for unit tests
// AND bundles into the Next middleware — no duplicated logic, no bundler-only code.
// ───────────────────────────────────────────────────────────────────────────

/** @typedef {"OLD"|"NEW"} MigrationTarget */
/**
 * @typedef {Object} RouteRule
 * @property {string} id            Stable id for logs/observability + rollback runbook.
 * @property {RegExp} pattern       First matching rule wins (source order matters).
 * @property {number} phase         Phase that owns this route (REBUILD §4 traceability).
 * @property {MigrationTarget} target  Base target.
 * @property {number} canaryPercent 0–100. Phase 0: all 0. Canary ramp: 1→5→25→100.
 */

/** OLD live origin that not-yet-migrated routes are rewritten to. */
export const OLD_ORIGIN = process.env.OLD_ORIGIN ?? "https://www.lostmodesty.com";

/**
 * @type {RouteRule[]} Route classes mirror the indexed-URL types in REBUILD §3A.
 *
 * ORDER IS LOAD-BEARING (first match wins). The generic two-segment `article`
 * pattern `/{author}/{slug}` is structurally identical to `/category/{slug}`,
 * `/tag/{slug}`, `/author/{name}`, etc., so every reserved-prefix route MUST be
 * listed BEFORE `article`, and `article` MUST stay last among the matchers.
 * NOTE: the definitive article URL shape is unresolved between the two plan docs
 * (REBUILD §1#1 lists `/{author}/{slug}` AND `/{year}/{month}/{slug}`; FRONTEND
 * §3.1 assumes `/{author}/{slug}`) — it is pinned in Phase 1 from the real §3A
 * inventory. This placeholder is precedence-correct for either shape.
 */
export const ROUTE_RULES = [
  // ── Specific reserved-prefix routes first ──
  // Phase 1 — read path (highest traffic risk)
  { id: "index",    pattern: /^\/(blog\/?)?$/,      phase: 1, target: "OLD", canaryPercent: 0 },
  { id: "feed",     pattern: /^\/(feed|rss|atom)/,  phase: 1, target: "OLD", canaryPercent: 0 },
  { id: "category", pattern: /^\/category\/[^/]+/,  phase: 1, target: "OLD", canaryPercent: 0 },
  { id: "tag",      pattern: /^\/tag\/[^/]+/,       phase: 1, target: "OLD", canaryPercent: 0 },
  { id: "author",   pattern: /^\/author\/[^/]+/,    phase: 1, target: "OLD", canaryPercent: 0 },

  // Phase 2 — auth
  { id: "auth",     pattern: /^\/(login|register|logout|auth)/, phase: 2, target: "OLD", canaryPercent: 0 },

  // Phase 3-6 — wave 2 / deferred
  { id: "comments-api", pattern: /^\/api\/comments/,     phase: 3, target: "OLD", canaryPercent: 0 },
  { id: "dashboard",    pattern: /^\/dashboard/,         phase: 4, target: "OLD", canaryPercent: 0 },
  { id: "bookmarks",    pattern: /^\/(bookmarks|saved)/, phase: 4, target: "OLD", canaryPercent: 0 },
  { id: "editor",       pattern: /^\/(editor|write|new-post)/, phase: 5, target: "OLD", canaryPercent: 0 },
  { id: "profile",      pattern: /^\/(profile|settings|u)(?:\/|$)/, phase: 6, target: "OLD", canaryPercent: 0 },
  { id: "activity",     pattern: /^\/activity(?:\/|$)/,      phase: 6, target: "OLD", canaryPercent: 0 },
  { id: "notifications", pattern: /^\/notifications(?:\/|$)/, phase: 6, target: "OLD", canaryPercent: 0 },

  // ── Generic article pattern LAST (overlaps the prefixes above) ──
  { id: "article",  pattern: /^\/[^/]+\/[^/]+\/?$/, phase: 1, target: "OLD", canaryPercent: 0 },
];

/** @type {RouteRule} Fallback for anything unmatched: OLD until explicitly migrated. */
export const DEFAULT_RULE = {
  id: "default",
  pattern: /.*/,
  phase: 0,
  target: "OLD",
  canaryPercent: 0,
};

// ───────────────────────────────────────────────────────────────────────────
// Metadata-route co-routing (Next.js opengraph-image / twitter-image convention).
//
// A page's generated image routes live at a CHILD path of the page itself, e.g.
//   page:  /{author}/{slug}              → `article` class
//   image: /{author}/{slug}/opengraph-image
// The image has one extra segment, so a literal match would miss `article` and fall
// to DEFAULT → OLD. That would split a page from its own social card: the article on
// NEW, its OG image still on OLD (or vice-versa) at every canary step.
//
// We do NOT add a parallel rule per image (its target/canaryPercent would drift from
// the parent's). Instead `canonicalRoutePath()` strips the trailing metadata segment
// so the image classifies through the SAME rule object as its parent page — for ANY
// route class, not just article. One matcher, one canary decision, automatic parity.
//
// FUTURE-PROOF: add a filename here (no logic change) when a new metadata route
// appears. The tail also tolerates the hash/id/extension variants Next can emit
// (opengraph-image-<hash>, opengraph-image/<n>, opengraph-image.png).
// ───────────────────────────────────────────────────────────────────────────

/** Next.js metadata image route basenames that must co-route with their parent. */
export const METADATA_ROUTE_BASENAMES = ["opengraph-image", "twitter-image"];

const METADATA_TAIL = new RegExp(
  `/(?:${METADATA_ROUTE_BASENAMES.join("|")})(?:-[A-Za-z0-9]+)?(?:/\\d+)?(?:\\.[A-Za-z0-9]+)?/?$`,
);

/**
 * Map a metadata image path to the path of the page it belongs to, so it classifies
 * as its parent route. Non-metadata paths pass through unchanged. Stripping the root
 * metadata route (`/opengraph-image`) yields "/" (the index). Pure + deterministic.
 * @param {string} pathname
 * @returns {string}
 */
export function canonicalRoutePath(pathname) {
  if (!METADATA_TAIL.test(pathname)) return pathname;
  const stripped = pathname.replace(METADATA_TAIL, "");
  return stripped === "" ? "/" : stripped;
}
