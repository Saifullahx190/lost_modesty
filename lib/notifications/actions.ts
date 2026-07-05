"use server";

import { getSessionUser } from "@/lib/auth/session";
import { unreadCountForUser } from "./feed";
import { markAllRead } from "./store.mjs";

// Notification islands' server actions. Both re-verify the real HttpOnly session
// (the header bell is a client island; the hint cookie only decides whether to
// render it at all). Kept off the static read path — the article page never calls
// these, so it stays SSG.

/** Unread count for the header bell, fetched after mount so the page stays static. */
export async function getUnreadCount(): Promise<number> {
  const user = await getSessionUser();
  return user ? unreadCountForUser(user) : 0;
}

/** Mark everything read — called when the user views the notifications list. */
export async function markNotificationsRead(): Promise<void> {
  const user = await getSessionUser();
  if (user) markAllRead(user.id);
}
