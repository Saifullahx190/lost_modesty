"use server";

import { getSessionUser } from "@/lib/auth/session";
import { getPostById } from "@/lib/content/repo";
import { isBookmarked, toggleBookmark } from "./store.mjs";

// Bookmark actions (REBUILD §4 Phase 4 / FRONTEND §3.3 bookmark toggle). The
// island calls these; the REAL session is verified here on every call — the
// hint cookie only chose which UI to draw.

export interface BookmarkState {
  /** false ⇒ not signed in: the island sends the reader to /login with a
   *  return path instead of a dead click (§3.4). */
  loggedIn: boolean;
  saved: boolean;
}

export interface BookmarkToggleResult {
  ok: boolean;
  loggedIn: boolean;
  saved: boolean;
  /** Reader-facing Bengali error when ok=false (§3.3: explain, don't fail silently). */
  error?: string;
}

/** Initial state probe, called by the island after mount so the article page
 *  itself stays static. */
export async function getBookmarkState(postId: string): Promise<BookmarkState> {
  const user = await getSessionUser();
  if (!user) return { loggedIn: false, saved: false };
  return { loggedIn: true, saved: isBookmarked(user.id, postId) };
}

export async function toggleBookmarkAction(postId: string): Promise<BookmarkToggleResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, loggedIn: false, saved: false, error: "সংরক্ষণ করতে প্রবেশ করুন।" };
  }
  if (!getPostById(postId)) {
    return {
      ok: false,
      loggedIn: true,
      saved: false,
      error: "লেখাটি খুঁজে পাওয়া গেল না — পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।",
    };
  }
  try {
    const { saved } = toggleBookmark(user.id, postId);
    return { ok: true, loggedIn: true, saved };
  } catch {
    return {
      ok: false,
      loggedIn: true,
      saved: isBookmarked(user.id, postId),
      error: "সংযোগে সমস্যা হলো — আবার চেষ্টা করুন।",
    };
  }
}
