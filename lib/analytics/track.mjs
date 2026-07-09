import crypto from "node:crypto";

// ───────────────────────────────────────────────────────────────────────────
// First-party analytics helpers (no third-party script, no IP stored). The
// route handler owns a random per-browser cookie (lm_vid); everything that
// reaches the DB is derived here so the pageviews table holds only a salted
// hash, a normalized referrer host, and a Dhaka-local day bucket — nothing that
// re-identifies a reader. Pure + synchronous so the route stays trivial.
// ───────────────────────────────────────────────────────────────────────────

/** Same dev fallback as the session layer — production MUST set SESSION_SECRET. */
const SECRET = process.env.SESSION_SECRET ?? "dev-only-secret-not-for-production";

/** Salt + hash the raw first-party id so the stored `visitor` can't be reversed
 *  to the cookie value. Truncated — 20 hex chars is ample to keep visitors
 *  distinct without retaining a full fingerprint. */
export function hashVisitor(rawId) {
  return crypto
    .createHash("sha256")
    .update(`${rawId}:${SECRET}`)
    .digest("hex")
    .slice(0, 20);
}

/** Fresh opaque visitor id for a browser that has no lm_vid cookie yet. */
export function newVisitorId() {
  return crypto.randomUUID();
}

/** YYYY-MM-DD in Asia/Dhaka (bn_BD, +06) so "daily" buckets match the reader's
 *  calendar day, not UTC. en-CA formats as an ISO-ish YYYY-MM-DD. */
export function dhakaDay(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

/** Reduce a raw Referer header to a bare host, dropping same-origin traffic to
 *  'direct'. A few common sources get friendly labels; everything else keeps its
 *  host. Never throws on a malformed header. */
export function normalizeReferrer(referer, selfHost) {
  if (!referer) return "direct";
  let host;
  try {
    host = new URL(referer).hostname.replace(/^www\./, "");
  } catch {
    return "direct";
  }
  if (!host || (selfHost && host === selfHost.replace(/^www\./, ""))) return "direct";
  const FRIENDLY = {
    "google.com": "Google",
    "l.facebook.com": "Facebook",
    "facebook.com": "Facebook",
    "m.facebook.com": "Facebook",
    "t.co": "Twitter/X",
    "com.google.android.googlequicksearchbox": "Google",
    "duckduckgo.com": "DuckDuckGo",
    "bing.com": "Bing",
  };
  return FRIENDLY[host] ?? host;
}

/** Only public content is counted. Admin/auth/internal surfaces are noindex and
 *  irrelevant to "who reads the blog", so they never enter the traffic table. */
const IGNORED_PREFIXES = [
  "/api",
  "/dashboard",
  "/editor",
  "/login",
  "/logout",
  "/register",
  "/settings",
  "/notifications",
  "/activity",
  "/_next",
];
export function isTrackablePath(path) {
  if (typeof path !== "string" || !path.startsWith("/")) return false;
  const clean = path.split(/[?#]/)[0];
  return !IGNORED_PREFIXES.some((p) => clean === p || clean.startsWith(`${p}/`));
}
