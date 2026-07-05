import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndexView } from "@/components/IndexView";
import { JsonLd } from "@/components/JsonLd";
import {
  getAllAuthors,
  getAuthor,
  getPostsByAuthor,
  paginate,
  parsePage,
} from "@/lib/content/repo";
import { pageMetadata, personLd, breadcrumbLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Author archive (REBUILD §1#1 "author archive pages are also indexed" / FRONTEND
// §3.1 #4). Public author profile = the indexed surface handled here (the editable
// private profile is deferred, REBUILD §1#10). Preserves `/author/{name}` + `?page=N`.

type Params = Promise<{ name: string }>;
type SearchParams = Promise<{ page?: string | string[] }>;

export function generateStaticParams() {
  return getAllAuthors().map((a) => ({ name: a.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const author = getAuthor((await params).name);
  if (!author) return {};
  const page = parsePage((await searchParams).page);
  return pageMetadata({
    title: page > 1 ? `${author.name} — পৃষ্ঠা ${page}` : author.name,
    description: author.bio,
    path: `/author/${author.slug}${page > 1 ? `?page=${page}` : ""}`,
  });
}

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { name } = await params;
  const author = getAuthor(name);
  if (!author) notFound();

  const page = parsePage((await searchParams).page);
  const { items, page: current, totalPages } = paginate(getPostsByAuthor(author.slug), page);
  const basePath = `/author/${author.slug}`;

  return (
    <>
      <JsonLd data={personLd(author)} />
      <JsonLd
        data={breadcrumbLd([
          { name: SITE.name, path: "/" },
          { name: author.name, path: basePath },
        ])}
      />
      <IndexView
        title={author.name}
        intro={author.bio}
        posts={items}
        basePath={basePath}
        page={current}
        totalPages={totalPages}
      />
    </>
  );
}
