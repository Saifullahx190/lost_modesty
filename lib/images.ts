import type { ImageRef } from "./content/types";

// ───────────────────────────────────────────────────────────────────────────
// Cover-image pipeline — the SINGLE seam between content image refs and the
// next/image props the UI renders (FRONTEND §2.6 imagery / §6.2 CLS-safe sizing).
//
// Why one function: today covers are local sample assets; tomorrow they come from
// a real CDN (REBUILD §2 data layer / next.config remotePatterns). When that swap
// happens, ONLY this file changes — components keep spreading coverProps() and never
// learn the origin moved. Dimensions are always present (server-side, from the
// content model) so next/image reserves the box before load → CLS ~0 (§1.3).
// ───────────────────────────────────────────────────────────────────────────

/** Aspect ratio every cover is framed to (FRONTEND §2.6: lock 16:10). Keep in sync
 *  with spacing.json coverAspectRatio / the `aspect-cover` Tailwind utility. */
export const COVER_ASPECT = 16 / 10;

export interface CoverImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Tiny inline LQIP for next/image placeholder="blur" — no network, build-safe. */
  blurDataURL: string;
}

/**
 * Resolve a content ImageRef into render-ready cover data.
 *
 * @param ref  The post's cover (may be undefined → caller shows the no-cover fallback).
 * @param fallbackAlt  Alt to use only when the ref omits one (refs should always carry
 *   an author-authored alt per FRONTEND §1.3; this is a safety net, not the norm).
 *
 * CDN-SWAP POINT: when the image origin lands, map `ref.src` → CDN URL here (and add
 * the host to next.config `remotePatterns`); optionally replace `blurDataURL` with a
 * real thumbhash/BlurHash decoded to a data URL. No component edits required.
 */
export function getCoverImage(ref: ImageRef | undefined, fallbackAlt = ""): CoverImage | null {
  if (!ref) return null;
  return {
    src: ref.src,
    width: ref.width,
    height: ref.height,
    alt: ref.alt || fallbackAlt,
    blurDataURL: blurPlaceholder(ref.src),
  };
}

/** next/image props for a cover rendered in a fixed aspect-ratio box (`fill`).
 *  `sizes` is required for correct srcset selection; callers pass their layout's. */
export function coverProps(cover: CoverImage, sizes: string, priority = false) {
  return {
    src: cover.src,
    alt: cover.alt,
    fill: true as const,
    sizes,
    priority,
    placeholder: "blur" as const,
    blurDataURL: cover.blurDataURL,
    className: "object-cover",
  };
}

// Deterministic LQIP: a 16:10 SVG washed in the neutral surface tone, hue-nudged by
// a hash of the src so different covers don't all flash the identical grey. Encoded
// as a data URL (no base64 dependency, URL-encoded to stay valid in markup). This is
// a placeholder strategy, not real image content — swapped for thumbhash at CDN time.
const SURFACE = [247, 246, 244]; // --color-bg-subtle (light) as the blur base

function blurPlaceholder(seed: string): string {
  const h = hash(seed);
  const tint = (i: number, amt: number) =>
    Math.max(0, Math.min(255, SURFACE[i] + (((h >> (i * 4)) & 0xf) - 8) * amt));
  const c1 = `rgb(${tint(0, 2)},${tint(1, 2)},${tint(2, 2)})`;
  const c2 = `rgb(${tint(0, 4)},${tint(1, 4)},${tint(2, 4)})`;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='10'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/>` +
    `</linearGradient></defs><rect width='16' height='10' fill='url(#g)'/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
