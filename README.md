# লস্ট মডেস্টি (Lost Modesty) — rebuild (new app)

Strangler-fig **new** Next.js app per `REBUILD_PLAN.md` + `FRONTEND_DESIGN_PLAN.md`.
Confirmed: new repo in this directory, behind an edge router with the OLD live site
as fallback origin. **Phase 0 in progress.**

## Getting started (local setup)

**Prerequisites:** [Node.js](https://nodejs.org) **≥ 20** (developed on v24) and npm
(ships with Node). No database or external service is required — all content, users,
comments and bookmarks are **in-memory sample stores**, so the app runs fully offline.
Anything you create is wiped on restart.

```bash
# 1. Clone
git clone https://github.com/Saifullahx190/lost_modesty.git
cd lost_modesty

# 2. Install dependencies
npm install

# 3. (optional) Generate build artifacts that are git-ignored
#    tokens.generated.css + the sample redirect map are regenerated from source.
node scripts/build-tokens-css.mjs
INVENTORY=data/url-inventory.sample.csv node scripts/build-redirect-map.mjs

# 4. Run the dev server → http://localhost:3000
npm run dev
```

Other common scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server at `http://localhost:3000`. |
| `npm run build` | SSG-prerender every article/category/tag/author page + feed/sitemap/robots. |
| `npm start` | Serve the production build (after `npm run build`). |
| `npm test` | Run the offline unit tests (migration, parity, editor, activity, notifications). |
| `npm run lint` | Next.js / ESLint checks. |

**Environment:** none required to run locally. To override the canonical origin used
in SEO/OG/sitemap URLs, set `NEXT_PUBLIC_SITE_URL` (see `.env.example` if present).

> This is a **strangler-fig rebuild**: an edge router normally proxies traffic to the
> *old* live site, and the new route classes are staged at `canaryPercent: 0`. For a
> full hands-on walkthrough — demo login credentials, every route URL, and a
> click-through checklist — see **[`LOCAL_TESTING.md`](./LOCAL_TESTING.md)**.

## Phase status
- **Phase 0 — pre-flight & scaffolding:** built (code) — see CP0 evidence below.
  CP0 is **NOT yet green**: blocked on access-gated artifacts. (Design conflict B1
  **resolved** 2026-06-29 — token split, see `design/CHANGELOG.md`.)
- **Phase 1 — read path (Articles + Categories), milestone M1:** **built (code)**
  against the local sample content (`lib/content/posts.ts`) standing in for the
  read-replica. Implemented and SSG-prerendering via `next build`:
  - Routes: `/` + `/blog` (index), `/[author]/[slug]` (article), `/category/[slug]`,
    `/tag/[slug]`, `/author/[name]` — all with the `?page=N` scheme preserved
    (REBUILD §1#2); `sitemap.xml`, `robots.txt`, `/feed.xml` (RSS), branded `not-found`.
  - SEO per page type: canonical, OG/Twitter, NewsArticle + BreadcrumbList + Person
    JSON-LD, sitemap/robots/RSS (REBUILD §3C) — built by `lib/seo.ts`.
  - Read-path components (FRONTEND §2.4): Header/MobileNav, ThemeToggle, Footer,
    PostCard/PostGrid, SearchInput (instant client filter), Pagination, TagList,
    ArticleHeader, ArticleBody (structured blocks → semantic h2/h3 + footnote refs),
    Footnotes (accessible disclosure), SeriesNav, Logo (marigold motif).
  - **CP1 is NOT green / not exposed to readers:** the edge router keeps the Phase-1
    route classes at `canaryPercent: 0` (→ OLD). These are the NEW implementations
    staged behind the strangler-fig; canary ramp + shadow-diff (access-gated) gate CP1.
  - **Production-hardening (added on top of the read path, all offline-verified):**
    - **Dynamic OG images** — branded `next/og` cards via the `opengraph-image` file
      convention (root cascades to all routes; article overrides). Prerendered to real
      PNGs at build, single `og:image`/`twitter:image`, no runtime cost. Bengali glyphs
      need the vendored OG ttf (`public/fonts/README.md`) — graceful Latin fallback
      until then, never blocks the build.
    - **Loading states** — CLS-safe skeletons (`components/skeletons/*`) + root
      `loading.tsx` (index shape) and article `loading.tsx`, box-matched to the real
      layouts; shimmer gated under `motion-safe`.
    - **Font loading** — self-hosted `@font-face` (`app/fonts.css`, swap +
      unicode-range Bengali/Latin) with a **metric-adjusted fallback** family wired
      through the token stack so the real-font swap causes no CLS (the `next/font`
      technique in plain CSS; swap to `next/font/local` once woff2 binaries land).
    - **Image pipeline** — single `lib/images.ts` `getCoverImage()`/`coverProps()` seam
      returning src/dims/alt/blur LQIP; all covers route through it. **CDN swap is a
      one-file change** (map src + real thumbhash) — no component edits.
    - **Shadow-parity system** — shared extractor `scripts/lib/seo-extract.mjs` powers
      both the live `npm run shadow:diff` and the **offline** `npm run parity` (compares
      saved OLD vs NEW HTML snapshots: title/meta/canonical-by-path/robots/og/single-h1/
      heading-outline/JSON-LD). Comparator is unit-tested in `npm test` (8 cases).
  - **Still pending in Phase 1** (needs live data/infra): swap sample content for the
    real read-replica/content API (FRONTEND §6.2 working agreement), real cover-image
    CDN origin in `next.config` `remotePatterns`, vendored font binaries
    (`public/fonts/`), real URL-inventory redirect map, and the shadow HTML/meta/JSON-LD
    diff vs live (`shadow:diff`/`parity`) before any canary.
- **Phase 4 — Dashboard + Bookmarks (rebuild-after #5, #6):** dashboard landing
  **built (code)** at the preserved entry URL `/dashboard` (SSR + `noindex`, the
  route the header `UserMenu` links to). Logged-out → `/login?next=/dashboard`
  (return-path round-trip, §3.4); logged-in → greeting + quick links + the
  **সংরক্ষিত লেখা** saved-bookmarks list. Saved items resolve **canonical post id →
  post** through the read-path repo so no saved item can render a broken row
  (REBUILD §4 Checkpoint 4), reuse the index `PostCard`, and carry Journey C's
  **পরের পর্ব** series-resume link. Empty state points back to browsing (§3.4).
  Staged behind the strangler-fig: the `dashboard` route class stays at
  `canaryPercent 0` (→ OLD) until its Phase-4 checkpoint. Bookmark toggle island +
  store (`components/BookmarkButton`, `lib/bookmarks/*`) already wired on the
  article page. **Still pending:** real bookmarks table / auth store (both stand in
  as local sample stores today), and the Phase-4 checkpoint against live accounts.
- **Phase 5 — Editor (rebuild-after #7):** author composer **built (code)** at
  `/editor` (SSR + `noindex`, author-gated — logged-out → `/login?next=/editor`,
  reader → `/dashboard`; linked from the dashboard author quick-links). Title, slug,
  excerpt, category/tags, markdown-lite body (`##`→h2, `>`→quote, `[^n]` footnotes),
  and optional series. **Round-trip fidelity (Checkpoint 5) is structural, not
  disciplined:** the live article route and the editor **preview** both render the
  one shared **`components/ArticleView`**, and both build the post with the one
  `lib/content/draft.mjs` `buildDraftPost` → `Post`, so a published post's
  `<title>`/canonical/**NewsArticle** JSON-LD/semantic headings are byte-equivalent
  to a hand-authored one by construction (REBUILD §6.2 "same rendering path, no
  separate preview renderer"). Publish → `303` to the live `/{author}/{slug}` URL
  (Journey D), served on-demand (dynamicParams/ISR). Verified end-to-end locally
  (gating + publish→render). Draft parsing is unit-tested (`npm test`, 6 cases). The
  sample content store (`lib/content/posts.ts`) is now a `globalThis` singleton so a
  just-published post is visible across Next's action/RSC module split — a stand-in
  concern only; the real read-replica + dual-write store (REBUILD §2) is shared by
  construction. **Still pending:** cover-image upload/CDN (§2.6), the real content
  store, and the Phase-5 checkpoint (author parity sign-off).
- **Phase 6 — Private profile settings (defer/simplify #10):** settings page
  **built (code)** at `/settings` (SSR + `noindex`, logged-out → `/login?next=/settings`;
  linked from the dashboard quick-links for every logged-in user). Simplified per
  REBUILD §1#10: **display name + bio** (`updateProfileAction`) and **password change**
  (`changePasswordAction` — verifies the current password first; a live session alone
  can't reset it). A name change refreshes the JS-readable hint cookie so the header
  `UserMenu` updates without a re-login. Avatar upload waits on the image pipeline
  (§2.6), like the editor cover. Verified end-to-end locally (gating, name/bio persist
  across a reload, wrong-vs-right current password). Two fixes landed here:
  (a) the users store (`lib/auth/users.mjs`) is now a `globalThis` singleton — same
  action/RSC module-split reason as `POSTS`; without it a profile edit (or a brand-new
  registration) wouldn't survive to the next render; (b) the display-hint cookie was
  **double-encoded** (`writeHint` encoded a value Next also encodes), so `readUiHint`
  could never parse it — now stored as raw JSON, repairing the header name for login
  too. Shared `components/Textarea` primitive extracted (editor + settings).
- **Phase 6 — Activity history (defer/simplify #11):** activity page **built (code)**
  at `/activity` (own route class in `migration.config`, SSR + `noindex`, logged-out →
  `/login?next=/activity`; dashboard quick-link). A minimal recent-activity list
  **derived from existing stores — no new event table** (REBUILD §1#11 "derivable from
  existing event data"): the user's comments (→ `#comment-{id}` anchors), bookmarks,
  and — for authors — published posts, merged into one newest-first timeline. The
  merge/ordering core is `lib/activity/merge.mjs` (pure, node-tested, 2 cases); the
  TS wrapper `lib/activity/feed.ts` resolves each event's article through the content
  repo and drops any whose article no longer resolves. The comment + bookmark stores
  were made `globalThis` singletons here (same action/RSC reason as `POSTS`/`users`),
  so a just-posted comment or new bookmark shows up. Verified end-to-end (gating;
  reader feed = comments+bookmarks, no authored posts; author feed adds published
  posts; store-write → feed-query integration).
- **Phase 6 — In-app notifications (defer/simplify #8):** notifications **built (code)**
  at `/notifications` (own route class, SSR + `noindex`, logged-out → `/login?next=…`;
  dashboard link + a header **bell island with an unread-count badge**). The minimal
  "unread count + list" (REBUILD §1#8) is **derived from the comment store — no new
  event table**: you're notified when someone else replies to your comment (`reply`)
  or comments on an article you authored (`comment_on_post`). Pure rules in
  `lib/notifications/derive.mjs` (node-tested, 5 cases); `feed.ts` resolves article +
  actor; the only genuinely new state is a per-user read cursor
  (`lib/notifications/store.mjs`, a `globalThis` singleton). The bell fetches its count
  after mount via a server action (static pages stay static, same seam as
  UserMenu/BookmarkButton); viewing the list marks all read (`MarkSeen` island) so the
  badge clears. Verified end-to-end (gating; reader = 1 reply; author = 3 comments-on-
  posts; empty state; unread count → mark-seen → 0). **Remaining Phase 6:** email (#9)
  deliberately keeps firing from the existing service (REBUILD §4 Phase 6) — a
  deliverability-risk item to cut over deliberately, not rebuild now. With #8–#11 done,
  **Phase 6 is feature-complete** against the local stores.
- **Cross-cutting edge/error states (FRONTEND §3.4):** now fully covered —
  branded 404 (`not-found`), search no-results, cover-image fallback (`PostCard`),
  zero-JS SSR reading, logged-out comment/bookmark CTAs, long-title clamping, and
  (new) the **offline affordance**: `components/OfflineBanner` is a root-layout client
  island that watches `navigator.onLine` + online/offline events and shows a quiet,
  theme-aware, reduced-motion-safe inline banner ("অফলাইন — …") when the connection
  drops, so a tap that won't load isn't a silent dead end; it renders nothing while
  online (SSR-null, no hydration mismatch) and is an `aria-live` region so the state
  change is announced. Verified: keyframe/animation compiled, SSR shows the empty live
  region with no banner text online.
- **Phases 2, 3, 7 (auth, comments, data cutover):**
  auth (`app/login`,`/register`,`/logout`) + comments (article thread) are
  code-staged against the local sample stores; the DB primary cutover is not started —
  each depends on external backends/infra (real auth store, comment DB, DB primary
  cutover) and their own checkpoints.

## Phase 1 — verify locally (zero external access)
```bash
npm install            # next/react/tailwind (already vendored in node_modules)
npm run build          # SSG-prerenders all article/category/tag/author pages + feed/sitemap/robots
npm run dev            # browse the staged new app at http://localhost:3000
```

## Verifiable now (zero-dependency, no install)
```bash
node scripts/build-tokens-css.mjs                 # generate CSS vars from token JSON
node scripts/contrast-check.mjs                   # WCAG gate on tokens  (green; B1 resolved)
INVENTORY=data/url-inventory.sample.csv \
  node scripts/build-redirect-map.mjs             # redirect map + audit (sample)
node --test tests/redirect-audit.test.mjs tests/migration.test.mjs   # 11 tests
```

## Access-gated (need live-site / GSC / infra)
```bash
node scripts/capture-baseline.mjs    # 8 baseline screenshots  (LIVE_INDEX, LIVE_ARTICLE + Playwright)
node scripts/cwv-baseline.mjs        # Core Web Vitals baseline (Lighthouse)
node scripts/shadow-diff.mjs         # shadow HTML/meta/JSON-LD diff (NEW_ORIGIN, OLD_ORIGIN)
```

## ⛔ Open CP0 blockers (see Phase 0 hand-back)
1. ~~**Contrast conflict:** `--color-accent` on `--color-bg` = 2.33:1 (light)~~ ✅
   **RESOLVED 2026-06-29** — token split: marigold `--color-accent` (`#D9A02B`) is
   decorative/logotype-only; new `--color-link` (`#8B6914`/`#E3B24F`) carries link +
   active-nav text; terracotta secondary darkened to `#BC4F30`. Gate green. See
   `design/CHANGELOG.md` (B1 / D7 / D8).
2. **Real §3A/§3B/§3C artifacts** (URL inventory, redirect map vs reality, CWV baseline,
   8 screenshots) require live-site access — pending.
3. **Edge router production verification + real-traffic shadow mirroring** — pending infra.
4. **M0 stakeholder sign-off** — pending.
