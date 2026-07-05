import Link from "next/link";
import { getAuthor } from "@/lib/content/repo";
import { formatDate, isoDate } from "@/lib/format";

// Meta row: author link + machine-readable date (FRONTEND §2.4 article header /
// post card meta). Author name links to the indexed author archive (REBUILD §1#1).
export function Byline({
  authorSlug,
  date,
  className = "",
}: {
  authorSlug: string;
  date: string;
  className?: string;
}) {
  const author = getAuthor(authorSlug);
  return (
    <div className={`flex flex-wrap items-center gap-x-2 text-meta text-muted ${className}`.trim()}>
      {author && (
        <>
          <Link href={`/author/${author.slug}`} className="text-link hover:underline">
            {author.name}
          </Link>
          <span aria-hidden="true">·</span>
        </>
      )}
      <time dateTime={isoDate(date)}>{formatDate(date)}</time>
    </div>
  );
}
