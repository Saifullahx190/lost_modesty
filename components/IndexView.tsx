import type { ReactNode } from "react";
import type { Post, SearchRecord } from "@/lib/content/types";
import { PostGrid } from "./PostGrid";
import { Pagination } from "./Pagination";
import { SearchInput } from "./SearchInput";
import { MarigoldMark } from "./Logo";
import { T } from "./T";

// Shared index/archive view (FRONTEND §3.1): search-first header, card grid, then
// pagination. Reused by the home index, category, tag, and author-archive pages so
// the "find the next thing to read" job (§0) is one consistent surface. `showSearch`
// is on for the home index; archive pages lead with their term heading instead.
export function IndexView({
  title,
  intro,
  posts,
  basePath,
  page,
  totalPages,
  searchIndex,
  showSearch = false,
}: {
  title: ReactNode;
  intro?: ReactNode;
  posts: Post[];
  basePath: string;
  page: number;
  totalPages: number;
  searchIndex?: SearchRecord[];
  showSearch?: boolean;
}) {
  return (
    <div className="mx-auto max-w-index px-4 py-10">
      <div className="mb-10 flex flex-col gap-4">
        <h1 className="font-display text-display text-text">{title}</h1>
        {intro && <p className="max-w-article text-body text-muted">{intro}</p>}
        {showSearch && searchIndex && <SearchInput index={searchIndex} />}
      </div>

      {posts.length > 0 ? (
        <>
          <PostGrid posts={posts} />
          <Pagination basePath={basePath} page={page} totalPages={totalPages} />
        </>
      ) : (
        <Empty />
      )}
    </div>
  );
}

// Empty archive state — never a blank area (§3.4); marigold motif keeps it on-brand.
function Empty() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <MarigoldMark className="h-10 w-10 text-accent" />
      <p className="text-body text-muted">
        <T bn="এখানে এখনো কোনো লেখা নেই।" en="Nothing here yet." />
      </p>
    </div>
  );
}
