// Pure, framework-free decision logic for the edge router. Zero dependencies, so
// it runs identically under Node (unit tests) and inside the Next middleware
// bundle (CP0 "rollback switch verified" needs a deterministic, testable switch).
import { ROUTE_RULES, DEFAULT_RULE, canonicalRoutePath } from "../migration.config.mjs";

/** @typedef {import("../migration.config.mjs").RouteRule} RouteRule */
/** @typedef {import("../migration.config.mjs").MigrationTarget} MigrationTarget */

/**
 * First matching rule wins; falls back to DEFAULT_RULE (OLD). The pathname is first
 * normalized so a page's metadata image routes (opengraph-image / twitter-image)
 * classify as their parent page and ramp with it — see canonicalRoutePath. Because
 * resolveTarget() routes through here, that parity is inherited everywhere with no
 * duplicated rule or canary decision.
 * @param {string} pathname
 * @returns {RouteRule}
 */
export function matchRule(pathname) {
  const path = canonicalRoutePath(pathname);
  return ROUTE_RULES.find((r) => r.pattern.test(path)) ?? DEFAULT_RULE;
}

/**
 * Deterministic 0–99 bucket from a stable per-visitor key, so the SAME visitor
 * always lands in the same bucket (no flicker between OLD/NEW mid-session).
 * FNV-1a — small, dependency-free, adequate for traffic splitting.
 * @param {string} key
 * @returns {number}
 */
export function bucketOf(key) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % 100;
}

/**
 * The core switch. Phase 0: every canaryPercent is 0 → always OLD. Rollback (set
 * percent to 0) forces OLD instantly.
 * @param {string} pathname
 * @param {string} visitorKey
 * @returns {{ target: MigrationTarget, rule: RouteRule, bucket: number }}
 */
export function resolveTarget(pathname, visitorKey) {
  const rule = matchRule(pathname);
  const bucket = bucketOf(visitorKey);
  // Only NEW-eligible rules can serve NEW, and only if the visitor's bucket falls
  // under the canary percentage. percent=0 → nothing is < 0 → always OLD.
  const servesNew = rule.target === "NEW" && bucket < rule.canaryPercent;
  return { target: servesNew ? "NEW" : "OLD", rule, bucket };
}
