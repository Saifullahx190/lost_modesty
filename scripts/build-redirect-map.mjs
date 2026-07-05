#!/usr/bin/env node
// Builds data/redirect-map.json from data/url-inventory.csv and runs the audit
// (REBUILD §3B, CP0). Exits non-zero on any chain/loop/coverage error so CI/the
// checkpoint cannot go green on a bad map. Zero dependencies.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parseInventoryCsv, buildMap, auditMap } from "./lib/redirect.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const inventoryPath = resolve(root, process.env.INVENTORY ?? "data/url-inventory.csv");

if (!existsSync(inventoryPath)) {
  console.error(`✗ inventory not found: ${inventoryPath}`);
  console.error("  Phase 0 §3A: produce the real inventory (crawl + GSC + 90d logs) first.");
  process.exit(2);
}

const rows = parseInventoryCsv(readFileSync(inventoryPath, "utf8"));
const isSample = /sample/i.test(inventoryPath) || rows.some((r) => /example\.test/.test(r.old_url));
const result = auditMap(rows);

writeFileSync(
  resolve(root, "data/redirect-map.json"),
  JSON.stringify(buildMap(rows), null, 2),
);

console.log(
  `redirect map: ${result.stats.total} URLs (${result.stats.identity} identity / ${result.stats.redirects} redirects)` +
    (isSample ? "  [SAMPLE inventory — not the real one]" : ""),
);

if (!result.ok) {
  console.error(`✗ AUDIT FAILED (${result.errors.length}):`);
  for (const e of result.errors) console.error("  - " + e);
  process.exit(1);
}
console.log("✓ audit clean: zero chains, zero loops, status policy OK");
