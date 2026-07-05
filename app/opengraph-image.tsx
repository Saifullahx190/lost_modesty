import { renderOgImage, ogSize, ogContentType } from "@/lib/og";
import { SITE } from "@/lib/site";

// Default site OG card. By the file convention this CASCADES to every route that
// doesn't define its own opengraph-image (home, category, tag, author) — so they all
// get a branded card without per-route files. Articles override via their own file.
export const size = ogSize;
export const contentType = ogContentType;
export const alt = `${SITE.name} — ${SITE.nameLatin}`;

export default function OgImage() {
  return renderOgImage({ title: SITE.name, kicker: SITE.tagline });
}
