# URL Inventory Specification — Phase 0 Deliverable (§3A)

**Status:** HARNESS BUILT & TESTED. Real `data/url-inventory.csv` **NOT YET PRODUCED** — requires live-site access (crawl + GSC export + server logs) per REBUILD_PLAN.md §3A.

This document specifies **what** the real inventory must contain, **how** to produce it, and confirms the harness asserts 100% coverage once the data lands.

---

## 1. What the Inventory Is

A **complete, authoritative list** of every URL the live site (`www.lostmodesty.com`) currently serves or redirects, covering:

1. **Indexed/ranking URLs** — every page Google has indexed (GSC export).
2. **Crawlable URLs** — everything reachable from the homepage + sitemap (Screaming Frog / Sitebulb crawl).
3. **Orphan-but-live URLs** — pages that rank or receive backlinks but are no longer linked internally (90-day server access logs, filtered by HTTP 200/301).

The inventory is the **input** to:
- The redirect map (`data/redirect-map.json`, built via `npm run redirect:build`).
- The redirect audit (`tests/redirect-audit.test.mjs`), which asserts every inventoried URL resolves exactly as specified (200 or 301, single-hop, no loops).
- Checkpoint 0's "redirect map covers 100% of inventoried URLs" gate (REBUILD §4 Phase 0).

**Why all three sources?** A crawl alone misses orphan pages that still rank and drive traffic. GSC alone misses newly-published or low-impression pages. Logs catch real reader + bot behavior the other two miss.

---

## 2. Schema — `data/url-inventory.csv`

Four columns (header row required):

```csv
old_url,new_url,expected_status,source
```

| Column | Description | Example | Notes |
|--------|-------------|---------|-------|
| `old_url` | Path as currently indexed/backlinked (preserve trailing-slash, case, query-string exactly per §3A) | `/john-doe/my-first-post` | Must be **exactly** what Google/logs/external-links show — trailing-slash mismatch = silent duplicate. Root-relative path only (no scheme/host). |
| `new_url` | Target path in the rebuilt app | `/john-doe/my-first-post` | Default: **identical to `old_url`** (zero redirects is best). Only differs if the path **must** change (e.g., dated permalink → author/slug). |
| `expected_status` | HTTP status the router must return | `200` or `301` | `200` = identity (old_url = new_url). `301` = permanent redirect. **Never `302`** (temporary redirects lose link equity). |
| `source` | Provenance | `crawl`, `gsc`, or `logs` | Traceability — orphan-but-ranking URLs are `logs` or `gsc` but not `crawl`. |

### Rules

- **Trailing slashes:** if the live site serves `/blog` and `/blog/` as distinct URLs (or one 301s to the other), **both** must appear in the inventory with their actual status. Mismatch here is the #1 cause of silent redirect chains.
- **Case sensitivity:** preserve exactly. If the live site serves `/John-Doe/Post` and `/john-doe/post` as different URLs (bad, but possible), both must be inventoried.
- **Query strings:** exclude pagination (`?page=2` — handled separately as a pattern), but include if part of the canonical URL (e.g., `?s=search-term` if search-result pages are indexed).
- **Fragments (`#`)**: omit (never part of the HTTP request).
- **No duplicates:** each `old_url` appears exactly once. The redirect-map builder will fail on duplicates.

---

## 3. How to Produce It (Procedure)

### 3.1 Crawl (Screaming Frog or Sitebulb)

**Tool:** [Screaming Frog SEO Spider](https://www.screamingfrogseoseo.com/) (free up to 500 URLs; paid license for 1M+ URLs at this scale) or [Sitebulb](https://sitebulb.com/).

**Target:** `https://www.lostmodesty.com/`

**Config:**
- Crawl mode: **Spider** (follow internal links).
- Respect `robots.txt`: **Yes** (only crawl what Google crawls).
- Follow redirects: **Yes**, but log each hop separately (the audit needs to see chains).
- User-agent: **Googlebot** (to match what Google sees).

**Export:**
1. All **Internal HTML** URLs (status 200).
2. All **Redirects** (status 301/302/307/308) — both source and target.
3. All **paginated URLs** (if pagination is `?page=N` or `/page/N/`, export those too).

**Output format:** CSV with columns `Address`, `Status Code`. Map these to the inventory schema:
- `old_url` = `Address` (strip `https://www.lostmodesty.com` prefix; keep the path).
- `new_url` = `Address` for 200s; follow the redirect chain to the final target for 301s.
- `expected_status` = `200` if `old_url` = `new_url`; `301` if they differ.
- `source` = `crawl`.

### 3.2 Google Search Console Export

**Where:** [Google Search Console](https://search.google.com/search-console) → **Coverage** → **Valid** → Export.

**What it catches:** Pages Google has **indexed and is serving in search results** — including orphans no longer linked from the site but still ranking (the crawl misses these).

**Export:**
- All **Indexed** URLs (status = "Valid").
- Filter: last 90 days (to exclude genuinely-dead pages Google hasn't purged yet).

**Output format:** GSC CSV has a `URL` column. Map to inventory schema:
- `old_url` = `URL` (strip scheme/host).
- `new_url` = same (assume identity unless you know a path must change).
- `expected_status` = `200`.
- `source` = `gsc`.

**Dedupe against crawl:** if a URL appears in both crawl and GSC, keep the crawl entry (it has the real status; GSC may lag).

### 3.3 Server Access Logs (90-day, HTTP 200/301 only)

**Where:** The live site's web server access logs (Nginx/Apache/CDN logs).

**Why:** Catches URLs that receive **real reader or bot traffic** but are orphaned (no internal links, not in the sitemap). Example: an old article permalink that still gets backlinks and ranks but was removed from the category index.

**Filter:**
- Status: `200` or `301` only (exclude 404s, 500s — those are genuinely broken).
- Date range: last 90 days (balances freshness vs noise).
- User-agent: exclude bots that don't represent real traffic (scrapers, validators) — keep Googlebot, Bingbot, social-media crawlers (Facebook, Twitter link-preview bots), and all human UAs.
- Path: exclude static assets (`/wp-content/uploads/`, `/static/`, `.jpg`, `.png`, `.css`, `.js`) — only HTML pages.

**Export:** CSV with columns `path`, `status`. Map to inventory schema:
- `old_url` = `path`.
- `new_url` = follow to final target if `status` = 301; same as `old_url` if 200.
- `expected_status` = `status`.
- `source` = `logs`.

**Dedupe:** if a URL already appeared in crawl or GSC, keep the existing entry (crawl/GSC are authoritative; logs just fill gaps).

### 3.4 Merge + Dedupe

Combine the three CSVs:
1. Start with the crawl (it has the most complete status + redirect data).
2. Append GSC URLs not in the crawl (orphans).
3. Append log URLs not in crawl or GSC (traffic-driven orphans).
4. Sort by `old_url` (makes the audit output readable).
5. Assert **no duplicate `old_url`** entries (each path appears exactly once).

**Output:** `data/url-inventory.csv` in this repo's `data/` directory.

---

## 4. URL Classes (REBUILD §3A Canonical Pattern Documentation)

Once the real inventory lands, document the **canonical URL pattern** for each type. These are the route matchers in `migration.config.mjs` (already stubbed):

| Class | Pattern | Example | Notes |
|-------|---------|---------|-------|
| **Homepage** | `/` or `/blog/` | `/` | Confirm which is canonical (both redirect to one). |
| **Article** | `/{author}/{slug}` OR `/{year}/{month}/{slug}` | `/john-doe/my-first-post` | **UNRESOLVED** — REBUILD §1#1 and FRONTEND §3.1 cite both. The real inventory will show which pattern(s) actually exist. If both are live (old dated + new author/slug), the older dated URLs must 301 to the new pattern. |
| **Category index** | `/category/{slug}` | `/category/love` | Paginated? (`?page=2` or `/category/love/page/2/`) |
| **Tag index** | `/tag/{slug}` | `/tag/poetry` | Paginated? |
| **Author archive** | `/author/{name}` | `/author/john-doe` | Paginated? |
| **Search results** | `/search?q=...` or `/?s=...` | Confirm if indexed. |
| **RSS/Atom** | `/feed`, `/rss`, `/atom` | All three, or just one? |
| **Sitemap** | `/sitemap.xml`, `/sitemap_index.xml` | Confirm if there are child sitemaps (date-based shards). |
| **Static pages** | `/about`, `/contact`, etc. | List explicitly. |

**Trailing-slash convention:** Does the live site always append `/` to directory-like paths (`/category/love/` vs `/category/love`)? Or never? Or inconsistent? The rebuilt router must match exactly.

**www vs non-www:** Does `www.lostmodesty.com` 301 to `lostmodesty.com` (or vice versa)? The Next.js middleware must reproduce this.

---

## 5. Verification (Harness Already Built)

Once `data/url-inventory.csv` exists, run:

```bash
npm run redirect:build    # generates data/redirect-map.json from the CSV
npm test                  # runs tests/redirect-audit.test.mjs against the map
```

**What the audit asserts** (per REBUILD §3B):
1. **Zero redirect chains** — every `old_url` reaches its `new_url` in exactly one hop (no `A → B → C`).
2. **Zero redirect loops** — no `A → B → A`.
3. **Status policy** — every path change is a `301` (permanent); identity mappings are `200`.
4. **100% coverage** — every URL in the inventory has an entry in the redirect map.

**Current state:** The audit runs green against the **sample** inventory (`data/url-inventory.sample.csv`, 9 URLs). This proves the harness is correct. It will fail if run against a missing or malformed real inventory — that's the gate.

---

## 6. Checkpoint 0 Blocker Status

**CP0 criterion (REBUILD §4 Phase 0):**
> "Redirect map built from URL inventory and audited: zero chains/loops, 100% coverage, status-policy clean."

**Current status:**
- ✅ Redirect-map builder exists (`scripts/build-redirect-map.mjs`).
- ✅ Audit exists (`tests/redirect-audit.test.mjs`).
- ✅ Sample data proves the harness works end-to-end.
- ⛔ **Real `data/url-inventory.csv` does NOT exist** — requires live-site access (crawl + GSC + logs), which this build environment cannot reach.

**Unblocking CP0:** Produce the real inventory via the procedure above (§3), place it at `data/url-inventory.csv`, re-run `npm run redirect:build && npm test`. If the audit is green, this blocker clears.

---

## 7. Post-Inventory Next Steps

Once the real inventory exists and the audit passes:

1. **Confirm article URL pattern** — if both `/{author}/{slug}` and `/{year}/{month}/{slug}` appear, decide which is canonical and 301 the other pattern to it. Update `migration.config.mjs` route order accordingly (dated pattern must match before the generic `/{author}/{slug}` or it will false-positive).
2. **Document trailing-slash + www behavior** in `migration.config.mjs` comments.
3. **Update `ROUTE_RULES` matcher precedence** if the real inventory reveals reserved paths that overlap the generic article pattern (e.g., `/search/`, `/archives/` must match before `/{author}/{slug}`).
4. **Commit `data/url-inventory.csv` to the repo** — it's the source of truth for the redirect map and must version-control with the code.
5. **Set up the §3D traffic-shadowing infrastructure** (read-replica + mirror real traffic to the new app, diff responses) — this is the next Phase 0 gate after the redirect audit passes.

---

## Appendix: Why This Isn't "Just a Crawl"

A naive "crawl the site, redirect everything" rebuild at 1M readers routinely loses 30–40% of organic traffic. Here's why:

- **The crawl misses orphan pages.** An article removed from the category index but still ranking on page 1 for a high-value keyword won't appear in a crawl — but it's still getting traffic and backlinks. Without it in the inventory, you ship a 404 for a revenue-driving URL.
- **GSC lags reality.** Google Search Console shows what was indexed weeks ago; a newly-published article ranking today might not appear in GSC yet. The crawl + logs catch it.
- **Redirect chains bleed PageRank and CWV.** Every extra hop costs ~10–15% of link equity (per Google's own guidance) and adds latency (CLS/LCP regression). A 200 on the first try is the only safe redirect.
- **Case/trailing-slash mismatches cause silent duplication.** If the live site serves `/Blog` and `/blog/` as separate URLs (or one 301s to the other), but you assume they're identical, you'll create a redirect chain or a duplicate-content penalty.

This three-source inventory + audit is how you protect 1M readers' worth of organic equity.
