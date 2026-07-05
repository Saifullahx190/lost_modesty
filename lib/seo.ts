import type { Metadata } from "next";
import type { Author, Post, Term } from "./content/types";
import { getAuthor, postHref } from "./content/repo";
import { SITE, SITE_URL, absUrl } from "./site";

// ───────────────────────────────────────────────────────────────────────────
// SEO signal builders (REBUILD §3C). Every page type produces a canonical,
// <title>, meta description, OpenGraph/Twitter, robots, and (where applicable)
// structured data — the exact signals the rebuild plan requires reproduced and
// diffed against live before any canary (REBUILD §4 Phase 1 / Verification §2).
//
// One builder per page type so the shadow-diff has a single, auditable source
// for each <head>. JSON-LD objects are returned as plain objects and embedded by
// the page via <script type="application/ld+json">.
// ───────────────────────────────────────────────────────────────────────────

const DEFAULT_OG_IMAGE = "/covers/og-default.svg";

/** metadataBase lets Next resolve relative canonical/OG URLs to absolute against
 *  the canonical origin (REBUILD §3C). Set once on the root metadata. */
export const metadataBase = new URL(SITE_URL);

interface PageSeoInput {
  title: string;
  description: string;
  /** Root-relative canonical path (no host). */
  path: string;
  /** Login/dashboard/editor etc. are noindex (REBUILD §1#3 / §4 Phase 2). */
  noindex?: boolean;
  type?: "website" | "article";
}

/** Shared Metadata factory — the one place canonical + OG + Twitter are wired so
 *  no page type can silently drop a signal. NOTE: og:image / twitter:image are NOT
 *  set here — they are owned by the opengraph-image file convention (app/
 *  opengraph-image.tsx cascades to all routes; the article route overrides). Setting
 *  them here too would emit duplicate, conflicting og:image tags. */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
  type = "website",
}: PageSeoInput): Metadata {
  const url = absUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type,
      url,
      siteName: SITE.name,
      title,
      description,
      locale: SITE.locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** Article page metadata — adds article:published_time/author (REBUILD §1#1
 *  OpenGraph + author attribution preserved exactly). */
export function articleMetadata(post: Post): Metadata {
  const author = getAuthor(post.author);
  const base = pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: postHref(post),
    type: "article",
  });
  return {
    ...base,
    authors: author ? [{ name: author.name }] : undefined,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: author ? [author.name] : undefined,
      tags: post.tags,
    },
  };
}

// ── JSON-LD (REBUILD §3C: Article/NewsArticle/BreadcrumbList/Person) ──────────

export interface JsonLd {
  "@context": "https://schema.org";
  [k: string]: unknown;
}

export function personLd(author: Author): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    description: author.bio,
    url: absUrl(`/author/${author.slug}`),
  };
}

export function articleLd(post: Post): JsonLd {
  const author = getAuthor(post.author);
  return {
    "@context": "https://schema.org",
    // NewsArticle matches the rebuild plan's stated schema for article pages
    // (REBUILD §1#1 "Article/NewsArticle schema").
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": absUrl(postHref(post)) },
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    image: post.cover ? [absUrl(post.cover.src)] : [absUrl(DEFAULT_OG_IMAGE)],
    author: author
      ? { "@type": "Person", name: author.name, url: absUrl(`/author/${author.slug}`) }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: absUrl("/covers/og-default.svg") },
    },
    inLanguage: SITE.lang,
    keywords: post.tags.join(", "),
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbLd(crumbs: Crumb[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absUrl(c.path),
    })),
  };
}

export function websiteLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    alternateName: SITE.nameLatin,
    url: SITE_URL,
    inLanguage: SITE.lang,
  };
}

/** Term (category/tag) page metadata. */
export function termMetadata(
  kind: "category" | "tag",
  term: Term,
  page: number,
): Metadata {
  const path = `/${kind}/${term.slug}${page > 1 ? `?page=${page}` : ""}`;
  const suffix = page > 1 ? ` — পৃষ্ঠা ${page}` : "";
  return pageMetadata({
    title: `${term.name}${suffix}`,
    description: term.description ?? `${term.name} বিষয়ের সব লেখা।`,
    path,
  });
}

/** Serialize a JSON-LD object for embedding; `<` escaped to prevent breaking out
 *  of the <script> context. */
export function ldJson(obj: JsonLd): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
