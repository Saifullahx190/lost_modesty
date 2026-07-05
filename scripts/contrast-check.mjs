#!/usr/bin/env node
// WCAG 2.1 contrast gate for the color tokens (FRONTEND §2.1 "pre-checked to meet
// 4.5:1 / 3:1 before implementation" + §5.3 criterion 2). Checks every pairing in
// colors.json::contrastContract for BOTH light and dark. Exits non-zero on any
// failure so a token edit can't merge below the floor. Zero dependencies.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const colors = JSON.parse(
  readFileSync(resolve(root, "design/tokens/colors.json"), "utf8"),
);

const srgbToLinear = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const luminance = (hex) => {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
};
const ratio = (fg, bg) => {
  const L1 = luminance(fg);
  const L2 = luminance(bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
};

let failures = 0;
for (const theme of ["light", "dark"]) {
  const set = colors[theme];
  console.log(`\n${theme.toUpperCase()}`);
  for (const pair of colors.contrastContract.pairs) {
    const fg = set[pair.fg];
    const bg = set[pair.bg];
    const r = ratio(fg, bg);
    const ok = r >= pair.min;
    if (!ok) failures++;
    console.log(
      `  ${ok ? "✓" : "✗"} ${pair.fg} on ${pair.bg}: ${r.toFixed(2)}:1 (min ${pair.min})`,
    );
  }
  // Decorative/logotype tokens (e.g. marigold color-accent) are reported but NOT
  // graded — they are exempt from WCAG text/UI contrast (1.4.3 / 1.4.11). Surfaced
  // here so the exemption is visible and intentional, not a silent omission (B1).
  const exempt = colors.contrastContract.decorativeExempt;
  if (exempt) {
    const bg = set[exempt.against];
    for (const token of exempt.tokens) {
      const r = ratio(set[token], bg);
      console.log(
        `  ⓘ ${token} on ${exempt.against}: ${r.toFixed(2)}:1 (decorative/logotype — not graded)`,
      );
    }
  }
}

if (failures) {
  console.error(`\n✗ ${failures} contrast failure(s) — tokens below WCAG floor.`);
  process.exit(1);
}
console.log("\n✓ all token pairings pass WCAG (4.5:1 body / 3:1 large) in light + dark");
