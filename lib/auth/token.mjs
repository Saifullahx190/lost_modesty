import { createHmac, timingSafeEqual } from "node:crypto";

// ───────────────────────────────────────────────────────────────────────────
// Stateless HMAC-signed session token (REBUILD §4 Phase 2). Pure functions —
// cookie I/O lives in lib/auth/session.ts; keeping sign/verify here lets
// node --test exercise tampering/expiry without a Next runtime.
//
// Token format: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
// Payload: { uid, exp } — exp is unix seconds. Anything malformed, tampered,
// or expired verifies to null; the caller treats null as "logged out", never
// as an error page (a bad cookie must not break a reader's session flow).
// ───────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} SessionPayload
 * @property {string} uid Stable user id (REBUILD §3E: stable entity IDs).
 * @property {number} exp Expiry, unix seconds.
 */

/**
 * @param {SessionPayload} payload
 * @param {string} secret
 * @returns {string}
 */
export function signSession(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

/**
 * @param {string | undefined} token
 * @param {string} secret
 * @param {number} [nowSec] Injectable clock for tests.
 * @returns {SessionPayload | null}
 */
export function verifySessionToken(token, secret, nowSec = Math.floor(Date.now() / 1000)) {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(body).digest();
  let actual;
  try {
    actual = Buffer.from(mac, "base64url");
  } catch {
    return null;
  }
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload?.uid !== "string" || typeof payload?.exp !== "number") return null;
  if (payload.exp <= nowSec) return null;
  return { uid: payload.uid, exp: payload.exp };
}
