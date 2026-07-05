// Site-wide configuration consumed by SEO, layout chrome, feed, and sitemap.
// Single source for the canonical origin so canonical tags, OG URLs, RSS links,
// and the sitemap can never disagree (REBUILD §3C SEO-signal preservation).

/** Canonical origin. Defaults to the live host so absolute URLs in JSON-LD/OG/
 *  sitemap are correct even before the production env var is wired. Override with
 *  NEXT_PUBLIC_SITE_URL in each environment. No trailing slash. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lostmodesty.com"
).replace(/\/$/, "");

export const SITE = {
  name: "লস্ট মডেস্টি",
  /** Latin name for OG site_name / English admin chrome (lang-tagged in use). */
  nameLatin: "Lost Modesty",
  tagline: "বাংলা সাহিত্য ব্লগ — গদ্য, ধারাবাহিক গল্প আর প্রবন্ধ।",
  locale: "bn_BD",
  lang: "bn",
} as const;

export interface NavItem {
  href: string;
  label: string;
}

/** Primary nav — labels/order mirror the live site header reference
 *  (FRONTEND §2.4 header: logo + a few links + theme toggle). */
export const NAV: NavItem[] = [
  { href: "/blog", label: "ব্লগ" },
  { href: "/topics", label: "তালিকাসমূহ" },
  { href: "/our-work", label: "আমাদের কাজ" },
  { href: "/about", label: "আমাদের সম্পর্কে" },
];

export const SOCIAL = {
  email: "mailto:hello@lostmodesty.com",
  facebook: "https://www.facebook.com/lostmodesty",
} as const;

/** Absolute URL from a root-relative path, for OG/canonical/JSON-LD/sitemap. */
export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
