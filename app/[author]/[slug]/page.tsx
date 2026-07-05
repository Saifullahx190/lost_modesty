import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { JsonLd } from "@/components/JsonLd";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { BookmarkButton } from "@/components/BookmarkButton";
import { AuthorPostControls } from "@/components/content/AuthorPostControls";
import { getAllPosts, getPost, getAuthor, termName } from "@/lib/content/repo";
import { articleMetadata, articleLd, breadcrumbLd, personLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Article page (REBUILD §4 Phase 1 #1 / FRONTEND §3.1 #2) — the product. SSG via
// generateStaticParams over every post; one route owns the canonical `/{author}/{slug}`
// shape (REBUILD §3A). Reproduces canonical, OG, NewsArticle + BreadcrumbList +
// Person structured data exactly, the signals the shadow-diff checks (REBUILD §3C).

type Params = Promise<{ author: string; slug: string }>;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ author: p.author, slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { author, slug } = await params;
  const post = getPost(author, slug);
  if (!post) return {};
  return articleMetadata(post);
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { author, slug } = await params;
  const post = getPost(author, slug);
  if (!post) notFound();

  const authorRec = getAuthor(post.author);
  const primaryCategory = post.categories[0];

  // BreadcrumbList: Home › Category › Article (REBUILD §3C BreadcrumbList).
  const crumbs = [
    { name: SITE.name, path: "/" },
    ...(primaryCategory
      ? [{ name: termName("category", primaryCategory), path: `/category/${primaryCategory}` }]
      : []),
    { name: post.title, path: `/${post.author}/${post.slug}` },
  ];

  return (
    <article className="mx-auto max-w-article px-4 py-10">
      <JsonLd data={articleLd(post)} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      {authorRec && <JsonLd data={personLd(authorRec)} />}

      {/* The exact same renderer the editor previews (components/ArticleView) —
          Phase 4 bookmark island + owner-only edit/delete controls injected as the
          live-only footer actions (both stay empty markup for non-owners so the
          page stays static). */}
      <ArticleView
        post={post}
        actions={
          <div className="flex flex-col items-end gap-3">
            <AuthorPostControls postId={post.id} editHref={`/editor?id=${post.id}`} />
            <BookmarkButton postId={post.id} postPath={`/${post.author}/${post.slug}`} />
          </div>
        }
      />

      {/* Phase 3: server-rendered thread (indexed text) + compose island. */}
      <CommentsSection post={post} />
    </article>
  );
}
