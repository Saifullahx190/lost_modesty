"use client";

import { useEffect, useState } from "react";

// Theme toggle (FRONTEND §2.4 / §3.3). The no-flash inline script in layout.tsx
// has already set data-theme before first paint; this client island only handles
// the *interactive* swap + persistence. A 150–200ms crossfade is added in CSS
// (globals) and auto-collapses under prefers-reduced-motion (§1.3).
//
// ≥44×44px tap target (§1.3 touch targets — explicitly called out as currently
// too tight on the live mobile header).

type Theme = "light" | "dark";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  // Start null so SSR markup is theme-agnostic (no hydration mismatch); resolve
  // on mount from the same source the no-flash script used.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = (() => {
      try {
        return localStorage.getItem("theme");
      } catch {
        return null;
      }
    })();
    const current =
      stored === "dark" || stored === "light"
        ? (stored as Theme)
        : document.documentElement.getAttribute("data-theme") === "dark"
          ? "dark"
          : systemTheme();
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage blocked — toggle still works for this session */
    }
  }

  const isDark = theme === "dark";
  const label = isDark ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid h-11 w-11 place-items-center rounded-md text-text transition-colors hover:bg-bg-subtle"
    >
      {/* Render both glyphs; cross-fade via opacity so the swap isn't a hard flash. */}
      <span className="relative grid h-6 w-6 place-items-center">
        <SunIcon
          className={`col-start-1 row-start-1 h-6 w-6 transition-opacity duration-150 ${
            theme === null ? "opacity-0" : isDark ? "opacity-100" : "opacity-0"
          }`}
        />
        <MoonIcon
          className={`col-start-1 row-start-1 h-6 w-6 transition-opacity duration-150 ${
            theme === null ? "opacity-0" : isDark ? "opacity-0" : "opacity-100"
          }`}
        />
      </span>
    </button>
  );
}

function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
