import Link from "next/link";
import type { SeriesContext } from "@/lib/content/repo";
import { postHref } from "@/lib/content/repo";

// "Part of a series" navigation strip (FRONTEND §3.2 Journey C / §2.4) — a high-value
// addition for this catalog, much of which is serialized ("পর্ব ১/২/শেষ পর্ব").
// Shows the series name, the current part among all parts, and prev/next part links.
export function SeriesNav({ ctx }: { ctx: SeriesContext }) {
  const { series, parts, current, prev, next } = ctx;
  return (
    <nav
      aria-label={`ধারাবাহিক: ${series.name}`}
      className="my-8 rounded-lg border border-border bg-bg-subtle p-4"
    >
      <p className="text-meta text-muted">
        ধারাবাহিক ·{" "}
        <span className="font-medium text-text">{series.name}</span> · {current + 1}/{parts.length} পর্ব
      </p>
      <ol className="mt-3 flex flex-col gap-1">
        {parts.map((p, i) => (
          <li key={p.id}>
            {i === current ? (
              <span aria-current="true" className="text-meta font-medium text-text">
                {p.series?.partLabel} — {p.title}
              </span>
            ) : (
              <Link href={postHref(p)} className="text-meta text-link hover:underline">
                {p.series?.partLabel} — {p.title}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex justify-between gap-4 text-meta">
        {prev ? (
          <Link href={postHref(prev)} rel="prev" className="text-link hover:underline">
            ← {prev.series?.partLabel}
          </Link>
        ) : (
          <span aria-disabled="true" className="text-muted/50">
            ← আগের পর্ব
          </span>
        )}
        {next ? (
          <Link href={postHref(next)} rel="next" className="text-link hover:underline">
            {next.series?.partLabel} →
          </Link>
        ) : (
          <span aria-disabled="true" className="text-muted/50">
            পরের পর্ব →
          </span>
        )}
      </div>
    </nav>
  );
}
