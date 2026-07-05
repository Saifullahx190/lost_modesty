import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndexView } from "@/components/IndexView";
import { JsonLd } from "@/components/JsonLd";
import {
  getAllCategories,
  getCategory,
  getPostsByCategory,
  paginate,
  parsePage,
} from "@/lib/content/repo";
import { termMetadata, breadcrumbLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Category index (REBUILD §4 Phase 1 #2 / FRONTEND §3.1 #3). Indexed landing page +
// internal-link hub; preserves `/category/{slug}` and the `?page=N` scheme exactly
// (REBUILD §1#2). SSG over every category.

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ page?: string | string[] }>;

export function generateStaticParams() {
  return getAllCategories().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const term = getCategory((await params).slug);
  if (!term) return {};
  return termMetadata("category", term, parsePage((await searchParams).page));
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const term = getCategory(slug);
  if (!term) notFound();

  const page = parsePage((await searchParams).page);
  const { items, page: current, totalPages } = paginate(getPostsByCategory(slug), page);
  const basePath = `/category/${slug}`;

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
