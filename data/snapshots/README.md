# Shadow-parity snapshots

Saved HTML used by `scripts/parity-check.mjs` to assert the NEW build reproduces the
OLD site's SEO signals **offline** — no production access, no deploy (REBUILD
Verification #2). Same diff rules as the live `scripts/shadow-diff.mjs`
(`scripts/lib/seo-extract.mjs`), so a green parity check here predicts a green shadow
diff once origins are reachable.

```
data/snapshots/
  old/<name>.html   ← saved from the real live site — the contract to preserve
  new/<name>.html   ← saved from the new build — must match old/<name>.html's SEO
```

Pair files by **identical basename** (e.g. `old/article-raat.html` ↔ `new/article-raat.html`).
These HTML files are **not committed** (page weight + content licensing); produce them
at audit time.

## Capturing OLD (the live contract)

```bash
# one per representative URL from the §3A inventory (article, category, tag, author, home)
curl -sL https://www.lostmodesty.com/lostmodesty/raat-baarotar-por -o data/snapshots/old/article-raat.html
```

## Capturing NEW (the rebuilt page)

Either from the static prerender after `npm run build`:

```bash
cp ".next/server/app/lostmodesty/raat-baarotar-por.html" data/snapshots/new/article-raat.html
```

…or from a running server (`npm run start`):

```bash
curl -sL http://localhost:3000/lostmodesty/raat-baarotar-por -o data/snapshots/new/article-raat.html
```

## Run

```bash
npm run parity        # node scripts/parity-check.mjs
```

What it compares (per pair): `<title>`, meta description, canonical (by path, so the
host differing between live and staging is not a false diff), robots, og:title/type,
exactly-one `<h1>` and its text, the `<h2>/<h3>` outline, and JSON-LD (`@type` set +
the NewsArticle headline/date/author). The comparator itself is unit-tested in
`tests/parity.test.mjs` (runs in `npm test`, no snapshots needed).
