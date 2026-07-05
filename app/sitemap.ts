import type { MetadataRoute } from "next";
import {
  getAllPosts,
  getAllCategories,
  getAllTags,
  getAllAuthors,
  postHref,
} from "@/lib/content/repo";
import { absUrl } from "@/lib/site";

// XML sitemap (REBUILD §3C: "XML sitemaps regenerated with identical/expanded
// coverage"). Covers every indexed URL class — home, articles, categories, tags,
// author archives — so GSC submission at cutover matches or expands old coverage.
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const lastHome = posts[0]?.updated ?? posts[0]?.date;

  return [
    { url: absUrl("/"), lastModified: lastHome, changeFrequency: "daily", priority: 1 },
    ...posts.map((p) => ({
      url: absUrl(postHref(p)),
      lastModified: p.updated ?? p.date,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...getAllCategories().map((t) => ({
      url: absUrl(`/category/${t.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...getAllTags().map((t) => ({
      url: absUrl(`/tag/${t.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
    ...getAllAuthors().map((a) => ({
      url: absUrl(`/author/${a.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
