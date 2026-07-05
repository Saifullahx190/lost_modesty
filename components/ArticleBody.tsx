import { Fragment } from "react";
import Image from "next/image";
import type { Block } from "@/lib/content/types";
import { getCoverImage, coverProps } from "@/lib/images";

const INLINE_SIZES = "(min-width: 768px) 720px, 100vw";

// Renders the structured block document to REAL semantic elements (FRONTEND §1.3 /
// §6.2): headings → <h2>/<h3> with stable ids (not styled <p>), so both screen
// readers and the rebuild plan's structured-data fidelity get a true hierarchy.
// In-text footnote markers written as `[^n]` become superscript anchor links to
// the footnote list (§2.4 footnote/citation) with a back-reference id.
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      return <p className="text-body text-text">{withFootnoteRefs(block.text)}</p>;
    case "heading": {
      const cls = "scroll-mt-24 font-display text-h2 text-text";
      return block.level === 2 ? (
        <h2 id={block.id} className={cls}>
          {block.text}
        </h2>
      ) : (
        <h3 id={block.id} className={cls}>
          {block.text}
        </h3>
      );
    }
    case "quote":
      return (
        <blockquote className="border-s-2 border-accent ps-4 text-body italic text-muted">
          <p>{block.text}</p>
          {block.cite && <cite className="mt-1 block text-meta not-italic">— {block.cite}</cite>}
        </blockquote>
      );
    case "image": {
      const img = getCoverImage(block.image)!; // image block always carries a ref
      return (
        <figure className="my-2">
          <div className="relative aspect-cover w-full overflow-hidden rounded-lg border border-border bg-bg-subtle">
            <Image {...coverProps(img, INLINE_SIZES)} />
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-caption text-muted">{block.caption}</figcaption>
          )}
        </figure>
      );
    }
  }
}

// Split paragraph text on `[^n]` markers and render each as a superscript link to
// `#fn-n`, tagged with `id="fnref-n"` so the footnote's back-link can return here.
const FOOTNOTE_RE = /\[\^(\d+)\]/g;

function withFootnoteRefs(text: string) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  FOOTNOTE_RE.lastIndex = 0;
  while ((m = FOOTNOTE_RE.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={last}>{text.slice(last, m.index)}</Fragment>);
    const n = m[1];
    out.push(
      <sup key={`ref-${n}-${m.index}`} className="text-meta">
        <a
          id={`fnref-${n}`}
          href={`#fn-${n}`}
          aria-label={`পাদটীকা ${n}`}
          className="text-accent-secondary no-underline hover:underline"
        >
          [{n}]
        </a>
      </sup>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={`tail-${last}`}>{text.slice(last)}</Fragment>);
  return out;
}
