/** @type {import('next').NextConfig} */
const nextConfig = {
experimental: {
    serverActions: {
      allowedOrigins: ['lostmodesty.org', 'www.lostmodesty.org'],
bodySizeLimit: '10mb',
    },
  },
  reactStrictMode: true,
  // SSG/ISR for read path, SSR for auth/dashboard/editor — rendering strategy per
  // REBUILD_PLAN.md §2. Per-route rendering is set at the route level (Phase 1+),
  // not globally here.
  images: {
    // next/image is the LCP lever for the <2.0s target (FRONTEND §1.3 / §2.6).
    // Real remote patterns (the live CDN host for cover images) are filled in
    // Phase 1 once the image origin is confirmed from the read-replica/inventory.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
    // Phase-1 sample covers are local SVGs standing in for real raster covers
    // (lib/content/posts). next/image only serves SVG through the optimizer with
    // this flag; the CSP sandbox neutralizes any script/interaction in the SVG.
    // Real raster covers from the CDN won't need this — revisit when the image
    // origin is wired.
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async redirects() {
    // Phase 0: empty. The 1:1 redirect map (REBUILD §3B) is built by
    // scripts/build-redirect-map.mjs from the real URL inventory and wired in
    // during Phase 1. Default behavior = identical paths / zero redirects.
    return [];
  },
};

export default nextConfig;
