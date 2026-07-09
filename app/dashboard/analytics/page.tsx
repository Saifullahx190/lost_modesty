import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getAllPosts, postHref } from "@/lib/content/repo";
import { pageMetadata } from "@/lib/seo";
import { T } from "@/components/T";
import {
  PERSIST,
  dbViewsByDay,
  dbViewTotals,
  dbTopPaths,
  dbNewVsReturning,
  dbTopReferrers,
  dbCommunityStats,
} from "@/lib/db/index.mjs";
import { dhakaDay } from "@/lib/analytics/track.mjs";
import {
  StatTile,
  TrendChart,
  BarList,
  NewReturning,
} from "@/components/dashboard/analytics/Charts";

// Admin analytics (author-only). First-party traffic dashboard built on the
// pageviews table (lib/db) — total views, unique/returning readers, top
// articles, referrers, community totals. SSR + noindex, same gating idiom as
// the user dashboard: logged-out → /login, non-author → /dashboard.

export const metadata: Metadata = pageMetadata({
  title: "ট্রাফিক বিশ্লেষণ",
  description: "লস্ট মডেস্টির পাঠক ও ট্রাফিক পরিসংখ্যান।",
  path: "/dashboard/analytics",
  noindex: true,
});

const WINDOWS = [7, 30, 90] as const;
const DEFAULT_DAYS = 30;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/analytics");
  // Traffic data is the site owner's surface — readers get their own /dashboard.
  if (user.role !== "author") redirect("/dashboard");

  const { days: rawDays } = await searchParams;
  const parsed = Number.parseInt(rawDays ?? "", 10);
  const days = (WINDOWS as readonly number[]).includes(parsed) ? parsed : DEFAULT_DAYS;

  // Persistence off → nothing is being recorded. Say so plainly instead of
  // rendering a wall of zeros that looks like broken data.
  if (!PERSIST) return <TrackingOff />;

  const since = dhakaDay(new Date(Date.now() - (days - 1) * 86_400_000));

  const totals = dbViewTotals(since);
  const byDay = fillDays(since, dbViewsByDay(since));
  const cohort = dbNewVsReturning(since);
  const referrers = dbTopReferrers(since, 8);
  const community = dbCommunityStats();

  // Resolve top PATHS to human labels: article paths → title, known chrome
  // pages → a friendly name, anything else → the path itself.
  const titleByHref = new Map(getAllPosts().map((p) => [postHref(p), p.title]));
  const topRows = dbTopPaths(since, 10).map((r: { path: string; views: number; visitors: number }) => ({
    label: labelForPath(r.path, titleByHref),
    href: r.path,
    value: r.views,
    sub: `${r.visitors} পাঠক`,
  }));

  return (
    <div className="mx-auto max-w-index px-4 py-10">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-meta text-muted">
          <Link href="/dashboard" className="hover:underline underline-offset-2">
            <T bn="ড্যাশবোর্ড" en="Dashboard" />
          </Link>{" "}
          / <T bn="ট্রাফিক" en="Traffic" />
        </p>
        <h1 className="font-display text-display text-text">
          <T bn="ট্রাফিক বিশ্লেষণ" en="Traffic analytics" />
        </h1>
        <p className="text-meta text-muted">
          <T
            bn="সাইটে কেমন পাঠক আসছেন, কী পড়ছেন — সবই এখানে। ডেটা এই সাইটেই জমা থাকে, কোনো বাইরের সেবায় যায় না।"
            en="Who visits and what they read — all first-party, stored on this site, no external service."
          />
        </p>
      </header>

      <WindowTabs days={days} />

      {/* Headline tiles */}
      <section className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile value={totals.views} bn="মোট পেজভিউ" en="Pageviews" hint={rangeHint(days)} />
        <StatTile value={totals.visitors} bn="ইউনিক পাঠক" en="Unique readers" hint={rangeHint(days)} />
        <StatTile
          value={cohort.returning}
          bn="নিয়মিত পাঠক"
          en="Regular readers"
          hint={{ bn: "≥২ দিন এসেছেন", en: "visited ≥2 days" }}
        />
        <StatTile
          value={avgPerDay(totals.views, byDay.length)}
          bn="দৈনিক গড় ভিউ"
          en="Avg views/day"
          hint={rangeHint(days)}
        />
      </section>

      {/* Trend */}
      <Panel titleBn="প্রতিদিনের ট্রাফিক" titleEn="Daily traffic">
        <TrendChart data={byDay} />
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel titleBn="সবচেয়ে বেশি পড়া" titleEn="Most read">
          <BarList
            rows={topRows}
            emptyBn="এখনো কোনো লেখা পড়া হয়নি।"
            emptyEn="No articles read yet."
          />
        </Panel>

        <Panel titleBn="নতুন বনাম নিয়মিত পাঠক" titleEn="New vs regular readers">
          <NewReturning returning={cohort.returning} neu={cohort.new} />
          <div className="mt-6">
            <h3 className="mb-3 text-meta text-muted">
              <T bn="ট্রাফিক কোথা থেকে আসছে" en="Where traffic comes from" />
            </h3>
            <BarList
              rows={referrers.map((r: { referrer: string; views: number }) => ({
                label: referrerLabel(r.referrer),
                value: r.views,
              }))}
              emptyBn="কোনো রেফারার ডেটা নেই।"
              emptyEn="No referrer data."
            />
          </div>
        </Panel>
      </div>

      {/* Community */}
      <Panel titleBn="সম্প্রদায়" titleEn="Community" className="mt-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile value={community.users} bn="নিবন্ধিত পাঠক" en="Registered readers" />
          <StatTile value={community.authors} bn="লেখক" en="Authors" />
          <StatTile value={community.comments} bn="মন্তব্য" en="Comments" />
          <StatTile value={community.bookmarks} bn="বুকমার্ক" en="Bookmarks" />
        </div>
      </Panel>
    </div>
  );
}

// ── window selector ───────────────────────────────────────────────────────────
function WindowTabs({ days }: { days: number }) {
  return (
    <nav aria-label="সময়সীমা" className="mb-8 flex gap-2">
      {WINDOWS.map((w) => {
        const active = w === days;
        return (
          <Link
            key={w}
            href={`/dashboard/analytics?days=${w}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-md border px-3 py-1.5 text-meta transition-colors ${
              active
                ? "border-accent bg-bg-subtle font-medium text-text"
                : "border-border text-muted hover:bg-bg-subtle"
            }`}
          >
            <T bn={`${toBn(w)} দিন`} en={`${w} days`} />
          </Link>
        );
      })}
    </nav>
  );
}

function Panel({
  titleBn,
  titleEn,
  children,
  className = "",
}: {
  titleBn: string;
  titleEn: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-border p-5 ${className}`}>
      <h2 className="mb-4 font-display text-h2 text-text">
        <T bn={titleBn} en={titleEn} />
      </h2>
      {children}
    </section>
  );
}

function TrackingOff() {
  return (
    <div className="mx-auto max-w-article px-4 py-16 text-center">
      <h1 className="mb-3 font-display text-display text-text">
        <T bn="ট্রাফিক ট্র্যাকিং বন্ধ" en="Traffic tracking is off" />
      </h1>
      <p className="text-body text-muted">
        <T
          bn="ট্রাফিক জমা রাখতে সার্ভারে DATABASE_PATH এনভায়রনমেন্ট ভেরিয়েবল সেট করুন। সেট করার পর থেকে ভিজিট রেকর্ড হওয়া শুরু হবে।"
          en="Set the DATABASE_PATH environment variable on the server to record traffic. Visits are logged from that point on."
        />
      </p>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────
/** Fill zero-view days so the trend line is continuous, not gappy. */
function fillDays(
  since: string,
  rows: { day: string; views: number; visitors: number }[],
): { day: string; views: number; visitors: number }[] {
  const map = new Map(rows.map((r) => [r.day, r]));
  const out: { day: string; views: number; visitors: number }[] = [];
  const today = dhakaDay();
  for (let d = since; d <= today; d = nextDay(d)) {
    out.push(map.get(d) ?? { day: d, views: 0, visitors: 0 });
    if (out.length > 400) break; // guardrail; windows are ≤90
  }
  return out;
}

function nextDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function avgPerDay(total: number, days: number): number {
  return days > 0 ? Math.round(total / days) : 0;
}

function labelForPath(path: string, titles: Map<string, string>): string {
  const title = titles.get(path);
  if (title) return title;
  const CHROME: Record<string, string> = {
    "/": "হোম",
    "/blog": "ব্লগ",
    "/topics": "তালিকাসমূহ",
    "/about": "আমাদের সম্পর্কে",
    "/our-work": "আমাদের কাজ",
  };
  return CHROME[path] ?? path;
}

function referrerLabel(ref: string): string {
  return ref === "direct" ? "সরাসরি / বুকমার্ক" : ref;
}

function rangeHint(days: number): { bn: string; en: string } {
  return { bn: `গত ${toBn(days)} দিন`, en: `last ${days} days` };
}

/** Bengali numerals for chrome labels (content language is Bengali). */
function toBn(n: number): string {
  return String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
}
