"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { NavItem } from "@/lib/site";

// Mobile hamburger disclosure (FRONTEND §2.4 header mobile open/closed). Headless
// behaviour hand-rolled minimally: Escape closes, focus returns to the trigger,
// and the panel is a real disclosure (aria-expanded/controls) — the accessibility
// state machinery §1.2 calls for, without pulling a menu library for one toggle.
export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
        onClick={() => setOpen((v) => !v)}
        className="grid h-11 w-11 place-items-center rounded-md text-text transition-colors hover:bg-bg-subtle"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && (
        <div
          id="mobile-nav-panel"
          className="absolute inset-x-0 top-full z-20 border-b border-border bg-bg"
        >
          <nav aria-label="প্রধান মেনু" className="mx-auto max-w-index px-4 py-2">
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.href} className="border-b border-border last:border-0">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-body text-text"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" className="h-6 w-6" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" className="h-6 w-6" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
