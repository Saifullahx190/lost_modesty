import { cookies, headers } from "next/headers";
import { PERSIST, dbInsertPageview } from "@/lib/db/index.mjs";
import {
  dhakaDay,
  hashVisitor,
  isTrackablePath,
  newVisitorId,
  normalizeReferrer,
} from "@/lib/analytics/track.mjs";

// First-party pageview beacon (REBUILD §1.1 — no external analytics service).
// The client <TrackView> POSTs the path it just landed on; this handler assigns
// a random first-party visitor cookie (lm_vid), stores only its salted hash, and
// records one row. Node runtime because it writes to better-sqlite3. It never
// blocks or surfaces errors to the reader — a failed beacon must not affect the
// page, so every path returns 204.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "lm_vid";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(request: Request) {
  // No DB provisioned → tracking is a silent no-op (same opt-in contract as the
  // rest of the persistence layer: no DATABASE_PATH, nothing is written).
  if (!PERSIST) return new Response(null, { status: 204 });

  let path: unknown;
  try {
    ({ path } = await request.json());
  } catch {
    return new Response(null, { status: 204 });
  }
  if (typeof path !== "string" || !isTrackablePath(path)) {
    return new Response(null, { status: 204 });
  }

  const jar = await cookies();
  let vid = jar.get(VISITOR_COOKIE)?.value;
  if (!vid) {
    vid = newVisitorId();
    jar.set(VISITOR_COOKIE, vid, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ONE_YEAR,
    });
  }

  const h = await headers();
  const referrer = normalizeReferrer(h.get("referer"), h.get("host") ?? undefined);

  try {
    dbInsertPageview({
      path: path.split(/[?#]/)[0],
      visitor: hashVisitor(vid),
      referrer,
      day: dhakaDay(),
      viewedAt: new Date().toISOString(),
    });
  } catch {
    // Analytics is best-effort; never let a write error reach the reader.
  }
  return new Response(null, { status: 204 });
}
