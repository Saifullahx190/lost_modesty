import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { activityForUser } from "@/lib/activity/feed";
import { pageMetadata } from "@/lib/seo";
import { MarigoldMark } from "@/components/Logo";
import { ActivityList } from "@/components/activity/ActivityList";

// Activity history (REBUILD §4 Phase 6 #11 / §1 defer-list "minimal recent-activity
// list"). SSR + noindex, logged-in-only. Derived from the existing comment/bookmark/
// content stores — no new event table. Staged behind the strangler-fig: the
// `activity` route class stays at canaryPercent 0 (→ OLD) until its Phase-6 checkpoint.
export const metadata: Metadata = pageMetadata({
  title: "কার্যকলাপ",
  description: "আপনার সাম্প্রতিক কার্যকলাপ।",
  path: "/activity",
  noindex: true,
});

export default async function ActivityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/activity");

  const items = activityForUser(user);

  return (
    <div className="mx-auto max-w-article px-4 py-10">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-meta text-muted">অ্যাকাউন্ট</p>
        <h1 className="font-display text-display text-text">কার্যকলাপ</h1>
      </header>

      {items.length > 0 ? (
        <ActivityList items={items} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MarigoldMark className="h-10 w-10 text-accent" />
          <p className="text-body text-muted">
            এখনো কোনো কার্যকলাপ নেই। লেখা পড়ুন, মন্তব্য করুন বা সংরক্ষণ করুন — এখানে জমা হতে থাকবে।
          </p>
          <Link
            href="/"
            className="text-meta text-link hover:underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
          >
            লেখা খুঁজে দেখুন →
          </Link>
        </div>
      )}
    </div>
  );
}
