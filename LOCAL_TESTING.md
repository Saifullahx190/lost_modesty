# Local Testing Guide — লস্টমডেস্টি (Lost Modesty) rebuild

Manual, hands-on guide for running and exercising this Next.js app on your own
machine (`localhost`). It covers the one non-obvious gotcha (the edge router
proxies everything to the *old* live site by default), how to get the **new**
app on screen, demo login credentials, concrete URLs for every route, and a
click-through checklist per feature.

> This app is a **strangler-fig rebuild**. All content, users, comments,
> bookmarks, etc. are **local in-memory sample stores** (`lib/content/posts.ts`,
> `lib/auth/users.mjs`, …). Nothing here talks to a real database, so it's safe
> to poke at freely. Because the stores are in-memory, **anything you create
> (registrations, published posts, comments, bookmarks) is wiped when you
> restart the dev server.**

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js ≥ 20** | `node --version` (repo is developed on v24). |
| **npm** | Ships with Node. |
| Dependencies | Already vendored in `node_modules/`. If missing, run `npm install`. |

```bash
# from the project root: D:\lost_modesty
npm install     # only needed if node_modules is missing/stale
```

---

## 2. ⚠️ First, make the NEW app visible (important)

The file `middleware.ts` is the **edge router**. Out of the box **every route is
set to `target: OLD, canaryPercent: 0`** (see `migration.config.mjs`), which
means the middleware **rewrites every request to the live old site**
(`https://www.lostmodesty.com`). If you just run `npm run dev` and open
`localhost:3000`, you'll see the **old** site proxied through — *not* the new app
you're trying to test.

Pick **one** of the two options below.

### Option A — Disable the router (recommended for testing the new pages)

Temporarily take the middleware out of the picture so Next serves the new app
directly. Next only treats a file literally named `middleware.ts` (at the repo
root) as middleware, so renaming it disables it:

```bash
# disable
mv middleware.ts middleware.ts.disabled

# ...test the app...

# re-enable when you're done
mv middleware.ts.disabled middleware.ts
```

Restart `npm run dev` after renaming. Now `localhost:3000` renders the real new
app for every route.

### Option B — Force routes to NEW in the config (to also test the router)

Keep the middleware active but flip the route(s) you want to see to `NEW` at
100%. In `migration.config.mjs`, for the rule(s) you're testing set
`target: "NEW"` and `canaryPercent: 100`. The switch is
`servesNew = rule.target === "NEW" && bucket < canaryPercent` — you need **both**.

- To see the whole app on NEW, set every rule (and `DEFAULT_RULE`) to
  `target: "NEW", canaryPercent: 100`.
- Leave `OLD_ORIGIN` alone unless you actually have an old origin to proxy to.

> **Remember to revert** whichever change you make. This is not a git repo, so
> there's no `git checkout` safety net — undo the rename / the config edits by
> hand.

---

## 3. Start the app

```bash
npm run dev
# → http://localhost:3000
```

For a production-like check (this is what actually SSG-prerenders every
article/category/tag/author page + feed/sitemap/robots):

```bash
npm run build     # prerenders all static routes; a good smoke test on its own
npm run start     # serve the production build at http://localhost:3000
```

If `npm run build` completes without errors, the entire read path renders — that
alone catches most breakage.

---

## 4. Demo login credentials

From `lib/auth/users.mjs` (documented sample accounts — **not secrets**):

| Role | Email | Password | Notes |
|---|---|---|---|
| **Author** | `tahsin@lostmodesty.com` | `raat-jaaga-1` | Full author (can use the editor). |
| **Author** | `rumki@lostmodesty.com` | `modhyobortini-2` | Second author. |
| **Reader** | `nila@example.com` | `porano-shohor` | **Migrated** account (legacy password hash) — first login exercises the transparent re-hash path, no forced reset, no visible difference. |

You can also **register** a brand-new reader at `/register` — it persists for the
life of the dev-server process.

**Session cookies** (visible in DevTools → Application → Cookies) once logged in:
`lm_sess` (HttpOnly signed session — the only thing trusted server-side),
`lm_hint` (JS-readable name/role hint for the header UI), and `lm_vid` (visitor
bucket key, set by the middleware if it's enabled).

---

## 5. Route map — what to open

### Read path (Phase 1 — public, no login)

| Page | URL |
|---|---|
| Home / index | `http://localhost:3000/` |
| Blog index | `http://localhost:3000/blog` |
| Index pagination | `http://localhost:3000/blog?page=2` |
| Article | `http://localhost:3000/tahsin/raat-baarotar-por` |
| Article (essay) | `http://localhost:3000/rumki/prem-rajniti-ar-modhyobortini` |
| Series — part 1 | `http://localhost:3000/tahsin/haariye-jawa-shohor-porbo-1` |
| Series — part 2 | `http://localhost:3000/tahsin/haariye-jawa-shohor-porbo-2` |
| Series — final part | `http://localhost:3000/tahsin/haariye-jawa-shohor-shesh-porbo` |
| Category | `/category/golpo` · `/category/probondho` · `/category/love` |
| Tag | `/tag/poetry` · `/tag/raat` · `/tag/smriti` · `/tag/rajniti` · `/tag/dhara` |
| Author | `/author/tahsin` · `/author/rumki` |
| RSS feed | `http://localhost:3000/feed.xml` |
| Sitemap | `http://localhost:3000/sitemap.xml` |
| Robots | `http://localhost:3000/robots.txt` |
| 404 (branded) | `http://localhost:3000/this-does-not-exist` |

### Auth (Phase 2)

| Page | URL |
|---|---|
| Login | `http://localhost:3000/login` |
| Login w/ return path | `http://localhost:3000/login?next=/dashboard` |
| Register | `http://localhost:3000/register` |
| Logout | `http://localhost:3000/logout` |

### Account & authoring (Phases 4–6 — require login, all `noindex`)

| Page | URL | Access |
|---|---|---|
| Dashboard | `/dashboard` | any logged-in user |
| Editor | `/editor` | **authors only** (readers → `/dashboard`) |
| Settings | `/settings` | any logged-in user |
| Activity | `/activity` | any logged-in user |
| Notifications | `/notifications` | any logged-in user |

Logged-out visits to any of these redirect to `/login?next=<that path>`.

---

## 6. Manual test checklist

### 6.1 Read path (no login)

- [ ] `/` and `/blog` render the post grid with real Bengali content and cover images.
- [ ] `?page=2` changes the page; pagination controls preserve the `?page=N` scheme.
- [ ] Open an **article**: single `<h1>`, structured body (`##`→h2, `>`→quote),
      and **footnotes** render as an accessible disclosure.
- [ ] On a **series** article (`haariye-jawa-shohor-*`), the **পরের পর্ব / next
      part** SeriesNav link appears and points to the next part.
- [ ] **Category / Tag / Author** pages list the right posts.
- [ ] **Search** (header search input) filters posts instantly as you type; a
      no-match query shows the branded "no results" state.
- [ ] **Theme toggle** switches light/dark and persists across reloads.
- [ ] **404**: a bad URL shows the branded not-found page.
- [ ] `/feed.xml`, `/sitemap.xml`, `/robots.txt` return valid content.
- [ ] **View source** on an article: `<title>`, canonical, OG/Twitter tags, and
      `NewsArticle` + `BreadcrumbList` + `Person` JSON-LD are present.
- [ ] **Zero-JS check**: disable JavaScript (DevTools) and reload an article —
      it's fully readable (SSR).

### 6.2 Auth

- [ ] `/register` → create a new reader → you land logged in; header shows your name.
- [ ] Restart isn't needed, but note a **server restart wipes** the new account.
- [ ] Log in as **author** `tahsin@lostmodesty.com` / `raat-jaaga-1`.
- [ ] Log in as **migrated reader** `nila@example.com` / `porano-shohor` — succeeds
      with no forced reset (legacy hash silently upgraded).
- [ ] Wrong password is rejected with an inline error.
- [ ] Visit `/dashboard` while logged out → bounced to `/login?next=/dashboard`;
      after logging in you're returned to `/dashboard`.
- [ ] `/logout` clears the session (`lm_sess` / `lm_hint` cookies gone).

### 6.3 Dashboard & bookmarks

- [ ] Logged in, `/dashboard` shows a greeting, quick links, and the **সংরক্ষিত
      লেখা** (saved) list.
- [ ] On an article, the **bookmark toggle** saves/unsaves; the saved item then
      appears on `/dashboard`.
- [ ] A saved item that's part of a series carries the **পরের পর্ব** resume link.
- [ ] Empty saved-list state points back to browsing.

### 6.4 Editor (authors only)

- [ ] As an **author**, `/editor` loads the composer (title, slug, excerpt,
      category/tags, markdown-lite body, optional series).
- [ ] As a **reader**, `/editor` redirects to `/dashboard`.
- [ ] Write a post using markdown-lite (`##` heading, `>` quote, `[^1]` footnote),
      check the **preview**.
- [ ] **Publish** → you're `303`-redirected to the live `/{author}/{slug}` URL and
      the new article renders (same render path as the preview).

### 6.5 Settings (profile)

- [ ] `/settings` shows **display name + bio** and **password change**.
- [ ] Change your **name** → save → reload: the header/UserMenu shows the new name
      without re-login.
- [ ] Change **bio** → save → reload: persists.
- [ ] **Password change** with the *wrong* current password is rejected; with the
      *correct* current password it succeeds.

### 6.6 Activity

- [ ] `/activity` shows a newest-first timeline derived from your existing data.
- [ ] As a **reader**: feed = your comments + bookmarks (no authored posts).
- [ ] As an **author**: feed additionally includes your published posts.
- [ ] Post a comment / add a bookmark, then reload `/activity` — the new event
      appears.

### 6.7 Notifications

- [ ] Header **bell** shows an unread-count badge (fetched after mount).
- [ ] `/notifications` lists notifications: you're notified when someone else
      **replies to your comment** or **comments on an article you authored**.
- [ ] Opening `/notifications` **marks all read** — the bell badge clears.
- [ ] With nothing to show, the empty state renders.

> Tip for 6.6 / 6.7: log in as `tahsin` (author) in one browser and as a reader
> (register or `nila`) in another browser/incognito window, then comment on
> tahsin's article from the reader to generate a notification/activity event.

### 6.8 Edge & error states

- [ ] Cover-image fallback renders when an image is missing.
- [ ] Logged-out comment/bookmark controls show a sign-in CTA.
- [ ] **Offline banner**: in DevTools → Network, set **Offline** — a quiet
      "অফলাইন" banner appears (aria-live); back **Online** it disappears.
- [ ] Very long titles clamp instead of overflowing.

---

## 7. Automated checks (run alongside manual testing)

These need **no external access** and are the fastest way to catch regressions:

```bash
npm test            # node --test: redirect-audit, migration, parity, editor,
                    # activity, notifications suites

npm run build       # full SSG prerender — a strong smoke test on its own

# individual zero-dependency scripts:
node scripts/build-tokens-css.mjs      # generate CSS vars from token JSON
node scripts/contrast-check.mjs        # WCAG contrast gate on design tokens
npm run redirect:audit                 # redirect-map audit

npm run preflight   # tokens:contrast + redirect:build + redirect:audit
```

Optional design-system sandbox (installs Storybook on first run):

```bash
npm run storybook   # component explorer at http://localhost:6006
```

**Access-gated** scripts (`baseline:capture`, `cwv:baseline`, `shadow:diff`)
need the live site / Playwright / Lighthouse and are **not** part of local
manual testing — skip them.

---

## 8. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `localhost:3000` shows the **old live site** | The middleware is proxying to `OLD_ORIGIN`. Do **§2** (disable `middleware.ts` or force `NEW`/100). |
| Logged-in state / new post / comment **disappeared** | Expected — in-memory stores reset on **server restart**. |
| A just-published post 404s | Restart wiped it, or you reverted §2 mid-test and the router sent the URL to OLD. |
| Editor redirects me away | You're logged in as a **reader**; the editor is author-only. Use `tahsin`/`rumki`. |
| Cookies not set / login won't stick | Cookies are `secure` only in production; in dev over `http://localhost` they should set fine — check you're on `localhost`, not a LAN IP. |
| Port 3000 in use | `next dev -p 3001` (or set a free port). |

---

## 9. When you're done

If you used **§2 Option A**, restore the router:

```bash
mv middleware.ts.disabled middleware.ts
```

If you used **§2 Option B**, revert your `migration.config.mjs` edits back to
`target: "OLD", canaryPercent: 0` for every rule (the Phase-0 invariant asserted
by `tests/migration.test.mjs` — `npm test` will fail if you leave routes on NEW).
