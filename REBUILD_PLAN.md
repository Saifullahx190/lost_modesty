# Rebuild Plan — Live Blog Platform (1M Monthly Readers)

## Context

This is **not a greenfield MVP**. It is a zero-downtime re-platform of a live publication serving ~1M monthly readers, with existing SEO rankings, backlinks, and indexed URLs that represent real, hard-won organic-traffic equity. A naive "just rewrite it" approach at this scale routinely destroys 30–40% of organic traffic through broken URLs, lost SEO signals, and unvalidated regressions. The entire plan is therefore sequenced so that **the highest-traffic-risk surfaces migrate first and are validated under real load before anything else follows**, and so that every old URL continues to resolve.

**Locked decisions (from stakeholder):**
- **Target stack:** Next.js (React, SSR/SSG hybrid rendering).
- **SEO/URLs:** Existing URLs, slugs, rankings, and backlinks must be preserved **exactly** (200 or 301, no chains, no soft-404s).
- **Migration strategy:** Incremental **strangler-fig** — new platform runs behind the live site; routes are migrated piece-by-piece with the old system as fallback.

**Scope:** Re-implement all **11 existing features at parity**. Nothing is cut. "Never build" is not a valid category. Max **3 features** get "rebuild first" priority; everything else is explicitly sequenced into later phases.

---

## 1. Feature Classification (all 11 features)

Ranking principle: **what breaks existing organic traffic or SEO equity if it regresses?** Reader-facing, indexed, or link-target surfaces rank highest. Logged-in convenience features rank lower because they don't feed Google or backlinks.

### 🔴 REBUILD FIRST (max 3 — traffic/SEO load-bearing, must work day one)

| # | Feature | Why it's first | URL / SEO / habit risk flag |
|---|---------|----------------|------------------------------|
| 1 | **Multi-author blogging (article pages)** | Article pages **are the product**. They are ~90%+ of indexed URLs and the destination of essentially all backlinks and organic search traffic. Any regression here is a direct revenue/traffic event. | 🚩 **HIGHEST.** Every `/{author}/{slug}` or `/{year}/{month}/{slug}` URL must resolve byte-for-byte or 301 cleanly. Author attribution, canonical tags, structured data (Article/NewsArticle schema), OpenGraph, and `<title>`/meta must be reproduced exactly. Author archive pages (`/author/{name}`) are also indexed. |
| 2 | **Article category system (taxonomy/index pages)** | Category/tag index pages are major indexed landing pages and primary internal-link hubs that distribute PageRank to articles. They also drive reader navigation habits. | 🚩 **HIGH.** `/category/{slug}` and tag URLs are indexed and backlinked. Pagination URLs (`?page=2` / `/page/2`) are crawled — preserve the exact pagination scheme or 301 it. Breaking internal linking here silently bleeds rankings across the whole site. |
| 3 | **User registration/login (auth/session)** | Auth is the **gate** for every logged-in feature (dashboard, bookmarks, comments-as-user, editor, notifications). It is retention/revenue-critical and a day-one hard dependency: nothing else can be validated for real users until sessions work. Account lockout = mass churn + support storm. | 🚩 **MEDIUM-SEO / HIGH-retention.** Login pages are typically `noindex`, so low direct SEO risk — but **session/cookie domain, OAuth callback URLs, and password-hash compatibility** must carry over or every existing user is locked out. Email/identity continuity is mandatory. |

> **Why these three and not comments:** Comments are reader-facing and SEO-relevant, but a logged-out reader still gets the full article + indexed content without them. Articles, categories, and auth are the irreducible day-one core. Comments lead the **immediately following** wave.

### 🟠 REBUILD AFTER (important, fast second wave)

| # | Feature | Why second (not first) | URL / SEO / habit risk flag |
|---|---------|------------------------|------------------------------|
| 4 | **Comment system** | Reader-facing and SEO-relevant (comment text is indexed; comment count is a trust signal), but the article renders and ranks without it. Highest-risk item in this tier — gets migrated at the **front** of wave 2. | 🚩 **HIGH.** Comments are tied to **old post IDs and old user IDs**. If the new schema re-keys posts or users, every comment must be re-mapped or threads detach from articles / nest wrong. Comment permalinks/anchors (`#comment-12345`) may be backlinked — preserve anchor IDs. Avoid jarring reader-habit changes (sort order, threading). |
| 5 | **User dashboard** | Logged-in landing surface; high retention value, drives daily-active habit. Not indexed, so zero SEO risk — can follow auth closely. | 🚩 LOW SEO. `noindex`. Risk is habit/retention only: preserve entry URL and the "what greets me when I log in" layout. |
| 6 | **Post bookmarking** | Retention feature with direct migration risk: bookmarks **reference old post slugs/IDs**. Must move in lockstep with the article migration's slug map. | 🚩 **MEDIUM.** If bookmarks store slugs and slugs change, every saved bookmark 404s — a visible, trust-eroding break for the most loyal readers. Re-point bookmarks at canonical post IDs via the same redirect/slug map built for feature #1. |
| 7 | **Blog-writing panel (editor)** | Author-facing, **not indexed**, used by a small set of authors. Critical to the business but not to *reader* traffic, so it follows the read path. Its **output** (article HTML/markdown) must round-trip losslessly into the parity article renderer. | 🚩 LOW direct SEO, but 🚩 **content-integrity risk**: editor output must produce identical canonical/meta/structured-data to feature #1, or new posts silently under-perform in search. |

### 🟡 DEFER / SIMPLIFY for V1 (launch stripped-down or temporarily route to old system)

| # | Feature | Why deferrable | Risk flag |
|---|---------|----------------|-----------|
| 8 | **Notification system (in-app)** | Engagement nicety, not indexed, not a hard dependency for reading or publishing. Can launch as a minimal "unread count + list" and enrich later, or read from the old service via API during transition. | 🚩 NONE SEO. Decouple early via an event bus so it can be rebuilt without touching core paths. |
| 9 | **Email notification** | Important for re-engagement but **not on the reader's critical path** and risky to rush (deliverability, sender reputation). V1 can keep firing from the existing email service while the new event pipeline matures. | 🚩 NONE SEO. 🚩 Deliverability risk if rushed — defer deliberately, don't half-build. |
| 10 | **User profile (public + private)** | Mixed: **public author profiles may be indexed** (`/author/{name}` / `/u/{name}`) and are covered by feature #1's author-page handling. The *editable private profile UI* is `noindex` and can ship simplified (avatar, bio, password) with advanced settings following. | 🚩 SPLIT: public author page = handle under #1 (indexed); private settings = defer/simplify (not indexed). |
| 11 | **Activity history** | Lowest reader/SEO stakes. `noindex`, logged-in-only, derivable from existing event data. Launch as a minimal recent-activity list or backfill from the old DB; enrich post-cutover. | 🚩 NONE SEO. Pure convenience surface. |

**Summary:** Rebuild-first = {1 Articles, 2 Categories, 3 Auth}. Rebuild-after = {4 Comments, 5 Dashboard, 6 Bookmarks, 7 Editor}. Defer/simplify = {8 In-app notifications, 9 Email, 10 Private profile UI, 11 Activity history}. **All 11 are scheduled; none dropped.**

---

## 2. Migration Strategy — Recommendation

### Recommendation: **Incremental strangler-fig replacement** (confirmed by stakeholder). Reject big-bang.

**Why strangler-fig wins at this scale:**

- **The risk split demands it.** The traffic-critical surfaces (articles, categories) are *read-heavy and SEO-load-bearing*; the rest are logged-in convenience. A strangler-fig lets us migrate and validate the read path **first and in isolation**, route by route, with the old system as an instant fallback — instead of betting 1M readers on a single switch.
- **Blast radius is bounded.** A reverse proxy / edge router (e.g., Vercel/Next.js middleware, Cloudflare, or nginx) sits in front. Each route flips to the new app only after it passes a traffic-safety checkpoint. A regression affects one route, not the whole site, and rolls back by flipping that route back to old origin.
- **SEO continuity is provable before commitment.** We can shadow real traffic and diff rendered HTML/meta/structured-data against the live site **before** Google ever sees the new output.
- **Big-bang is disqualified** here: a single DNS/origin cutover means every URL, redirect, canonical tag, and session migrates atomically with no incremental validation. At 1M readers a missed redirect class or a botched canonical is a business-threatening, multi-week ranking-recovery event. The only thing big-bang buys is engineering convenience — the wrong thing to optimize.

**Architecture during transition:**

```
                 ┌─────────────────────────────┐
   Readers ─────▶│  Edge router / middleware     │
                 │  (per-route migration switch) │
                 └──────────┬───────────┬────────┘
                   migrated │           │ not-yet-migrated
                            ▼           ▼
                  ┌──────────────┐  ┌──────────────┐
                  │ NEW Next.js   │  │ OLD platform │
                  │ (SSR/SSG)     │  │ (fallback)   │
                  └──────┬────────┘  └──────┬───────┘
                         └────────┬─────────┘
                       Shared/synced data layer
                  (read-replica + dual-write or CDC)
```

- **Data:** Old DB remains source of truth at first. New app reads via a **read-replica** (zero added load on the live primary). Writes from new features go through **dual-write or change-data-capture (CDC)** so both systems stay consistent until the new DB becomes primary in a late phase.
- **Rendering:** Articles/categories built as **SSG/ISR** (static + incremental revalidation) for fastest LCP and crawl stability; auth/dashboard/editor as **SSR**. This hybrid is the single biggest SEO lever and is why Next.js was chosen.

---

## 3. Technical Pre-Flight Checklist (answer BEFORE writing feature code)

No feature code ships until these are answered and the artifacts exist. This is the gate.

### A. URL / slug preservation
- [ ] **Full URL inventory exported.** Crawl the live site (Screaming Frog / Sitebulp) **and** pull top URLs from Google Search Console + server access logs (90 days). The crawl misses orphan-but-ranking pages; logs + GSC catch them.
- [ ] **Canonical URL pattern documented** for every type: article, author archive, category, tag, paginated index, home, RSS/feed, sitemap, AMP (if any), search results.
- [ ] **Slug source of truth identified.** Are slugs stable IDs or mutable titles? Decide the immutable key (post ID) that bookmarks/comments/redirects all reference.
- [ ] **Trailing-slash, case, and www/non-www behavior** of the current site documented and reproduced (mismatch = duplicate-content + redirect chains).

### B. Redirect strategy
- [ ] **1:1 redirect map** built from the URL inventory: old URL → new URL. Default to **identical paths** (zero redirects is best). Where a path must change, **301 (permanent)**, never 302.
- [ ] **No redirect chains and no redirect loops** — every old URL reaches its final target in exactly one hop. Automated test asserts this against the full inventory.
- [ ] **Catch-all + legacy patterns** handled: old dated permalinks, ID-based URLs, feed URLs, image/asset paths, query-string variants.
- [ ] **404 vs 410 policy** for genuinely dead URLs (rare — prefer redirect to nearest relevant page over a 404).

### C. SEO signal preservation
- [ ] **`<title>`, meta description, canonical, robots, hreflang** reproduced per page type and **diffed** against live output.
- [ ] **Structured data** (Article/NewsArticle/BreadcrumbList/Person) reproduced and validated (Rich Results Test).
- [ ] **OpenGraph / Twitter cards** preserved (social re-shares and CTR).
- [ ] **XML sitemaps + `robots.txt`** regenerated with identical/expanded coverage; submitted in GSC at cutover.
- [ ] **Internal linking graph** preserved — category/tag hubs and related-post links carry the same PageRank distribution.
- [ ] **Core Web Vitals baseline captured now** (LCP/CLS/INP) so the rebuild must **match or beat** it, not regress.
- [ ] **RSS/Atom feed URLs and format** preserved (syndication + email-digest dependencies).

### D. Read-replica / traffic-shadowing strategy for testing at scale
- [ ] **Read-replica provisioned** so the new app reads production data with **zero added load on the live primary.**
- [ ] **Traffic shadowing / mirroring** configured: mirror a % of real production read traffic to the new app, **discard its responses** (read-only, no user impact), and **diff rendered HTML + status + meta** against the live response. This is how we validate at 1M-reader scale *before* serving a single real reader.
- [ ] **Synthetic + canary plan:** after shadow-diffs pass, serve the new route to 1% → 5% → 25% → 100% of real traffic with automated rollback triggers.
- [ ] **Observability before cutover:** RUM (real-user Core Web Vitals), per-route error rate, 4xx/5xx alerting, and a **GSC coverage/impressions dashboard** watched daily through each phase.
- [ ] **Rollback runbook** per route: one switch flips the route back to old origin in seconds.

### E. Data & auth continuity
- [ ] **Password hash scheme compatibility** confirmed (re-hash on next login if algorithms differ) so **no user is forced to reset**.
- [ ] **Session/cookie domain + OAuth callback URLs** preserved so existing logged-in users aren't ejected at cutover.
- [ ] **Stable entity IDs** (post ID, user ID, comment ID) carried across so comments/bookmarks/activity don't detach.

---

## 4. Phased Build Order — with a Traffic-Safety Checkpoint gating each phase

**Each phase ends with a checkpoint that MUST pass before the next phase starts.** A failed checkpoint = fix or roll back, do not proceed.

### Phase 0 — Pre-flight & scaffolding (no reader-facing change)
- Stand up Next.js app, edge router in front of live site (initially passing 100% to OLD), read-replica, shadow-traffic pipeline, observability + GSC dashboards.
- Produce all Section 3 artifacts: URL inventory, redirect map, SEO baseline, CWV baseline.
- **✅ Checkpoint 0:** Redirect map covers 100% of inventoried URLs with zero chains (automated test green). Shadow pipeline is mirroring real traffic and producing HTML diffs. Rollback switch verified. **Live site untouched, 0% traffic on new app.**

### Phase 1 — Read path: Articles + Categories *(rebuild-first #1, #2)*
- Build article + category/tag + author-archive + pagination as SSG/ISR from the read-replica. Reproduce URLs, canonical, structured data, meta, internal links exactly.
- Validate via **shadow diff** against live, then canary 1%→5%→25%→100% per route.
- **✅ Checkpoint 1 (the big one):** Shadow HTML/meta/structured-data diff clean across the top-traffic URL set. All article/category URLs resolve 200/301, no chains. CWV ≥ baseline. At 100% canary for 48–72h: GSC impressions/coverage flat-or-up, error rate nominal, organic sessions stable. **Only now is the highest-traffic-risk surface proven.**

### Phase 2 — Auth + session *(rebuild-first #3)*
- Migrate registration/login/session with hash + cookie + OAuth-callback continuity. Existing users log in with no reset.
- **✅ Checkpoint 2:** Existing-user login success rate matches old system; no spike in resets/lockouts/support tickets; session persists across old/new routes during transition. Login pages remain `noindex`.

### Phase 3 — Comments (front of wave 2, highest migration risk) *(rebuild-after #4)*
- Migrate comments keyed to **stable post/user IDs**; preserve `#comment-{id}` anchors, threading, sort order. Backfill + dual-write so no comment is lost mid-transition.
- **✅ Checkpoint 3:** 100% of comments map to correct articles; counts match; permalinks/anchors resolve; indexed comment text retained. Spot-check high-comment articles.

### Phase 4 — Dashboard + Bookmarks *(rebuild-after #5, #6)*
- Logged-in dashboard at preserved entry URL. **Bookmarks re-pointed at canonical post IDs via the Phase-1 slug/redirect map** so no saved item 404s.
- **✅ Checkpoint 4:** Every existing bookmark resolves to its live article; dashboard parity verified for a sample of real accounts; retention metrics stable.

### Phase 5 — Editor *(rebuild-after #7)*
- Author writing panel whose output **round-trips losslessly** into the Phase-1 article renderer (identical canonical/meta/structured-data for new posts). Authors cut over with old editor as fallback.
- **✅ Checkpoint 5:** A post created in the new editor renders byte-equivalent SEO output to a Phase-1 article; authors confirm parity; publish→live pipeline validated.

### Phase 6 — Notifications, Email, Private profile, Activity history *(defer/simplify #8–#11)*
- Ship minimal in-app notifications + activity history (or read from old service via API); **keep email firing from the existing service** until the new event pipeline is proven, then cut over carefully to protect deliverability. Private profile settings ship simplified, enrich post-cutover.
- **✅ Checkpoint 6:** Notifications/activity render without errors; email deliverability + open rates hold steady after cutover (sender reputation intact); profile edits persist.

### Phase 7 — Data primary cutover & decommission
- Promote new DB to primary (or finalize CDC direction), retire dual-write, then **decommission the old platform only after** a full GSC + traffic stability window.
- **✅ Checkpoint 7 (final):** 30-day organic traffic, rankings, and CWV at-or-above pre-rebuild baseline across all URL classes. Redirect map still 100% green. Old system idle for a full window with zero fallback hits before teardown.

---

## Guiding Principle

At 1M readers, **the order of migration matters more than the framework choice.** Every phase proves the riskiest surface is safe *before* exposing the next one, and at no point does an old URL stop resolving. Feature velocity is optimized second; protecting existing traffic and SEO equity is optimized first.

## Verification (how to prove the rebuild is safe at each step)

1. **Redirect/URL audit:** automated test runs the full URL inventory through the live router asserting single-hop 200/301 and zero loops; re-run every phase.
2. **Shadow HTML diff:** mirrored real-traffic responses diffed against live for status, `<title>`, meta, canonical, structured data — must be clean before any canary.
3. **Canary + auto-rollback:** 1%→5%→25%→100% with error-rate/CWV rollback triggers per route.
4. **SEO monitoring:** daily GSC coverage + impressions + average-position dashboard through every phase; organic-sessions analytics overlay.
5. **Core Web Vitals:** RUM must match-or-beat the captured baseline before a route reaches 100%.
6. **Auth/data integrity:** login-success-rate parity, bookmark-resolution test, comment-to-article mapping test run at their respective checkpoints.
