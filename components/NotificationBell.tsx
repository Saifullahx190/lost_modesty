"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readUiHint } from "@/lib/auth/client";
import { getUnreadCount } from "@/lib/notifications/actions";

const bn = (n: number) => new Intl.NumberFormat("bn-BD").format(n);

// Header notification bell (FRONTEND §2.4 notification system — minimal count).
// Client island like UserMenu: renders NOTHING until mount, then — only for a
// logged-in reader (hint cookie) — shows a bell that links to /notifications and
// fetches the unread count via a server action AFTER mount, so static article
// pages stay static (same seam as BookmarkButton/UserMenu). ≥44×44px tap target.
export function NotificationBell() {
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!readUiHint()) return; // logged-out → nothing to show
    setShow(true);
    let cancelled = false;
    getUnreadCount().then((c) => {
      if (!cancelled) setCount(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  const label = count > 0 ? `বিজ্ঞপ্তি — ${bn(count)}টি নতুন` : "বিজ্ঞপ্তি";
  return (
    <Link
      href="/notifications"
      aria-label={label}
      title={label}
      className="relative grid h-11 w-11 place-items-center rounded-md text-text transition-colors hover:bg-bg-subtle"
    >
      <BellIcon />
      {count > 0 && (
        // Decorative — the count is announced via the link's aria-label above.
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 min-w-[1.05rem] rounded-full bg-accent-secondary px-1 text-center text-[0.65rem] font-bold leading-4 text-white"
        >
          {count > 9 ? `${bn(9)}+` : bn(count)}
        </span>
      )}
    </Link>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
