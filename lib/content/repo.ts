import type {
  Author,
  Paginated,
  Post,
  SearchRecord,
  Series,
  SeriesMembership,
  Term,
} from "./types";
import { AUTHORS, CATEGORIES, POSTS, SERIES, TAGS } from "./posts";

// Write surface for the Phase 5 editor (publish/edit/delete). Re-exported here so
// callers have one content module to import, read or write (repo is the
// query/command layer).
export { addPost, updatePost, deletePost, nextPostId } from "./posts";

// Query layer over the content source. Pure + synchronous because the source is
// a build-time SSG dataset (REBUILD §2: articles/categories render SSG/ISR).
// When the read-replica/content API lands (FRONTEND §6.2), these signatures stay
// the same and the bodies become awaited fetches — callers don't change.

/** Default posts-per-page. FRONTEND §3.3 estimates ~12 posts/page × 25 pages. */
export const PER_PAGE = 12;

const byDateDesc = (a: Post, b: Post) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

/** Canonical article path (REBUILD §3A / FRONTEND §3.1: /{author}/{slug}). The
 *  single place this pattern is constructed — keep route + sitemap + feed in sync. */
export function postHref(post: Pick<Post, "author" | "slug">): string {
  return `/${post.author}/${post.slug}`;
}

export function getAllPosts(): Post[] {
  return [...POSTS].sort(byDateDesc);
}

export function getPost(author: string, slug: string): Post | undefined {
  return POSTS.find((p) => p.author === author && p.slug === slug);
}

export function getPostById(id: string): Post | undefined {
  return POSTS.find((p) => p.id === id);
}

export function getAuthor(slug: string): Author | undefined {
  return AUTHORS.find((a) => a.slug === slug);
}

export function getCategory(slug: string): Term | undefined {
  return CATEGORIES.find((t) => t.slug === slug);
}

export function getTag(slug: string): Term | undefined {
  return TAGS.find((t) => t.slug === slug);
}

export function getSeries(slug: string): Series | undefined {
  return SERIES.find((s) => s.slug === slug);
}

export function getAllAuthors(): Author[] {
  return [...AUTHORS];
}
export function getAllCategories(): Term[] {
  return [...CATEGORIES];
}
export function getAllTags(): Term[] {
  return [...TAGS];
}

export function getPostsByAuthor(slug: string): Post[] {
  return getAllPosts().filter((p) => p.author === slug);
}
export function getPostsByCategory(slug: string): Post[] {
  return getAllPosts().filter((p) => p.categories.includes(slug));
}
export function getPostsByTag(slug: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(slug));
}

/** Name lookups for rendering term/series labels without leaking slugs to the UI. */
export function termName(kind: "category" | "tag", slug: string): string {
  const t = kind === "category" ? getCategory(slug) : getTag(slug);
  return t?.name ?? slug;
}

/** Sibling parts of a series, ordered, for the article series-nav strip
 *  (FRONTEND §3.2 Journey C / §2.4 series nav). */
export interface SeriesContext {
  series: Series;
  parts: Post[];
  current: number; // index in `parts`
  prev?: Post;
  next?: Post;
}
export function getSeriesContext(post: Post): SeriesContext | undefined {
  const m: SeriesMembership | undefined = post.series;
  if (!m) return undefined;
  const series = getSeries(m.series);
  if (!series) return undefined;
  const parts = POSTS.filter((p) => p.series?.series === m.series).sort(
    (a, b) => (a.series!.part - b.series!.part),
  );
  const current = parts.findIndex((p) => p.id === post.id);
  return {
    series,
    parts,
    current,
    prev: current > 0 ? parts[current - 1] : undefined,
    next: current < parts.length - 1 ? parts[current + 1] : undefined,
  };
}

/** 1-based pagination. Preserves the `?page=N` scheme the rebuild plan requires
 *  the new app to keep exactly (REBUILD §1#2 / FRONTEND §3.3 pagination). */
export function paginate<T>(items: T[], page: number, perPage = PER_PAGE): Paginated<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const clamped = Math.min(Math.max(1, page), totalPages);
  const start = (clamped - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page: clamped,
    perPage,
    totalItems,
    totalPages,
  };
}

/** Coerce a raw ?page query value to a valid 1-based page number. */
export function parsePage(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Lightweight client-search index (FRONTEND §3.3). ~300 posts is small enough
 *  to inline at build time; this is the data the SearchInput filters in-browser. */
export function buildSearchIndex(): SearchRecord[] {
  return getAllPosts().map((p) => ({
    title: p.title,
    href: postHref(p),
    excerpt: p.excerpt,
    date: p.date,
    tags: p.tags.map((t) => termName("tag", t)),
  }));
}
