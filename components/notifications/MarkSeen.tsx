"use client";

import { useEffect } from "react";
import { markNotificationsRead } from "@/lib/notifications/actions";

// Marks notifications read once the list has been viewed (FRONTEND §2.4: viewing
// the list is what clears the unread count). Renders nothing — a mount-effect
// island so the page itself stays a side-effect-free server render; the list is
// computed with its unread flags BEFORE this fires, so the "new" markers still
// show on this view and only the NEXT visit (and the header bell) reads as clear.
export function MarkSeen() {
  useEffect(() => {
    markNotificationsRead();
  }, []);
  return null;
}
