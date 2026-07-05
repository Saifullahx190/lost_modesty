#!/usr/bin/env node
// Capture the 8 baseline reference screenshots (FRONTEND §4.1, §5.2). Drives a
// headless browser across {index,article} × {light,dark} × {desktop,mobile} on the
// LIVE site and writes them into design/reference/ with the exact required names.
//
// ACCESS-GATED: requires (a) the live URLs and (b) Playwright installed.
//   npm i -D playwright && npx playwright install chromium
//   LIVE_INDEX=https://www.lostmodesty.com \
//   LIVE_ARTICLE=https://www.lostmodesty.com/<author>/<slug> \
//   node scripts/capture-baseline.mjs
import { existsSync } from "node:fs";

const LIVE_INDEX = process.env.LIVE_INDEX;
const LIVE_ARTICLE = process.env.LIVE_ARTICLE;
if (!LIVE_INDEX || !LIVE_ARTICLE) {
  console.error("✗ ACCESS-GATED: set LIVE_INDEX and LIVE_ARTICLE (live-site URLs).");
  console.error("  These come from the §3A inventory (pick a representative article).");
  process.exit(2);
}
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("✗ Playwright not installed. Run: npm i -D playwright && npx playwright install chromium");
  process.exit(2);
}

const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const PAGES = { index: LIVE_INDEX, article: LIVE_ARTICLE };
const dir = "design/reference";

const browser = await chromium.launch();
for (const [pageName, url] of Object.entries(PAGES)) {
  for (const [bp, viewport] of Object.entries(VIEWPORTS)) {
    for (const theme of ["light", "dark"]) {
      const ctx = await browser.newContext({ viewport, colorScheme: theme });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "networkidle" });
      const file = `${dir}/${pageName}-${theme}-${bp}.png`;
      await page.screenshot({ path: file, fullPage: true });
      console.log(`✓ ${file}`);
      await ctx.close();
    }
  }
}
await browser.close();
console.log(`\nBaseline captured into ${dir}/. (was present: ${existsSync(dir)})`);
