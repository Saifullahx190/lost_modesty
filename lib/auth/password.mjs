import { randomBytes, scryptSync, createHash, timingSafeEqual } from "node:crypto";

// ───────────────────────────────────────────────────────────────────────────
// Password hashing with LEGACY-SCHEME COMPATIBILITY (REBUILD §3E: "password
// hash scheme compatibility confirmed (re-hash on next login if algorithms
// differ) so NO user is forced to reset").
//
// Two schemes are recognised:
//   • "scrypt"        — the NEW platform's scheme. All new registrations and
//                       all upgrades write this.
//   • "legacy-sha256" — STAND-IN for the OLD platform's scheme. The real
//                       algorithm + parameters must be confirmed from the old
//                       codebase at Phase 2 pre-flight; only this one function
//                       (verifyLegacy) changes when it is. Salted SHA-256 is
//                       used here because it is representative of the weak
//                       schemes older blog platforms actually shipped.
//
// verifyPassword() reports `needsRehash: true` for a correct password stored
// under the legacy scheme — the login action then transparently re-hashes to
// scrypt (the "re-hash on next login" path), with zero UI difference between
// a migrated and a new account (FRONTEND §2.4 auth forms).
// ───────────────────────────────────────────────────────────────────────────

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 };

/**
 * Hash a password under the NEW scheme.
 * Format: scrypt$N$r$p$<salt b64url>$<hash b64url>
 * @param {string} password
 * @returns {string}
 */
export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT.keylen, SCRYPT);
  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

/**
 * Hash under the LEGACY stand-in scheme — used only to seed migrated sample
 * users and in tests. The new platform never writes this format.
 * Format: legacy-sha256$<salt hex>$<sha256(salt+password) hex>
 * @param {string} password
 * @param {string} [saltHex]
 * @returns {string}
 */
export function legacyHashPassword(password, saltHex = randomBytes(8).toString("hex")) {
  const digest = createHash("sha256").update(saltHex + password).digest("hex");
  return `legacy-sha256$${saltHex}$${digest}`;
}

/**
 * @typedef {Object} VerifyResult
 * @property {boolean} ok          Password matches the stored hash.
 * @property {boolean} needsRehash Correct password but stored under the legacy
 *                                 scheme (or outdated params) — caller must
 *                                 re-hash with hashPassword() and persist.
 */

/**
 * Verify a password against a stored hash of EITHER scheme.
 * Unknown/malformed formats verify false (never throw — a corrupt row must not
 * take down the login route).
 * @param {string} password
 * @param {string} stored
 * @returns {VerifyResult}
 */
export function verifyPassword(password, stored) {
  const parts = typeof stored === "string" ? stored.split("$") : [];
  try {
    if (parts[0] === "scrypt" && parts.length === 6) {
      const [, N, r, p, saltB64, hashB64] = parts;
      const salt = Buffer.from(saltB64, "base64url");
      const expected = Buffer.from(hashB64, "base64url");
      const actual = scryptSync(password, salt, expected.length, {
        N: Number(N),
        r: Number(r),
        p: Number(p),
      });
      const ok = expected.length === actual.length && timingSafeEqual(expected, actual);
      // Params older than the current policy also trigger an upgrade.
      const current =
        Number(N) === SCRYPT.N && Number(r) === SCRYPT.r && Number(p) === SCRYPT.p;
      return { ok, needsRehash: ok && !current };
    }
    if (parts[0] === "legacy-sha256" && parts.length === 3) {
      const [, saltHex, hex] = parts;
      const expected = Buffer.from(hex, "hex");
      const actual = createHash("sha256").update(saltHex + password).digest();
      const ok = expected.length === actual.length && timingSafeEqual(expected, actual);
      return { ok, needsRehash: ok };
    }
  } catch {
    /* malformed row → fall through to failure */
  }
  return { ok: false, needsRehash: false };
}
