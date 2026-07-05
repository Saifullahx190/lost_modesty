import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SITE } from "@/lib/site";
import { metadataBase } from "@/lib/seo";
import { NO_FLASH_LANG } from "@/lib/i18n/config";
import { T } from "@/components/T";

// Site-wide <html lang="bn"> so screen readers select the Bengali voice (FRONTEND
// §1.3 language attributes). Per-element lang overrides are applied where English
// appears (admin chrome). metadataBase resolves relative canonical/OG URLs to the
// canonical origin (REBUILD §3C) — pages supply their own title/canonical via
// lib/seo builders; this sets the defaults + title template.
export const metadata: Metadata = {
  metadataBase,
  title: {
    default: SITE.name,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.tagline,
  alternates: {
    types: { "application/rss+xml": "/feed.xml" },
  },
};

// No-flash theme script (FRONTEND §3.3): runs BEFORE first paint, sets
// data-theme from stored preference, else falls back to prefers-color-scheme
// (Journey A default, §3.2 — note: shipping prefers-color-scheme as the first-visit
// default is deviation D5 in design/CHANGELOG.md, pending baseline confirmation).
const noFlashTheme = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_LANG }} />
      </head>
      <body className="flex min-h-screen flex-col">
        {/* Skip link — keyboard users jump straight to content (§1.3 keyboard nav). */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-bg focus:px-4 focus:py-2 focus:text-text focus:outline focus:outline-2 focus:outline-focus"
        >
          <T bn="মূল লেখায় যান" en="Skip to content" />
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        {/* Connectivity affordance (§3.4) — quiet until the connection drops. */}
        <OfflineBanner />
      </body>
    </html>
  );
}
