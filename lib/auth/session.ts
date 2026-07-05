import { cookies } from "next/headers";
import { signSession, verifySessionToken } from "./token.mjs";
import { getUser } from "./users.mjs";

// ───────────────────────────────────────────────────────────────────────────
// Cookie session (REBUILD §4 Phase 2 / §3E). Two cookies:
//
//  • SESSION_COOKIE — HttpOnly, HMAC-signed uid+exp. The ONLY thing the server
//    trusts. Name/domain/SameSite MUST be pinned to the OLD platform's session
//    cookie at Phase 2 pre-flight ("session/cookie domain preserved so existing
//    logged-in users aren't ejected at cutover") — "lm_sess" is the staged
//    placeholder until that value is confirmed from live infra.
//
//  • HINT_COOKIE — JS-readable display hint ({ n: name, r: role }) consumed by
//    client islands (UserMenu, CommentArea, BookmarkButton) purely to pick
//    which UI to show. It is NEVER trusted server-side: every mutation
//    re-verifies the HttpOnly cookie. Split like this so STATIC article pages
//    can stay static (reading the real session server-side would force every
//    SSG route dynamic and regress CP1's rendering architecture).
// ───────────────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "lm_sess";
export const HINT_COOKIE = "lm_hint";

const SESSION_DAYS = 30;

/** Dev fallback keeps the staged app runnable with zero env; production MUST
 *  set SESSION_SECRET (and rotate it independently of the old platform's). */
const SECRET = process.env.SESSION_SECRET ?? "dev-only-secret-not-for-production";

export type SessionUser = NonNullable<ReturnType<typeof getUser>>;

/** Set the session (+ display hint) for a verified user. Only callable from a
 *  Server Action / Route Handler (Next cookie-write rule). */
export async function createSession(user: SessionUser): Promise<void> {
  const jar = await cookies();
  const maxAge = 60 * 60 * 24 * SESSION_DAYS;
  const exp = Math.floor(Date.now() / 1000) + maxAge;
  const common = {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
  jar.set(SESSION_COOKIE, signSession({ uid: user.id, exp }, SECRET), {
    ...common,
    httpOnly: true,
  });
  await writeHint(user);
}

/** (Re)write only the JS-readable display hint ({ n: name, r: role }) — used by
 *  createSession and by the profile-settings action after a name change, so the
 *  header/UserMenu picks up the new name without forcing a re-login. Never
 *  security-bearing: the HttpOnly session is untouched (see note at top). */
export async function writeHint(user: Pick<SessionUser, "name" | "role">): Promise<void> {
  const jar = await cookies();
  // Store RAW JSON — Next's cookie layer URL-encodes the value once on write, and
  // readUiHint (client) decodeURIComponent's it once on read. Encoding here too
  // would double-encode, so the client's single decode yields invalid JSON and the
  // header never sees the logged-in name.
  jar.set(HINT_COOKIE, JSON.stringify({ n: user.name, r: user.role }), {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
    httpOnly: false,
  });
}

/** The logged-in user, or null. Verifies the HttpOnly token — the hint cookie
 *  plays no part. NOTE: calling this from a page makes that route dynamic
 *  (SSR) — correct for auth/dashboard/editor, never do it from a read-path
 *  (SSG) page or layout. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const payload = verifySessionToken(jar.get(SESSION_COOKIE)?.value, SECRET);
  if (!payload) return null;
  return getUser(payload.uid) ?? null;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(HINT_COOKIE);
}
