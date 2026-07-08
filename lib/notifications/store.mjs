// ───────────────────────────────────────────────────────────────────────────
// NOTIFICATION READ-STATE — Phase 6 #8 stand-in (REBUILD §1#8: in-app
// notifications, "minimal unread count + list … decouple early via an event bus
// so it can be rebuilt without touching core paths"). The notifications
// THEMSELVES are DERIVED from the comment store (lib/notifications/derive.mjs) —
// no new event table — so this holds only the one piece of genuinely new state:
// how far each user has read.
//
// In production this is a per-user "notifications_seen_at" column (or the event
// service's own read cursor); here it's a globalThis-singleton Map for the same
// action/RSC module-split reason as the other sample stores (a markAllRead in the
// action layer must be visible to the render layer's unread count).
// ───────────────────────────────────────────────────────────────────────────

import { PERSIST, dbLoadNotifRead, dbSetNotifRead } from "../db/index.mjs";

/** @type {typeof globalThis & { __LM_NOTIF_READ__?: Map<string, string> }} */
const g = globalThis;
/** userId → ISO 8601 timestamp the user last marked notifications read. Absent =
 *  never read (everything is unread). */
const readAt = (g.__LM_NOTIF_READ__ ??= new Map(PERSIST ? dbLoadNotifRead() : []));

/** @param {string} userId @returns {string | null} */
export function getReadAt(userId) {
  return readAt.get(userId) ?? null;
}

/** Mark everything up to now as read (called when the user views the list).
 *  @param {string} userId */
export function markAllRead(userId) {
  const ts = new Date().toISOString();
  readAt.set(userId, ts);
  dbSetNotifRead(userId, ts);
}
