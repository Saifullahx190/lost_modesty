# Design CHANGELOG

Every visual decision that **deviates from `/design/reference`** (the 8 baseline screenshots) is logged here with a reason traceable to `FRONTEND_DESIGN_PLAN.md` (per §4.1 and §5.3 criterion 7). Reference screenshots are read-only baseline; this file is where intentional change is recorded.

> **Status:** Baseline screenshots not yet captured (see `reference/README.md`). Deviations below are **proposed/locked in the plan but pending visual diff** against the real baseline. They are listed now so they are not silently introduced later.

## Pending intentional deviations (declared in the plan, to be confirmed at M1 side-by-side diff)

| # | Deviation | Plan source | Reason |
|---|---|---|---|
| D1 | Mobile tap targets (theme toggle, hamburger, pagination arrows) expanded to **≥44×44px** | §1.3 (Touch targets) | Accessibility floor; screenshots suggest current cluster is tighter than 44px |
| D2 | **Serif display + humanist sans** type pairing replaces current single typeface | §2.2 | Literary brand differentiation for headlines; Bengali body readability |
| D3 | Theme toggle gains **150–200ms reduced-motion-safe crossfade** (currently a hard flash) | §2.4 (Theme toggle), §3.3 | Polish; respects `prefers-reduced-motion` |
| D4 | Cover images standardized to **16:10** with consistent corner radius + hover lift | §2.4 (Post card), §2.6 | Makes existing art direction read as intentional curation |
| D5 | First-visit theme defaults to **`prefers-color-scheme`** (override persists) | §3.2 Journey A | "Likely-but-unconfirmed gap" — **requires confirmation vs baseline before shipping** |
| D6 | New affordances: **series nav strip**, **live-search feedback**, **accessible footnote disclosure** | §3.2 C, §3.3, §2.4 | Genuinely-missing affordances, explicitly in scope |
| D7 | **Token split** for the marigold (supersedes the earlier global-darken). `--color-accent` keeps marigold **`#D9A02B`** as a **decorative/logotype-only** mark (not graded for text contrast); a new **`--color-link` = `#8B6914`** (light, 5.09:1) / `#E3B24F` (dark) carries all link + active-nav **text** | Phase 0 / B1 resolution | Preserves the brand signature element (§0, §2.6) AND clears the 4.5:1 text floor (§1.3) — the global darken sacrificed the brand on the one element where bright marigold is mandatory and WCAG doesn't even apply (logotype). |
| D8 | Light-mode `--color-accent-secondary` (terracotta) darkened `#C75B39` → `#BC4F30` | Phase 0 / B1 resolution | §2.1 assigns it to **text** (category/tag labels, footnote markers); `#C75B39` is only 4.21:1 and failed the 4.5:1 text floor. The prior B1 fix mis-graded it as large-text (3.0) and missed this. `#BC4F30` = 4.88:1. |

> D5 specifically must be checked against the real baseline screenshots before it ships — flagged per the lead-engineer rule on intentional changes.

## ⛔ BLOCKERS (must be resolved by stakeholder before M0 sign-off)

### ~~B1 — `--color-accent` fails contrast for its specified "primary links" use (light mode)~~ ✅ RESOLVED (token split)
- **Found:** Phase 0, by `scripts/contrast-check.mjs`.
- **Root cause:** §2.1 assigned ONE token (`--color-accent`, marigold `#D9A02B` = **2.33:1** on white) to two incompatible jobs — a **brand/logo mark** (where bright marigold is the whole point and WCAG 1.4.3 exempts logotypes) and **primary link text** (where 4.5:1 is mandatory). One value cannot satisfy both: marigold bright enough to be the brand fails text contrast, and dark enough to pass text contrast (`#8B6914`) is no longer marigold.
- **Superseded first attempt:** an earlier fix darkened the *global* `--color-accent` to `#8B6914`. Rejected — it passed the gate only by destroying the brand mark (the marigold motif of §0/§2.6) and it left a sibling defect uncaught: `--color-accent-secondary` (terracotta, also **text** per §2.1) was mis-graded at the 3.0 large-text floor and silently shipped at 4.21:1, below the 4.5:1 text floor.
- **Resolution (decision, lead engineer, 2026-06-29):** **Split the token by use.**
  - `--color-accent` = marigold **`#D9A02B`** restored, reclassified **decorative/logotype-only** (logo lockup, marigold motif, decorative fills) — never text, never a meaningful UI control. Listed in `contrastContract.decorativeExempt`; reported by the gate (ⓘ) but not graded.
  - `--color-link` = **`#8B6914`** (light, **5.09:1**) / **`#E3B24F`** (dark, 10.07:1) — NEW token carrying every link + active-nav **text** use the plan had assigned to the accent.
  - `--color-accent-secondary` (light) darkened `#C75B39` → **`#BC4F30`** (**4.88:1**) since it is tag-label **text**.
  - Contract fixed: text-used accents now graded at **4.5** (not 3.0); marigold exempted explicitly.
- **Logged:** Phase 0, 2026-06-29. `design/tokens/colors.json`, `scripts/contrast-check.mjs`, `components/TextLink.tsx`, `components/Button.tsx` updated; `app/tokens.generated.css` regenerated; contrast gate re-run **green** (light + dark). Deviations from original §2.1 values: **D7** (token split) and **D8** (secondary darken) below.

---

## Pending intentional deviations (declared in the plan, to be confirmed at M1 side-by-side diff)
