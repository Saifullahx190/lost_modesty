import type { Footnote } from "@/lib/content/types";

// Footnote/citation list (FRONTEND §2.4): an accessible, id-anchored reference list
// with per-note back-links to the in-text marker (`#fnref-n`), rendered inside a
// <details> disclosure so the long reference list doesn't crowd the reading column
// but is one tap away. Anchors stay direct (`#fn-n`) so a backlinked permalink to a
// specific footnote still resolves.
export function Footnotes({ footnotes }: { footnotes: Footnote[] }) {
  if (footnotes.length === 0) return null;
  return (
    <section aria-labelledby="footnotes-heading" className="mt-12 border-t border-border pt-6">
      <details open>
        <summary
          id="footnotes-heading"
          className="cursor-pointer font-display text-h2 text-text marker:text-muted"
        >
          পাদটীকা
        </summary>
        <ol className="mt-4 flex flex-col gap-3">
          {footnotes.map((fn) => (
            <li key={fn.n} id={fn.id} className="scroll-mt-24 text-meta text-muted">
              <span className="me-2 text-accent-secondary">[{fn.n}]</span>
              {fn.text}{" "}
              <a
                href={`#fnref-${fn.n}`}
                aria-label={`লেখায় ফিরে যান, পাদটীকা ${fn.n}`}
                className="text-link no-underline hover:underline"
              >
                ↩
              </a>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
