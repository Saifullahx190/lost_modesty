import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { notificationsForUser } from "@/lib/notifications/feed";
import { pageMetadata } from "@/lib/seo";
import { MarigoldMark } from "@/components/Logo";
import { NotificationList } from "@/components/notifications/NotificationList";
import { MarkSeen } from "@/components/notifications/MarkSeen";

// In-app notifications (REBUILD §4 Phase 6 #8 / §1 defer-list "minimal unread
// count + list"). SSR + noindex, logged-in-only. Derived from the comment store —
// no new event table. Staged behind the strangler-fig: the `notifications` route
// class stays at canaryPercent 0 (→ OLD) until its Phase-6 checkpoint.
export const metadata: Metadata = pageMetadata({
  title: "বিজ্ঞপ্তি",
  description: "আপনার বিজ্ঞপ্তিসমূহ।",
  path: "/notifications",
  noindex: true,
});

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/notifications");

  // Computed with unread flags BEFORE MarkSeen fires, so "new" markers show on
  // this view and clear from the next one (and the header bell).
  const items = notificationsForUser(user);

  return (
    <div className="mx-auto max-w-article px-4 py-10">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-meta text-muted">অ্যাকাউন্ট</p>
        <h1 className="font-display text-display text-text">বিজ্ঞপ্তি</h1>
      </header>

      {items.length > 0 ? (
        <>
          <NotificationList items={items} />
          <MarkSeen />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MarigoldMark className="h-10 w-10 text-accent" />
          <p className="text-body text-muted">
            এখনো কোনো বিজ্ঞপ্তি নেই। কেউ আপনার মন্তব্যে উত্তর দিলে বা আপনার লেখায় মন্তব্য করলে এখানে দেখতে পাবেন।
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
