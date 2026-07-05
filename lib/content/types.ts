// Content model for the Phase 1 read path.
//
// Article body is a STRUCTURED block document, not a pre-rendered HTML blob
// (FRONTEND §6.2: "markdown/MDX or a structured JSON document model … not a
// pre-rendered HTML blob the frontend can't safely restructure"). This lets
// headings render as real <h2>/<h3> and footnotes as an accessible disclosure
// (FRONTEND §1.3 semantic structure), which is also what the rebuild plan's
// structured-data fidelity depends on (REBUILD §1#1).
//
// In production this shape is what the read-replica / content API (REBUILD §2)
// must supply; here it is satisfied by the local sample repo (lib/content/posts).

export interface Author {
  /** Stable slug — the {author} segment of /{author}/{slug} (REBUILD §3A). */
  slug: string;
  name: string;
  bio: string;
  /** Optional avatar; omitted samples exercise the no-avatar fallback. */
  avatar?: ImageRef;
}

export interface Term {
  /** Stable slug — the {slug} of /category/{slug} or /tag/{slug}. */
  slug: string;
  name: string;
  /** Short description for the term index page <meta> + on-page intro. */
  description?: string;
}

export interface Series {
  slug: string;
  name: string;
}

/** Image with intrinsic dimensions — required server-side for CLS-safe
 *  next/image sizing without a client fetch (FRONTEND §6.2 / §1.3 CLS). */
export interface ImageRef {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; id: string; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; image: ImageRef; caption?: string };

export interface Footnote {
  /** 1-based marker number; in-text reference is written as `[^n]` in paragraph
   *  text and rendered to a #fn-{n} anchor (FRONTEND §2.4 footnote/citation). */
  n: number;
  /** Anchor id target, e.g. "fn-1"; backlink targets "fnref-1". */
  id: string;
  text: string;
}

export interface SeriesMembership {
  series: string; // Series.slug
  /** 1-based part index within the series. */
  part: number;
  /** Bengali part label as shown to readers, e.g. "পর্ব ২" / "শেষ পর্ব". */
  partLabel: string;
}

export interface Post {
  /** Stable post id — the immutable key bookmarks/comments/redirects reference
   *  (REBUILD §3A "decide the immutable key"). NOT derived from the slug. */
  id: string;
  /** {slug} segment; mutable title-derived slug, but historically stable. */
  slug: string;
  /** Author slug — {author} segment. */
  author: string;
  title: string;
  excerpt: string;
  /** ISO 8601 publish date (datePublished). */
  date: string;
  /** ISO 8601 last-modified (dateModified) — falls back to date when absent. */
  updated?: string;
  categories: string[]; // Term.slug[]
  tags: string[]; // Term.slug[]
  series?: SeriesMembership;
  cover?: ImageRef;
  body: Block[];
  footnotes?: Footnote[];
}

/** Lightweight record shipped to the client for instant search (FRONTEND §3.3:
 *  client-side index of title/date/tags). Body is intentionally excluded to keep
 *  the payload small on a reading-first page. */
export interface SearchRecord {
  title: string;
  href: string;
  excerpt: string;
  date: string;
  tags: string[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}
