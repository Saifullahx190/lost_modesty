import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import {
  getAllCategories,
  getAllTags,
  getPostsByCategory,
  getPostsByTag,
} from "@/lib/content/repo";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Topics index — "তালিকাসমূহ" nav destination (FRONTEND §3.1 internal-link hubs).
// Layout mirrors the live site's "সব বিষয়" page (a wrapping grid of counted
// subject chips), but the chip is rebuilt on the design system: token borders,
// refined tap targets, and the terracotta label color (color-accent-secondary,
// the contrast-verified label token) rather than the old heavy orange pill.
// Each chip links to that term's existing archive (/category/… or /tag/…).

const TITLE = "সব বিষয়";
const INTRO = "যে বিষয়গুলো নিয়ে আমরা লিখি — যেখান থেকে খুশি পড়া শুরু করো।";

export function generateMetadata(): Metadata {
  return pageMetadata({ title: `${TITLE} — ${SITE.name}`, description: INTRO, path: "/topics" });
}

interface Topic {
  href: string;
  name: string;
  count: number;
}

// Categories first, then tags — both are reader-facing "subjects". Empty terms are
// dropped so a chip never links to an archive with nothing behind it.
function getTopics(): Topic[] {
  const categories = getAllCategories().map((t) => ({
    href: `/category/${t.slug}`,
    name: t.name,
    count: getPostsByCategory(t.slug).length,
  }));
  const tags = getAllTags().map((t) => ({
    href: `/tag/${t.slug}`,
    name: t.name,
    count: getPostsByTag(t.slug).length,
  }));
  return [...categories, ...tags]
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
}

export default function TopicsPage() {
  const topics = getTopics();

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: SITE.name, path: "/" },
          { name: TITLE, path: "/topics" },
        ])}
      />
      <div className="mx-auto max-w-index px-4 py-10">
        <div className="mb-10 flex flex-col gap-4">
          <h1 className="font-display text-display text-text">{TITLE}</h1>
          <p className="max-w-article text-body text-muted">{INTRO}</p>
        </div>

        <ul className="flex flex-wrap gap-3">
          {topics.map((topic) => (
            <li key={topic.href}>
              <Link
                href={topic.href}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-meta text-text transition-colors hover:border-accent-secondary hover:bg-bg-subtle"
              >
                <span>{topic.name}</span>
                <span aria-hidden="true" className="text-muted">
                  {topic.count}
                </span>
                <span className="sr-only">({topic.count}টি লেখা)</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
