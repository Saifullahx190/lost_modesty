import type { Config } from "tailwindcss";
import colors from "./design/tokens/colors.json" assert { type: "json" };
import typography from "./design/tokens/typography.json" assert { type: "json" };
import spacing from "./design/tokens/spacing.json" assert { type: "json" };

// Tailwind config CONSUMES the design tokens (FRONTEND §4.1: "tailwind.config.ts
// reads colors.json"). Components reference semantic utilities (bg-bg, text-muted,
// text-accent, ...) which resolve to CSS variables defined in app/globals.css, so
// switching light/dark only changes the variable values — components never branch
// on theme (§2.1). No hardcoded hex in component files (§6.1).

// Every semantic color is exposed as a utility backed by its CSS variable.
const colorTokens = Object.keys(colors.light).reduce<Record<string, string>>(
  (acc, name) => {
    // name e.g. "color-accent" -> utility key "accent" -> var(--color-accent)
    const key = name.replace(/^color-/, "");
    acc[key] = `var(--${name})`;
    return acc;
  },
  {},
);

const fontSizeTokens = Object.entries(typography.scale).reduce<
  Record<string, [string, { lineHeight: string }]>
>((acc, [token, def]) => {
  // token e.g. "text-display" -> utility "display"
  const key = token.replace(/^text-/, "");
  acc[key] = [def.size, { lineHeight: def.lineHeight }];
  return acc;
}, {});

const config: Config = {
  // Class-based dark mode driven by data-theme/`.dark` on <html> set by the
  // no-flash inline script (FRONTEND §3.3: no flash-of-wrong-theme).
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./design/components/**/*.{ts,tsx}",
  ],
  theme: {
    // Spacing scale is Tailwind's default (§2.3 says keep it) — we only assert the
    // allowed steps via the token file; not overriding the scale here is deliberate.
    screens: {
      md: spacing.breakpoints.md,
      lg: spacing.breakpoints.lg,
      xl: spacing.breakpoints.xl,
    },
    extend: {
      colors: colorTokens,
      fontSize: fontSizeTokens,
      fontFamily: {
        display: [
          ...typography.families.display.bengali,
          ...typography.families.display.latin,
          ...typography.families.display.fallback,
        ],
        body: [
          ...typography.families.body.bengali,
          ...typography.families.body.latin,
          ...typography.families.body.fallback,
        ],
      },
      maxWidth: {
        article: spacing.contentWidth.article,
        index: spacing.contentWidth.index,
      },
      aspectRatio: {
        cover: spacing.coverAspectRatio.replace(/\s/g, ""),
      },
      outlineColor: {
        focus: "var(--color-focus-ring)",
      },
    },
  },
  plugins: [],
};

export default config;
