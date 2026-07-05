import type { Metadata } from "next";
import { IndexView } from "@/components/IndexView";
import { JsonLd } from "@/components/JsonLd";
import { getAllPosts, paginate, parsePage, buildSearchIndex } from "@/lib/content/repo";
import { pageMetadata, websiteLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Home / All-Posts index (REBUILD §4 Phase 1 #1 / FRONTEND §3.1 #1). SSG: the
// content source is build-time data. `/` and `/blog` both resolve here (the
// edge router's `index` route class covers both) — see app/blog/page.tsx.
//
// NOTE: building this route does NOT expose it to readers. The edge router keeps
// the `index` class at canaryPercent 0 (→ OLD) until Checkpoint 1 passes; this is
// the NEW implementation staged behind the strangler-fig, per CP0/CP1.

const HOME_TITLE = "সব লেখা";

type SearchParams = Promise<{ page?: string | string[] }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  return pageMetadata({
    title: page > 1 ? `${HOME_TITLE} — পৃষ্ঠা ${page}` : SITE.name,
    description: SITE.tagline,
    path: page > 1 ? `/?page=${page}` : "/",
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = parsePage((await searchParams).page);
  const { items, page: current, totalPages } = paginate(getAllPosts(), page);

  return (
    <>
      <JsonLd data={websiteLd()} />
      <IndexView
        title={HOME_TITLE}
        intro={SITE.tagline}
        posts={items}
        basePath="/"
        page={current}
        totalPages={totalPages}
        searchIndex={buildSearchIndex()}
        showSearch
      />
    </>
  );
}
