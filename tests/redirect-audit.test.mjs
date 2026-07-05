// Automated redirect audit (REBUILD §3B / CP0 / §"Verification" #1). Re-run every
// phase. Asserts the contract on the CURRENT inventory and on adversarial fixtures
// (so we know the auditor actually catches chains/loops, not just passes empty data).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parseInventoryCsv, auditMap } from "../scripts/lib/redirect.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("current inventory has zero chains/loops and valid status policy", () => {
  const path = resolve(root, process.env.INVENTORY ?? "data/url-inventory.csv");
  if (!existsSync(path)) {
    // No real inventory yet (Phase 0, §3A pending). Skip rather than false-green.
    console.warn("  (skipped: no inventory file — §3A artifact not yet produced)");
    return;
  }
  const result = auditMap(parseInventoryCsv(readFileSync(path, "utf8")));
  assert.ok(result.ok, "audit errors:\n" + result.errors.join("\n"));
});

test("auditor DETECTS a redirect chain", () => {
  const rows = parseInventoryCsv(
    "old_url,new_url,expected_status\n/a,/b,301\n/b,/c,301\n/c,/c,200\n",
  );
  const result = auditMap(rows);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.startsWith("CHAIN")), "should flag chain");
});

test("auditor DETECTS a redirect loop", () => {
  const rows = parseInventoryCsv(
    "old_url,new_url,expected_status\n/x,/y,301\n/y,/x,301\n",
  );
  const result = auditMap(rows);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.startsWith("LOOP")), "should flag loop");
});

test("auditor REJECTS a 302 on a path change (must be 301)", () => {
  const rows = parseInventoryCsv(
    "old_url,new_url,expected_status\n/old,/new,302\n/new,/new,200\n",
  );
  const result = auditMap(rows);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("must be 301")));
});

test("auditor PASSES a clean single-hop map", () => {
  const rows = parseInventoryCsv(
    "old_url,new_url,expected_status\n/keep,/keep,200\n/moved,/dest,301\n/dest,/dest,200\n",
  );
  const result = auditMap(rows);
  assert.ok(result.ok, result.errors.join("\n"));
});
