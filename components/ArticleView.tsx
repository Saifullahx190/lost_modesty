import type { ReactNode } from "react";
import type { Post } from "@/lib/content/types";
import { getAuthor, getSeriesContext } from "@/lib/content/repo";
import { ArticleHeader } from "./ArticleHeader";
import { ArticleBody } from "./ArticleBody";
import { Footnotes } from "./Footnotes";
import { SeriesNav } from "./SeriesNav";
import { TagList } from "./TagList";

// The single visible-article render, shared by BOTH the live article route
// (app/[author]/[slug]/page.tsx) AND the editor preview (components/editor/
// ArticlePreview.tsx). REBUILD §6.2 is explicit that the editor preview must
// resolve through the SAME rendering path as the live page — "no separate
// preview renderer that can silently diverge" (Checkpoint 5). Extracting the
// body here makes that a structural guarantee, not a discipline: there is
// exactly one component, so preview and published output cannot drift.
//
// Deliberately excludes the live-only islands (bookmark button, comment thread)
// and the <head> JSON-LD — those are owned by the live page. The bookmark
// control is passed in via `actions` so the page can inject it without this
// component depending on session state (which would force it dynamic and can't
// exist in a draft preview anyway).
export function ArticleView({ post, actions }: { post: Post; actions?: ReactNode }) {
  const authorRec = getAuthor(post.author);
  const series = getSeriesContext(post);

  return (
    <>
      <ArticleHeader post={post} />

      {series && <SeriesNav ctx={series} />}

      <div className="mt-8">
        <ArticleBody blocks={post.body} />
      </div>

      {post.footnotes && post.footnotes.length > 0 && <Footnotes footnotes={post.footnotes} />}

      <footer className="mt-12 border-t border-border pt-6">
        <div className="flex items-start justify-between gap-4">
          <TagList kind="tag" slugs={post.tags} />
          {actions}
        </div>
        {authorRec && (
          <p className="mt-4 text-meta text-muted">
            লিখেছেন{" "}
            <a href={`/author/${authorRec.slug}`} className="text-link hover:underline">
              {authorRec.name}
            </a>{" "}
            — {authorRec.bio}
          </p>
        )}
      </footer>
    </>
  );
}
