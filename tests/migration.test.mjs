// Edge-router switch tests (REBUILD §2/§4 Phase 0, CP0 "rollback switch verified"
// + "0% traffic on new app"). Zero dependencies — runs under `node --test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ROUTE_RULES,
  DEFAULT_RULE,
  canonicalRoutePath,
} from "../migration.config.mjs";
import { matchRule, bucketOf, resolveTarget } from "../lib/migration.mjs";

test("CP0 invariant: every route rule is at 0% canary (0% on new app)", () => {
  for (const r of [...ROUTE_RULES, DEFAULT_RULE]) {
    assert.equal(r.canaryPercent, 0, `${r.id} must be 0% in Phase 0`);
  }
});

test("CP0 invariant: all traffic resolves to OLD regardless of visitor", () => {
  const paths = [
    "/",
    "/blog",
    "/john-doe/some-bengali-slug",
    "/category/love",
    "/tag/poetry",
    "/author/john-doe",
    "/login",
    "/dashboard",
    "/editor",
    "/anything/else/entirely",
    "/john-doe/some-bengali-slug/opengraph-image", // metadata route — must stay OLD at CP0
    "/john-doe/some-bengali-slug/twitter-image",
    "/opengraph-image",
  ];
  for (const p of paths) {
    for (const v of ["visitorA", "visitorB", "x".repeat(50), ""]) {
      assert.equal(resolveTarget(p, v).target, "OLD", `${p} (${v}) must be OLD`);
    }
  }
});

test("route classification matches the indexed-URL types (§3A)", () => {
  assert.equal(matchRule("/john-doe/my-post").id, "article");
  assert.equal(matchRule("/category/love").id, "category");
  assert.equal(matchRule("/author/john-doe").id, "author");
  assert.equal(matchRule("/login").id, "auth");
  assert.equal(matchRule("/").id, "index");
  assert.equal(matchRule("/totally/unknown/deep/path").id, "default");
});

test("metadata image routes classify as their PARENT route class (not default)", () => {
  // Article OG/Twitter image → article class (the bug this fixes).
  assert.equal(matchRule("/john-doe/my-post/opengraph-image").id, "article");
  assert.equal(matchRule("/john-doe/my-post/twitter-image").id, "article");
  // Variants Next can emit (hash suffix / numbered id / extension) still classify.
  assert.equal(matchRule("/john-doe/my-post/opengraph-image-a1b2c3d4").id, "article");
  assert.equal(matchRule("/john-doe/my-post/opengraph-image/2").id, "article");
  assert.equal(matchRule("/john-doe/my-post/opengraph-image.png").id, "article");
  // Future-proof: the same mechanism co-routes ANY class's image, not just article.
  assert.equal(matchRule("/category/love/opengraph-image").id, "category");
  assert.equal(matchRule("/author/john-doe/opengraph-image").id, "author");
  // Root-level site image → index class.
  assert.equal(matchRule("/opengraph-image").id, "index");
  // Non-metadata deep paths are untouched (no over-stripping).
  assert.equal(canonicalRoutePath("/a/b/c"), "/a/b/c");
  assert.equal(matchRule("/a/b/c").id, "default");
});

test("OG/Twitter image route's routing decision matches its parent article EXACTLY", () => {
  // Parity must hold at every canary level and for every visitor — because the image
  // resolves through the SAME rule object as the page, not a parallel one.
  const rule = ROUTE_RULES.find((r) => r.id === "article");
  const orig = { t: rule.target, p: rule.canaryPercent };
  const article = "/john-doe/my-post";
  const images = ["/john-doe/my-post/opengraph-image", "/john-doe/my-post/twitter-image"];
  try {
    for (const pct of [0, 1, 25, 50, 100]) {
      rule.target = "NEW";
      rule.canaryPercent = pct;
      for (const v of ["v1", "v2", "v3", "x".repeat(40), ""]) {
        const page = resolveTarget(article, v);
        for (const img of images) {
          const card = resolveTarget(img, v);
          assert.equal(card.target, page.target, `target parity @${pct}% v=${v} ${img}`);
          assert.equal(card.rule.id, page.rule.id, "same rule id (article)");
          assert.equal(card.bucket, page.bucket, "same visitor bucket");
        }
      }
    }
  } finally {
    rule.target = orig.t;
    rule.canaryPercent = orig.p;
  }
});

test("rollback semantics: flipping a route to 100% NEW then back to 0% returns OLD", () => {
  const rule = ROUTE_RULES.find((r) => r.id === "article");
  const original = rule.canaryPercent;
  try {
    rule.target = "NEW";
    rule.canaryPercent = 100;
    assert.equal(resolveTarget("/a/b", "anyone").target, "NEW", "ramped → NEW");
    rule.canaryPercent = 0; // rollback flip
    assert.equal(resolveTarget("/a/b", "anyone").target, "OLD", "rollback → OLD");
  } finally {
    rule.target = "OLD";
    rule.canaryPercent = original;
  }
});

test("bucketOf is deterministic and stays in 0–99", () => {
  assert.equal(bucketOf("same-visitor"), bucketOf("same-visitor"));
  for (const k of ["a", "b", "c", "visitor-1234", ""]) {
    const b = bucketOf(k);
    assert.ok(b >= 0 && b < 100, `${k} -> ${b}`);
  }
});

test("canary bucketing splits traffic roughly proportionally at 25%", () => {
  // Sanity that a future 25% ramp would actually send ~25% to NEW (distribution),
  // without committing any Phase-0 route to it.
  const rule = ROUTE_RULES.find((r) => r.id === "article");
  const orig = { t: rule.target, p: rule.canaryPercent };
  try {
    rule.target = "NEW";
    rule.canaryPercent = 25;
    let news = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      if (resolveTarget("/a/b", `visitor-${i}`).target === "NEW") news++;
    }
    const pct = (news / N) * 100;
    assert.ok(pct > 18 && pct < 32, `expected ~25%, got ${pct.toFixed(1)}%`);
  } finally {
    rule.target = orig.t;
    rule.canaryPercent = orig.p;
  }
});
