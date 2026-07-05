import type { ReactNode } from "react";
import Link from "next/link";
import { T } from "./T";

// Pagination (FRONTEND §2.4 / §3.3): lightweight text-only "Previous / N of M /
// Next", keeping the live site's minimal pattern. Preserves the `?page=N` scheme
// the rebuild plan requires kept exactly (REBUILD §1#2). Page 1 is the bare path
// (no ?page=1) so the canonical first page has a single URL — no duplicate.
// Disabled edges get BOTH a visual treatment and aria-disabled (§2.4).
export function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const href = (n: number) => (n <= 1 ? basePath : `${basePath}?page=${n}`);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label="পৃষ্ঠা" className="mt-12 flex items-center justify-between gap-4 text-meta">
      <Edge
        href={href(page - 1)}
        enabled={hasPrev}
        rel="prev"
        label={<T bn="আগের" en="Previous" />}
        arrow="←"
      />
      <span className="text-muted" aria-current="page">
        {page} / {totalPages}
      </span>
      <Edge
        href={href(page + 1)}
        enabled={hasNext}
        rel="next"
        label={<T bn="পরের" en="Next" />}
        arrow="→"
      />
    </nav>
  );
}

function Edge({
  href,
  enabled,
  rel,
  label,
  arrow,
}: {
  href: string;
  enabled: boolean;
  rel: "prev" | "next";
  label: ReactNode;
  arrow: string;
}) {
  const content =
    rel === "prev" ? (
      <>
        {arrow} {label}
      </>
    ) : (
      <>
        {label} {arrow}
      </>
    );
  if (!enabled) {
    return (
      <span aria-disabled="true" className="cursor-not-allowed text-muted/50">
        {content}
      </span>
    );
  }
  return (
    <Link href={href} rel={rel} className="text-link hover:underline underline-offset-2">
      {content}
    </Link>
  );
}
