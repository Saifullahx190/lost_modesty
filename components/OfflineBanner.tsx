"use client";

import { useEffect, useState } from "react";

// Offline indicator (FRONTEND §3.4 "Offline (mobile, lost connection mid-read)").
// The SSR/no-app-shell architecture already keeps the already-loaded article
// visible when the connection drops — nothing wipes the DOM. This island adds the
// one missing affordance the plan calls for: a small inline banner that tells a
// reader they're offline (so a tap that won't load isn't a silent dead end),
// which clears itself the moment the connection returns.
//
// Renders NOTHING while online, so it costs no DOM on the normal path and its
// initial client render matches the SSR output (null) — no hydration mismatch,
// same island pattern as NotificationBell/UserMenu. aria-live announces the state
// change to screen readers; the slide-in is motion-safe only (§1.3 reduced motion).
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync(); // catch the case where we mount already-offline
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    // Always present as a live region so the transition to offline is ANNOUNCED,
    // but visually empty until it actually happens.
    <div role="status" aria-live="polite" className="pointer-events-none">
      {offline && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] motion-safe:animate-[offline-in_200ms_ease-out]">
          <p className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-bg-subtle px-4 py-2 text-meta text-text shadow-md">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-accent-secondary" />
            অফলাইন — সংযোগ ফিরলে বাকি পাতাগুলো আবার খুলবে।
          </p>
        </div>
      )}
    </div>
  );
}
