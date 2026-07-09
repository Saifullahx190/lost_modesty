"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Client pageview beacon. Fires AFTER first paint (useEffect), so it neither
// forces static read-path pages dynamic nor blocks render — the SSG rendering
// architecture (lib/auth/session.ts note) is untouched. Because it only runs in
// a real browser with JS, prefetches and most bots are excluded for free, which
// keeps the numbers closer to "humans who actually read".
//
// One row per client navigation: the effect is keyed on pathname, and a ref
// guards against React 18 StrictMode's double-invoke in dev so a single visit
// isn't counted twice. sendBeacon survives the page being navigated away from;
// fetch(keepalive) is the fallback where it's unavailable.
export function TrackView() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastSent.current === pathname) return;
    lastSent.current = pathname;

    const body = JSON.stringify({ path: pathname });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
        return;
      }
    } catch {
      // fall through to fetch
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
