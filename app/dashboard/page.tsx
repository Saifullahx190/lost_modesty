import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getPostById, getPostsByAuthor, postHref } from "@/lib/content/repo";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { MarigoldMark } from "@/components/Logo";
import { SavedGrid } from "@/components/dashboard/SavedGrid";
import { AuthoredPostList, type AuthoredPostRow } from "@/components/dashboard/AuthoredPostList";
import { bookmarksForUser } from "@/lib/bookmarks/store.mjs";
import type { Post } from "@/lib/content/types";

// User dashboard (REBUILD §4 Phase 4 #5 / FRONTEND §3.1 #7). The logged-in landing
// surface — the "what greets me when I log in" layout the rebuild plan says to
// preserve. SSR + noindex (REBUILD §1#5: dashboard is noindex, zero SEO risk); the
// entry URL /dashboard is fixed and linked from the header UserMenu.
//
// Staged behind the strangler-fig with the rest of the auth/logged-in surfaces:
// the route stays at canaryPercent 0 (→ OLD) until its checkpoint passes.

export const metadata: Metadata = pageMetadata({
  title: "ড্যাশবোর্ড",
  description: "আপনার লস্টমডেস্টি অ্যাকাউন্ট।",
  path: "/dashboard",
  noindex: true,
});

export default async function DashboardPage() {
  // Reading the real HttpOnly session makes this route dynamic (SSR) — correct
  // for a logged-in surface, never done on the SSG read path (lib/auth/session.ts).
  const user = await getSessionUser();
  // Logged-out → /login with a return path so they land back here after auth
  // (FRONTEND §3.4: never a dead click / bare disabled state).
  if (!user) redirect("/login?next=/dashboard");

  // Bookmarks reference the CANONICAL post id, so we resolve id → post via the
  // same repo the read path uses. Any bookmark that can't resolve is dropped
  // rather than rendered as a broken row (REBUILD §4 Checkpoint 4: "every
  // existing bookmark resolves to its live article").
  const saved: Post[] = bookmarksForUser(user.id)
    .map((b) => getPostById(b.postId))
    .filter((p): p is Post => p !== undefined);

  // Authors manage their own published posts here (edit/delete). SSR + author-
  // gated, so the rows are only built for an author and carry no other user's data.
  const authored: AuthoredPostRow[] =
    user.role === "author"
      ? getPostsByAuthor(user.authorSlug ?? user.id).map((p) => ({
          id: p.id,
          title: p.title,
          href: postHref(p),
          editHref: `/editor?id=${p.id}`,
          dateLabel: formatDate(p.date),
        }))
      : [];

  return (
    <div className="mx-auto max-w-index px-4 py-10">
      <header className="mb-10 flex flex-col gap-2">
        <p className="text-meta text-muted">
          {user.role === "author" ? "লেখক" : "পাঠক"} · যোগ দিয়েছেন{" "}
          {formatDate(user.createdAt)}
        </p>
        <h1 className="font-display text-display text-text">স্বাগতম, {user.name}</h1>
      </header>

      {/* Quick links — only to routes that actually exist. Authors additionally get
          the writing panel (Phase 5) and a link to their public archive. */}
      <nav aria-label="দ্রুত লিঙ্ক" className="mb-12 flex flex-wrap gap-3">
        <DashLink href="/">সব লেখা পড়ুন</DashLink>
        {user.role === "author" && (
          <>
            <DashLink href="/editor">নতুন লেখা</DashLink>
            <DashLink href="/dashboard/analytics">ট্রাফিক বিশ্লেষণ</DashLink>
            {user.authorSlug && (
              <DashLink href={`/author/${user.authorSlug}`}>আপনার লেখাগুলো</DashLink>
            )}
          </>
        )}
        <DashLink href="/notifications">বিজ্ঞপ্তি</DashLink>
        <DashLink href="/activity">কার্যকলাপ</DashLink>
        <DashLink href="/settings">সেটিংস</DashLink>
        {/* Logout mutates auth state, so it must POST — the /logout route is
            POST-only (a GET logout is a CSRF/prefetch footgun). A plain form
            button keeps it working with zero JS. */}
        <form action="/logout" method="post" className="contents">
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 text-meta text-muted transition-colors hover:bg-bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
          >
            বেরিয়ে যান
          </button>
        </form>
      </nav>

      {user.role === "author" && (
        <section aria-labelledby="authored-heading" className="mb-12">
          <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-border pb-3">
            <h2 id="authored-heading" className="font-display text-h2 text-text">
              আপনার প্রকাশিত লেখা
            </h2>
            {authored.length > 0 && (
              <span className="text-meta text-muted">{authored.length}টি</span>
            )}
          </div>
          <AuthoredPostList posts={authored} />
        </section>
      )}

      <section aria-labelledby="saved-heading">
        <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-border pb-3">
          <h2 id="saved-heading" className="font-display text-h2 text-text">
            সংরক্ষিত লেখা
          </h2>
          {saved.length > 0 && (
            <span className="text-meta text-muted">{saved.length}টি</span>
          )}
        </div>

        {saved.length > 0 ? (
          <SavedGrid posts={saved} />
        ) : (
          <EmptySaved />
        )}
      </section>
    </div>
  );
}

function DashLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-border px-4 py-2 text-meta text-link transition-colors hover:bg-bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
    >
      {children}
    </Link>
  );
}

// Empty saved state — never a blank area (FRONTEND §3.4); marigold motif keeps it
// on-brand and points the reader back to browsing instead of a dead end.
function EmptySaved() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <MarigoldMark className="h-10 w-10 text-accent" />
      <p className="text-body text-muted">
        এখনো কিছু সংরক্ষণ করেননি। কোনো লেখা পড়ার সময় বুকমার্ক করলে সেটি এখানে জমা থাকবে।
      </p>
      <Link
        href="/"
        className="text-meta text-link hover:underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
      >
        লেখা খুঁজে দেখুন →
      </Link>
    </div>
  );
}
