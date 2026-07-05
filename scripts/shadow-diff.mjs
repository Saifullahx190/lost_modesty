#!/usr/bin/env node
// LIVE shadow HTML diff (REBUILD §3D + Verification #2, CP0/CP1). For each path,
// fetch the NEW app response and the OLD live response and diff the SEO-load-bearing
// surface via the shared extractor (scripts/lib/seo-extract.mjs). Read-only; discards
// bodies (no user impact). Zero dependencies (global fetch). Exits non-zero on any
// monitored diff. This is the gate that must be clean BEFORE any canary > 0.
//
// ACCESS-GATED: needs a reachable NEW_ORIGIN and OLD_ORIGIN. For an offline check
// against saved snapshots (no origins, no deploy), use scripts/parity-check.mjs —
// same extractor, same diff rules.
//
//   NEW_ORIGIN=https://new.internal OLD_ORIGIN=https://www.lostmodesty.com \
//   PATHS=data/shadow-paths.txt node scripts/shadow-diff.mjs
import { readFileSync, existsSync } from "node:fs";
import { extractSeo, diffSeo } from "./lib/seo-extract.mjs";

const NEW_ORIGIN = process.env.NEW_ORIGIN;
const OLD_ORIGIN = process.env.OLD_ORIGIN;
const PATHS = process.env.PATHS ?? "data/shadow-paths.txt";

if (!NEW_ORIGIN || !OLD_ORIGIN) {
  console.error("✗ ACCESS-GATED: set NEW_ORIGIN and OLD_ORIGIN (the live site).");
  console.error("  For an offline check, use: node scripts/parity-check.mjs");
  process.exit(2);
}
if (!existsSync(PATHS)) {
  console.error(`✗ no paths file at ${PATHS} (derive from the §3A URL inventory).`);
  process.exit(2);
}

async function grab(origin, path) {
  const res = await fetch(origin + path, { redirect: "manual" });
  const html = res.status >= 200 && res.status < 300 ? await res.text() : "";
  return { status: res.status, location: res.headers.get("location") ?? "", sig: extractSeo(html) };
}

const paths = readFileSync(PATHS, "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
let mismatches = 0;
for (const p of paths) {
  const [a, b] = await Promise.all([grab(NEW_ORIGIN, p), grab(OLD_ORIGIN, p)]);
  const diffs = [];
  if (a.status !== b.status) diffs.push({ field: "status", old: b.status, new: a.status });
  if (a.status >= 200 && a.status < 300) diffs.push(...diffSeo(b.sig, a.sig));

  if (diffs.length) {
    mismatches++;
    console.error(`✗ ${p}`);
    for (const d of diffs) console.error(`    ${d.field}:\n      OLD: ${d.old}\n      NEW: ${d.new}`);
  } else {
    console.log(`✓ ${p}`);
  }
}
console.log(`\n${paths.length - mismatches}/${paths.length} clean`);
process.exit(mismatches ? 1 : 0);
