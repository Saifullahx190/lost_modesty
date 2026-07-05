import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndexView } from "@/components/IndexView";
import { JsonLd } from "@/components/JsonLd";
import {
  getAllTags,
  getTag,
  getPostsByTag,
  paginate,
  parsePage,
} from "@/lib/content/repo";
import { termMetadata, breadcrumbLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Tag index (REBUILD §4 Phase 1 #2 / FRONTEND §3.1 #3). Preserves `/tag/{slug}` +
// `?page=N` exactly (REBUILD §1#2). SSG over every tag.

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ page?: string | string[] }>;

export function generateStaticParams() {
  return getAllTags().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const term = getTag((await params).slug);
  if (!term) return {};
  return termMetadata("tag", term, parsePage((await searchParams).page));
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const term = getTag(slug);
  if (!term) notFound();

  const page = parsePage((await searchParams).page);
  const { items, page: current, totalPages } = paginate(getPostsByTag(slug), page);
  const basePath = `/tag/${slug}`;

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: SITE.name, path: "/" },
          { name: term.name, path: basePath },
        ])}
      />
      <IndexView
        title={term.name}
        intro={term.description}
        posts={items}
        basePath={basePath}
        page={current}
        totalPages={totalPages}
      />
    </>
  );
}
