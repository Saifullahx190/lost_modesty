"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readUiHint, type UiHint } from "@/lib/auth/client";

// Header account entry (Phase 2). One icon link: logged-out → /login,
// logged-in → /dashboard. Session state comes from the JS-readable hint cookie
// AFTER mount, so SSR markup is identical for everyone and static read-path
// pages stay static (see lib/auth/session.ts). Until hydration the logged-out
// link renders — a logged-in reader who clicks it before the effect runs is
// simply forwarded by /login's already-signed-in redirect, so the fallback is
// harmless. New affordance vs the 8 baseline screenshots → CHANGELOG D9.
// ≥44×44px tap target (§1.3), same hit-area idiom as ThemeToggle/MobileNav.
export function UserMenu() {
  const [hint, setHint] = useState<UiHint | null>(null);

  useEffect(() => {
    setHint(readUiHint());
  }, []);

  const label = hint ? `ড্যাশবোর্ড — ${hint.n}` : "প্রবেশ করুন";

  return (
    <Link
      href={hint ? "/dashboard" : "/login"}
      aria-label={label}
      title={label}
      className="grid h-11 w-11 place-items-center rounded-md text-text transition-colors hover:bg-bg-subtle"
    >
      <PersonIcon filled={hint !== null} />
    </Link>
  );
}

function PersonIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5" />
    </svg>
  );
}
