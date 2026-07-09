import { ImageResponse } from "next/og";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SITE } from "./site";

// ───────────────────────────────────────────────────────────────────────────
// Branded OpenGraph image generator (REBUILD §3C "OpenGraph/Twitter preserved";
// FRONTEND §2.6 imagery / §0 marigold motif). One template → every share card looks
// like the site: dark brand frame, marigold mark, post title, author kicker.
//
// Rendered through the file-convention opengraph-image routes, so Next prerenders
// one PNG per article at BUILD time (node runtime, no per-request cost, CP0-safe)
// and auto-injects the og:image + twitter:image meta with correct dimensions.
// ImageResponse (satori) is edge-compatible too — flip `runtime = 'edge'` in the
// route if these ever need on-demand generation.
//
// Colours are the DARK token values hardcoded (satori can't read CSS vars); dark is
// the first-class brand surface (§2.6) and gives the most consistent social card.
// ───────────────────────────────────────────────────────────────────────────

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const C = {
  bg: "#0B0B0C",
  text: "#EDEDED",
  muted: "#9A9A9A",
  accent: "#E3B24F", // marigold (dark token)
  border: "#262626",
};

// satori supports ttf/otf/woff (NOT woff2). Drop these files in public/fonts to get
// real Bengali + serif rendering; see public/fonts/README.md. If absent, satori uses
// its bundled Latin font — the build still succeeds, so this never blocks CI. The
// moment the files land, OG cards render Bengali correctly with no code change.
const FONT_FILES: { file: string; name: string; weight: 400 | 600 | 700 }[] = [
  { file: "NotoSerifBengali-SemiBold.ttf", name: "OG Display", weight: 600 },
  { file: "NotoSansBengali-Regular.ttf", name: "OG Body", weight: 400 },
];

type LoadedFont = { name: string; data: ArrayBuffer | Buffer; weight: 400 | 600 | 700; style: "normal" };

function loadOgFonts(): LoadedFont[] {
  const dir = join(process.cwd(), "public", "fonts");
  const out: LoadedFont[] = [];
  for (const f of FONT_FILES) {
    const p = join(dir, f.file);
    if (existsSync(p)) {
      out.push({ name: f.name, data: readFileSync(p), weight: f.weight, style: "normal" });
    }
  }
  return out;
}

function MarigoldGlyph({ size = 64 }: { size?: number }) {
  // Inline copy of the brand mark (components/Logo) — satori needs self-contained SVG.
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill={C.accent}>
      <circle cx="50" cy="50" r="17" />
      <ellipse cx="50" cy="15" rx="10" ry="22" />
      <ellipse cx="50" cy="85" rx="10" ry="22" />
      <ellipse cx="15" cy="50" rx="22" ry="10" />
      <ellipse cx="85" cy="50" rx="22" ry="10" />
      <ellipse cx="25" cy="25" rx="17" ry="10" transform="rotate(45 25 25)" />
      <ellipse cx="75" cy="25" rx="17" ry="10" transform="rotate(-45 75 25)" />
      <ellipse cx="25" cy="75" rx="17" ry="10" transform="rotate(-45 25 75)" />
      <ellipse cx="75" cy="75" rx="17" ry="10" transform="rotate(45 75 75)" />
    </svg>
  );
}

export interface OgInput {
  /** Headline — post title, or the site name on the default card. */
  title: string;
  /** Small label above the title — author name, or the tagline on the default card. */
  kicker?: string;
}

/** Build the branded ImageResponse. Used by every opengraph-image route. */
export function renderOgImage({ title, kicker }: OgInput): ImageResponse {
  const fonts = loadOgFonts();
  const hasFonts = fonts.length > 0;
  // Clamp very long Bengali titles so they never overflow the 1200×630 frame (§3.4
  // long-title edge case). 3 lines at this size fits comfortably.
  const display = title.length > 120 ? `${title.slice(0, 117)}…` : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: C.bg,
          padding: "72px 80px",
          fontFamily: hasFonts ? "OG Body" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <MarigoldGlyph />
          <span style={{ fontSize: 34, color: C.text, fontFamily: hasFonts ? "OG Display" : "serif" }}>
            {SITE.name}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {kicker && <span style={{ fontSize: 30, color: C.accent }}>{kicker}</span>}
          <span
            style={{
              fontSize: 64,
              lineHeight: 1.2,
              color: C.text,
              fontFamily: hasFonts ? "OG Display" : "serif",
              // satori needs an explicit clamp for multi-line truncation
              display: "flex",
            }}
          >
            {display}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", borderTop: `2px solid ${C.border}`, paddingTop: 24 }}>
          <span style={{ fontSize: 26, color: C.muted }}>{SITE.nameLatin}</span>
          <span style={{ fontSize: 26, color: C.muted }}>lostmodesty.org</span>
        </div>
      </div>
    ),
    { ...ogSize, fonts: hasFonts ? fonts : undefined },
  );
}
