#!/usr/bin/env node
// OFFLINE shadow-parity check (REBUILD Verification #2). The same SEO diff as the
// live shadow-diff, but against SAVED HTML SNAPSHOTS instead of live origins — so SEO
// parity can be asserted with zero production access (the current constraint) and in
// CI on every PR. The moment origins are reachable, scripts/shadow-diff.mjs runs the
// identical comparison against live traffic; both share scripts/lib/seo-extract.mjs.
//
// Layout (see data/snapshots/README.md):
//   data/snapshots/old/<name>.html   ← saved from the real live site (the contract)
//   data/snapshots/new/<name>.html   ← saved from the new build (prerender or curl)
// Files are paired by basename. Exits non-zero if any pair has an SEO diff or a NEW
// snapshot is missing for an OLD one.
//
//   node scripts/parity-check.mjs               # default data/snapshots
//   SNAP_DIR=path/to/snapshots node scripts/parity-check.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { extractSeo, diffSeo } from "./lib/seo-extract.mjs";

const ROOT = process.env.SNAP_DIR ?? "data/snapshots";
const OLD_DIR = join(ROOT, "old");
const NEW_DIR = join(ROOT, "new");

if (!existsSync(OLD_DIR)) {
  console.error(`✗ no OLD snapshots at ${OLD_DIR}/`);
  console.error("  Save real live-site HTML there (one .html per URL); see data/snapshots/README.md.");
  process.exit(2);
}

const oldFiles = readdirSync(OLD_DIR).filter((f) => f.endsWith(".html"));
if (oldFiles.length === 0) {
  console.error(`✗ ${OLD_DIR}/ has no .html snapshots yet.`);
  process.exit(2);
}

let mismatches = 0;
let missing = 0;
for (const file of oldFiles) {
  const name = basename(file);
  const newPath = join(NEW_DIR, name);
  if (!existsSync(newPath)) {
    missing++;
    console.error(`⚠ ${name}: no NEW snapshot at ${newPath} — cannot compare`);
    continue;
  }
  const oldSig = extractSeo(readFileSync(join(OLD_DIR, file), "utf8"));
  const newSig = extractSeo(readFileSync(newPath, "utf8"));
  const diffs = diffSeo(oldSig, newSig);

  if (diffs.length) {
    mismatches++;
    console.error(`✗ ${name}`);
    for (const d of diffs) console.error(`    ${d.field}:\n      OLD: ${d.old}\n      NEW: ${d.new}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

const compared = oldFiles.length - missing;
console.log(`\n${compared - mismatches}/${compared} clean${missing ? `, ${missing} missing NEW snapshot(s)` : ""}`);
process.exit(mismatches || missing ? 1 : 0);
