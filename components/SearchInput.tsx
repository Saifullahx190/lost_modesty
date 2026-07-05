"use client";

import Link from "next/link";
import { useDeferredValue, useId, useMemo, useState } from "react";
import type { SearchRecord } from "@/lib/content/types";
import { useT } from "@/lib/i18n/useLang";

// Client-side instant search (FRONTEND §3.3): filters an already-shipped lightweight
// index (title/tags/excerpt) as you type — ~300 posts is small enough to inline at
// build time, no server round-trip. useDeferredValue gives the debounced "instant
// feel" without blocking input (§1.3 INP < 200ms). Empty state suggests browsing by
// category instead of a blank area (§3.4 search-no-results).
//
// Progressive enhancement (§3.4 JS-fails): the index grid is server-rendered and
// fully readable without this island; search only *adds* a jump-to affordance.
export function SearchInput({ index }: { index: SearchRecord[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const inputId = useId();
  const statusId = `${inputId}-status`;
  const t = useT();

  const q = deferred.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return index
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 20);
  }, [index, q]);

  const active = q.length > 0;

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        {t("লেখা খুঁজুন", "Search writing")}
      </label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-bg-subtle px-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
        <SearchIcon />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("শিরোনাম বা ট্যাগ দিয়ে খুঁজুন…", "Search by title or tag…")}
          aria-describedby={statusId}
          autoComplete="off"
          className="min-h-[44px] w-full bg-transparent py-2 text-body text-text outline-none placeholder:text-muted"
        />
      </div>

      {/* aria-live so result count is announced as the reader types (§1.3 forms). */}
      <p id={statusId} role="status" aria-live="polite" className="sr-only">
        {active ? t(`${results.length} টি ফলাফল`, `${results.length} results`) : ""}
      </p>

      {active && (
        <div className="mt-2 rounded-md border border-border bg-bg p-2">
          {results.length > 0 ? (
            <>
              <p className="px-2 py-1 text-caption text-muted">
                {t(`${results.length} টি ফলাফল`, `${results.length} results`)}
              </p>
              <ul>
                {results.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="block rounded px-2 py-2 text-body text-text hover:bg-bg-subtle"
                    >
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="px-2 py-3 text-meta text-muted">
              <p className="text-text">{t("কিছু পাওয়া যায়নি।", "Nothing found.")}</p>
              <p className="mt-1">
                {t("বিষয় ধরে দেখুন — ", "Browse by topic — ")}
                <Link href="/category/golpo" className="text-link hover:underline">
                  গল্প
                </Link>
                {", "}
                <Link href="/category/probondho" className="text-link hover:underline">
                  প্রবন্ধ
                </Link>
                {t(" বা ", " or ")}
                <Link href="/category/love" className="text-link hover:underline">
                  প্রেম
                </Link>
                {t("।", ".")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" className="h-5 w-5 shrink-0 text-muted" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
