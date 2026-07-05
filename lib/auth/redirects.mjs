// Return-path sanitizer for the login round-trip (FRONTEND §3.4: logged-out
// reader trying to comment/bookmark is redirected to login WITH a return path).
// The `next` value arrives from the query string, i.e. attacker-controllable —
// only same-origin, root-relative paths may pass, or the redirect becomes an
// open-redirect phishing vector on the login page of all places.

/** True if the string contains C0 control chars or DEL — never legitimate in a
 *  path. Char-code loop instead of a regex class so no raw control characters
 *  need to appear in this source file.
 *  @param {string} s */
function hasControlChars(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 32 || c === 127) return true;
  }
  return false;
}

/**
 * @param {string | string[] | undefined} raw  ?next= value
 * @param {string} [fallback]
 * @returns {string} A safe root-relative path (query/hash preserved).
 */
export function safeReturnPath(raw, fallback = "/dashboard") {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string" || v.length === 0 || v.length > 2000) return fallback;
  // Must be root-relative: exactly one leading "/" (a second "/" or "\" makes
  // it protocol-relative, which browsers treat as absolute → open redirect).
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return fallback;
  // No scheme smuggling or control characters anywhere in the value.
  if (hasControlChars(v) || v.includes(":")) return fallback;
  return v;
}
