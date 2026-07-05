import Image from "next/image";
import type { Post } from "@/lib/content/types";
import { getCoverImage, coverProps } from "@/lib/images";
import { Byline } from "./Byline";
import { TagList } from "./TagList";

const HERO_SIZES = "(min-width: 768px) 720px, 100vw";

// Article header block (FRONTEND §2.4): single <h1> = post title, byline, tag row,
// optional hero cover. The cover is the page's LCP element → eager + priority for
// the < 2.0s target (§1.3 / §2.6). A near-white cover gets a 1px border in dark mode
// so it doesn't float as an unstyled white box on black (§2.6 dark-mode imagery).
export function ArticleHeader({ post }: { post: Post }) {
  const cover = getCoverImage(post.cover);
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {post.series && (
          <p className="text-meta font-medium text-accent-secondary">{post.series.partLabel}</p>
        )}
        <h1 className="font-display text-display text-text">{post.title}</h1>
        <Byline authorSlug={post.author} date={post.date} />
        <TagList kind="category" slugs={post.categories} />
      </div>

      {cover && (
        <figure className="relative aspect-cover w-full overflow-hidden rounded-lg border border-border bg-bg-subtle">
          {/* Hero is the LCP element → priority (§2.6). Meaningful alt is preserved
              from the content ref (§1.3), unlike the decorative card cover. */}
          <Image {...coverProps(cover, HERO_SIZES, true)} />
        </figure>
      )}
    </header>
  );
}
