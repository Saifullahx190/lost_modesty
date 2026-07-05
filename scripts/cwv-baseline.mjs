#!/usr/bin/env node
// Capture the Core Web Vitals baseline from the LIVE site (REBUILD §3C "CWV baseline
// captured now", FRONTEND §1.3). The rebuild must match-or-beat these, so they are
// recorded BEFORE any new route ships. Writes data/cwv-baseline.json.
//
// ACCESS-GATED: requires the live URLs + Lighthouse.
//   npm i -D lighthouse chrome-launcher
//   LIVE_INDEX=... LIVE_ARTICLE=... node scripts/cwv-baseline.mjs
import { writeFileSync } from "node:fs";

const targets = {
  index: process.env.LIVE_INDEX,
  article: process.env.LIVE_ARTICLE,
};
if (!targets.index || !targets.article) {
  console.error("✗ ACCESS-GATED: set LIVE_INDEX and LIVE_ARTICLE (live-site URLs).");
  process.exit(2);
}
let lighthouse, chromeLauncher;
try {
  lighthouse = (await import("lighthouse")).default;
  chromeLauncher = await import("chrome-launcher");
} catch {
  console.error("✗ Lighthouse not installed. Run: npm i -D lighthouse chrome-launcher");
  process.exit(2);
}

const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
const out = {};
for (const [name, url] of Object.entries(targets)) {
  const runnerResult = await lighthouse(
    url,
    { port: chrome.port, onlyCategories: ["performance", "accessibility", "seo", "best-practices"] },
    { formFactor: "mobile", screenEmulation: { mobile: true } },
  );
  const lhr = runnerResult.lhr;
  out[name] = {
    url,
    scores: Object.fromEntries(
      Object.entries(lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]),
    ),
    metrics: {
      LCP: lhr.audits["largest-contentful-paint"]?.numericValue,
      CLS: lhr.audits["cumulative-layout-shift"]?.numericValue,
      INP: lhr.audits["interaction-to-next-paint"]?.numericValue ?? null,
      TBT: lhr.audits["total-blocking-time"]?.numericValue,
    },
    targets: { LCP: "<2000ms", CLS: "<0.05", INP: "<200ms", perf: ">=95", a11y: ">=100", seo: ">=100" },
  };
  console.log(`✓ ${name}: perf ${out[name].scores.performance}, LCP ${Math.round(out[name].metrics.LCP)}ms, CLS ${out[name].metrics.CLS?.toFixed(3)}`);
}
await chrome.kill();
writeFileSync("data/cwv-baseline.json", JSON.stringify(out, null, 2));
console.log("\n✓ data/cwv-baseline.json written — the rebuild must match-or-beat these.");
