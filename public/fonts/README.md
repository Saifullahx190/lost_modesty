# Self-hosted fonts — drop-in binaries (not vendored in this repo)

These font files are **not committed** (licensing + repo weight). Add them here before
production. Nothing here blocks the build if they're missing — the web pages fall back
to system fonts (see `app/fonts.css`) and OG cards render with satori's bundled Latin
font (see `lib/og.tsx`). Adding the files is a **content step, not a code change**.

## 1. Web rendering — `@font-face` in `app/fonts.css` (woff2, subset)

| Variable | File | Source | Notes |
|---|---|---|---|
| `--font-display` | `NotoSerifBengali-SemiBold.woff2` | Noto Serif Bengali 600 | Headlines/titles (FRONTEND §2.2) |
| `--font-body` | `NotoSansBengali-Regular.woff2` | Noto Sans Bengali 400 | Body + UI (workhorse) |
| `--font-body` (Latin) | `Inter-Regular.woff2` | Inter 400 | Latin within body |

Subset to **Bengali + Latin** only (FRONTEND §1.2) to keep payload small, e.g.:

```bash
# pip install fonttools brotli
pyftsubset NotoSansBengali-Regular.ttf \
  --unicodes="U+0980-09FF,U+0000-00FF,U+200C-200D,U+25CC" \
  --flavor=woff2 --output-file=NotoSansBengali-Regular.woff2
```

The `unicode-range` in `app/fonts.css` already matches this split so the browser only
downloads the Bengali file for Bengali text and the Latin file for Latin runs.

## 2. OG image rendering — satori in `lib/og.tsx` (ttf/otf, NOT woff2)

satori (next/og) cannot read woff2. Provide the **same families as ttf**:

- `NotoSerifBengali-SemiBold.ttf`  → OG headline
- `NotoSansBengali-Regular.ttf`    → OG kicker/footer

## CLS note

`app/fonts.css` ships a **size-adjusted fallback** (`@font-face` over a system face with
`ascent-override`/`size-adjust`) so swapping the real font in causes no layout shift
(the next/font CLS technique, done in plain CSS). After adding the real binaries,
re-measure with the actual metrics and tune the override values if needed.
