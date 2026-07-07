import { hashPassword, legacyHashPassword } from "./password.mjs";

// ───────────────────────────────────────────────────────────────────────────
// LOCAL SAMPLE USER STORE — Phase 2 stand-in for the real auth backend, the
// same convention as lib/content/posts.ts standing in for the read-replica.
// In production these reads/writes go to the shared user DB (dual-write/CDC
// during transition, REBUILD §2); the function signatures are the contract.
//
// User ids are STABLE and carried over from the old platform (REBUILD §3E:
// "stable entity IDs (post ID, user ID, comment ID) carried across so
// comments/bookmarks/activity don't detach") — comments + bookmarks in
// lib/comments and lib/bookmarks reference these same u-#### ids.
//
// The seeded reader "নীলা" is a MIGRATED account: her hash is in the legacy
// scheme, so her first login exercises the transparent re-hash path with no
// forced reset and no UI difference (REBUILD §3E / FRONTEND §2.4 auth forms).
// In-memory Map ⇒ mutations are per-process (fine for the staged app; the
// real store replaces this file, not its callers).
// ───────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} User
 * @property {string} id           Stable user id (old-platform key preserved).
 * @property {string} email        Unique, normalized lowercase.
 * @property {string} name         Display name shown on comments/dashboard.
 * @property {string} bio          Short profile bio (Phase 6 profile settings).
 * @property {"reader"|"author"} role
 * @property {string} [authorSlug] For role=author: the /author/{slug} identity.
 * @property {string} passwordHash Either scheme — see lib/auth/password.mjs.
 * @property {string} createdAt    ISO 8601.
 */

/** Demo credentials (documented for local verification, NOT a secret):
 *  lostmodesty@lostmodesty.com / raat-jaaga-1  (the sole author, new-scheme hash)
 *  rumki@lostmodesty.com       / modhyobortini-2 (reader, new-scheme hash)
 *  nila@example.com            / porano-shohor (migrated reader, LEGACY hash)
 *
 * There is ONE author identity — লস্ট মডেস্টি (authorSlug "lostmodesty"); every
 * post is bylined to it. Other accounts are readers (they comment, don't publish). */
const SEED = [
  {
    id: "u-1001",
    email: "lostmodesty@lostmodesty.com",
    name: "লস্ট মডেস্টি",
    bio: "অশ্লীলতা আর নোংরামির বিরুদ্ধে লস্ট মডেস্টি টিমের সমস্ত লেখা।",
    role: "author",
    authorSlug: "lostmodesty",
    passwordHash: hashPassword("raat-jaaga-1"),
    createdAt: "2019-03-11T10:00:00+06:00",
  },
  {
    id: "u-1002",
    email: "rumki@lostmodesty.com",
    name: "রুমকি বসু",
    bio: "নিয়মিত পাঠক।",
    role: "reader",
    passwordHash: hashPassword("modhyobortini-2"),
    createdAt: "2020-07-02T10:00:00+06:00",
  },
  {
    id: "u-2001",
    email: "nila@example.com",
    name: "নীলা রহমান",
    bio: "",
    role: "reader",
    passwordHash: legacyHashPassword("porano-shohor"),
    createdAt: "2021-01-19T22:15:00+06:00",
  },
];

// Process singleton via globalThis. Next compiles server actions and page/RSC
// renders into SEPARATE module graphs, so a plain module-level Map is created
// twice — a user registered or a profile edited in the action layer would be
// invisible to the render layer (new logins would read as logged-out; profile
// edits wouldn't show). Pinning to globalThis makes both layers share one Map.
// Stand-in-store concern only: the real user DB (REBUILD §2 dual-write/CDC) is
// shared by construction, so this shim disappears with it. Same pattern as
// lib/content/posts.ts POSTS.
/** @type {typeof globalThis & { __LM_USERS__?: Map<string, User>, __LM_USER_SEQ__?: number }} */
const g = globalThis;
/** @type {Map<string, User>} keyed by user id */
const users = (g.__LM_USERS__ ??= new Map(SEED.map((u) => [u.id, u])));
g.__LM_USER_SEQ__ ??= 3001;

/** @param {string} raw @returns {string} */
export function normalizeEmail(raw) {
  return (raw ?? "").trim().toLowerCase();
}

/** @param {string} id @returns {User | undefined} */
export function getUser(id) {
  return users.get(id);
}

/** @param {string} email @returns {User | undefined} */
export function findUserByEmail(email) {
  const norm = normalizeEmail(email);
  for (const u of users.values()) if (u.email === norm) return u;
  return undefined;
}

/**
 * Create a new (reader) account. Caller has already validated fields; this
 * only enforces the uniqueness invariant.
 * @param {{ name: string, email: string, password: string }} input
 * @returns {User}
 */
export function createUser({ name, email, password }) {
  const norm = normalizeEmail(email);
  if (findUserByEmail(norm)) throw new Error("email already registered");
  /** @type {User} */
  const user = {
    id: `u-${g.__LM_USER_SEQ__++}`,
    email: norm,
    name: name.trim(),
    bio: "",
    role: "reader",
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.set(user.id, user);
  return user;
}

/** Persist a scheme upgrade after a successful legacy login (REBUILD §3E).
 * @param {string} id @param {string} passwordHash */
export function updatePasswordHash(id, passwordHash) {
  const u = users.get(id);
  if (u) u.passwordHash = passwordHash;
}

/** Phase 6 simplified profile settings: name + bio (+ password via the action).
 * @param {string} id @param {{ name?: string, bio?: string }} patch */
export function updateProfile(id, patch) {
  const u = users.get(id);
  if (!u) return;
  if (typeof patch.name === "string" && patch.name.trim()) u.name = patch.name.trim();
  if (typeof patch.bio === "string") u.bio = patch.bio.trim();
}
