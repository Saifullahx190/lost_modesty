import Link from "next/link";
import { MarigoldMark } from "@/components/Logo";
import { SearchInput } from "@/components/SearchInput";
import { buildSearchIndex } from "@/lib/content/repo";
import { NAV } from "@/lib/site";

// Branded 404 (FRONTEND §3.4): per the rebuild plan a hard 404 should be rare
// (redirect-to-nearest preferred); when it happens, the search box is front-and-
// centre with category links — never a dead end. noindex so a stray 404 URL can't
// be indexed as a soft-404 (REBUILD §3B 404 policy).
export const metadata = {
  title: "পাওয়া যায়নি",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-article flex-col items-center gap-6 px-4 py-20 text-center">
      <MarigoldMark className="h-12 w-12 text-accent" />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display text-text">পাতাটি খুঁজে পাওয়া গেল না</h1>
        <p className="text-body text-muted">
          লেখাটি হয়তো সরে গেছে বা ঠিকানাটি বদলে গেছে। নিচে খুঁজে দেখুন বা বিষয় ধরে ঘুরে আসুন।
        </p>
      </div>

      <div className="w-full">
        <SearchInput index={buildSearchIndex()} />
      </div>

      <nav aria-label="বিষয়" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="text-meta text-link hover:underline">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
