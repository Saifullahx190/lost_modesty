import { getAllPosts, postHref, getAuthor } from "@/lib/content/repo";
import { SITE, SITE_URL, absUrl } from "@/lib/site";

// RSS 2.0 feed (REBUILD §3C: "RSS/Atom feed URLs and format preserved" —
// syndication + email-digest dependencies). Served at /feed.xml; the edge router's
// `feed` route class matches it. Statically generated (no request-time work).
export const dynamic = "force-static";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function GET(): Response {
  const posts = getAllPosts();
  const updated = posts[0]?.updated ?? posts[0]?.date ?? new Date().toISOString();

  const items = posts
    .map((p) => {
      const url = absUrl(postHref(p));
      const author = getAuthor(p.author)?.name ?? SITE.name;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="false">${esc(p.id)}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <dc:creator>${esc(author)}</dc:creator>
      <description>${esc(p.excerpt)}</description>
${p.categories.map((c) => `      <category>${esc(c)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${esc(SITE_URL)}</link>
    <atom:link href="${esc(absUrl("/feed.xml"))}" rel="self" type="application/rss+xml" />
    <description>${esc(SITE.tagline)}</description>
    <language>${SITE.lang}</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
