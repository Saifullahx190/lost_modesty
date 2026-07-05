import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/content/types";
import { postHref } from "@/lib/content/repo";
import { getCoverImage, coverProps } from "@/lib/images";
import { Byline } from "./Byline";
import { TagList } from "./TagList";

const CARD_SIZES = "(min-width: 1024px) 500px, (min-width: 640px) 50vw, 100vw";

// Index-grid post card (FRONTEND §2.4 PostCard). Fixed 16:10 cover slot so CLS
// stays ~0 regardless of source dimensions (§1.3 / §2.6); title clamps at 3 lines
// (§3.4 very-long-title edge case); no-image fallback is a solid bg-subtle panel
// with the title still legible separately (§3.4 cover-fails-to-load).
//
// `priority` marks the single above-the-fold LCP image per page (§2.6) — the
// caller passes it only for the first card.
export function PostCard({ post, priority = false }: { post: Post; priority?: boolean }) {
  const href = postHref(post);
  const cover = getCoverImage(post.cover);
  return (
    <article className="group flex flex-col">
      <Link
        href={href}
        className="block overflow-hidden rounded-lg border border-border bg-bg-subtle transition-transform duration-150 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:shadow-md"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative aspect-cover w-full">
          {cover ? (
            // alt="" — the card title link carries the accessible name; the cover is
            // decorative here, so an empty alt avoids double-announcing (§1.3).
            <Image {...coverProps(cover, CARD_SIZES, priority)} alt="" />
          ) : (
            <NoCover title={post.title} />
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 pt-3">
        {post.series && (
          <p className="text-caption font-medium text-accent-secondary">
            {/* series part label, e.g. "পর্ব ২" / "শেষ পর্ব" (§3.2 Journey C) */}
            {post.series.partLabel}
          </p>
        )}
        <h2 className="font-display text-card-title text-text">
          <Link href={href} className="line-clamp-3 hover:underline underline-offset-2">
            {post.title}
          </Link>
        </h2>
        <Byline authorSlug={post.author} date={post.date} />
        <p className="line-clamp-2 text-meta text-muted">{post.excerpt}</p>
        <TagList kind="tag" slugs={post.tags} className="mt-auto pt-1" />
      </div>
    </article>
  );
}

// No-cover fallback (§3.4): bg-subtle panel with the marigold motif, no broken-image
// glyph. Title still renders below via the card, so this stays purely decorative.
function NoCover({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-bg-subtle p-4">
      <span className="line-clamp-3 text-center font-display text-card-title text-muted">
        {title}
      </span>
    </div>
  );
}
