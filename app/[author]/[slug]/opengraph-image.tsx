import { renderOgImage, ogSize, ogContentType } from "@/lib/og";
import { getAllPosts, getPost, getAuthor } from "@/lib/content/repo";
import { SITE } from "@/lib/site";

// Per-article OG card (title + author kicker). Prerendered as a static PNG for each
// post (same param set as the page) → og:image/twitter:image are auto-injected with
// correct dimensions. No runtime work, no CP0 impact.
export const size = ogSize;
export const contentType = ogContentType;
export const alt = SITE.name;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ author: p.author, slug: p.slug }));
}

export default async function ArticleOgImage({
  params,
}: {
  params: Promise<{ author: string; slug: string }>;
}) {
  const { author, slug } = await params;
  const post = getPost(author, slug);
  if (!post) return renderOgImage({ title: SITE.name, kicker: SITE.tagline });
  const name = getAuthor(post.author)?.name;
  return renderOgImage({ title: post.title, kicker: name });
}
