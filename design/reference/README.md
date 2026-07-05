# /design/reference — read-only baseline

Per `FRONTEND_DESIGN_PLAN.md` §4.1, this folder holds the **8 baseline screenshots** of the live site (`lostmodesty.com`). They are the visual contract to preserve and the artifact M1 diffs against (§5.2, §5.3 criterion 7). They are **read-only historical baseline**.

## Status: ⛔ NOT YET CAPTURED

Per the confirmed context answer, these do not exist yet and must be produced as a Phase 0 deliverable. Capture requires access to the **live site** — run `scripts/capture-baseline.mjs` with the live URL (see that script's header). Required filenames (exact, per §4.1):

- [ ] `index-light-desktop.png`
- [ ] `index-dark-desktop.png`
- [ ] `index-light-mobile.png`
- [ ] `index-dark-mobile.png`
- [ ] `article-light-desktop.png`
- [ ] `article-dark-desktop.png`
- [ ] `article-light-mobile.png`
- [ ] `article-dark-mobile.png`

Until these exist, **CP1's "side-by-side diff against the 8 baseline screenshots" cannot be performed**, and the §3C SEO-signal diffs have nothing to compare against.
