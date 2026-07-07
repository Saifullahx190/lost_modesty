// ───────────────────────────────────────────────────────────────────────────
// CANONICAL POST IDENTITIES — the immutable keys (REBUILD §3A "decide the
// immutable key (post ID) that bookmarks/comments/redirects all reference").
//
// Single source of truth shared by BOTH sides of the checkpoint contract:
//   • lib/content/posts.ts spreads these into the Post records (TS app), so a
//     post can never carry an id/slug pair that isn't registered here;
//   • node --test checkpoint validators (tests/engagement.test.mjs) verify that
//     every comment and bookmark resolves to one of these ids (REBUILD §4
//     Checkpoints 3–4) WITHOUT needing a TS build.
//
// Authored as .mjs (JSDoc-typed) for the same reason as lib/migration.mjs: the
// SAME module runs under plain Node for tests AND bundles into the Next app.
// When the read-replica/content API lands, this list is produced from it.
// ───────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} PostIdentity
 * @property {string} id     Stable post id — never derived from the slug.
 * @property {string} author Author slug — the {author} URL segment.
 * @property {string} slug   Post slug — the {slug} URL segment.
 */

/** @type {PostIdentity[]} */
// Every post is authored by the single লস্ট মডেস্টি identity (author slug
// "lostmodesty") — no individual writers. Slugs stay per-post and stable.
export const POST_IDENTITIES = [
  { id: "p-1001", author: "lostmodesty", slug: "raat-baarotar-por" },
  { id: "p-1002", author: "lostmodesty", slug: "prem-rajniti-ar-modhyobortini" },
  { id: "p-1003", author: "lostmodesty", slug: "haariye-jawa-shohor-porbo-1" },
  { id: "p-1004", author: "lostmodesty", slug: "haariye-jawa-shohor-porbo-2" },
  { id: "p-1005", author: "lostmodesty", slug: "haariye-jawa-shohor-shesh-porbo" },
  { id: "p-1006", author: "lostmodesty", slug: "atatayi-bhalobasha" },
];

/** All stable post ids, for "does this reference resolve?" checks. */
export const POST_IDS = POST_IDENTITIES.map((p) => p.id);

/**
 * Identity for one post id. Throws on an unknown id so a typo in a content
 * record fails the build loudly instead of shipping an unresolvable key.
 * @param {string} id
 * @returns {PostIdentity}
 */
export function postIdentity(id) {
  const found = POST_IDENTITIES.find((p) => p.id === id);
  if (!found) throw new Error(`unknown post id: ${id} — register it in lib/content/ids.mjs`);
  return found;
}

/**
 * Canonical article path for an identity — mirror of repo.postHref for plain-
 * Node consumers (tests, scripts) that can't import the TS repo.
 * @param {PostIdentity} p
 * @returns {string}
 */
export function identityHref(p) {
  return `/${p.author}/${p.slug}`;
}
