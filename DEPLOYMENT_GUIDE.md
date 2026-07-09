# Deployment Guide — লস্ট মডেস্টি (Lost Modesty) rebuild

This guide explains how to deploy the **new Next.js app** in this repository as a
standalone, publicly reachable site. It is written against the actual code in this
repo (verified July 2026) — every step below was checked against the real build.

> **Where the project stands vs the build plan** (`REBUILD_PLAN.md` + `FRONTEND_DESIGN_PLAN.md`):
>
> | Plan area | Status |
> |---|---|
> | Phases 0–6 — all 11 features (read path, auth, comments, dashboard, bookmarks, editor, settings, activity, notifications) | ✅ **Code-complete**, verified by 36 offline tests (`npm test`) |
> | Checkpoints CP0–CP7 (live-site parity, canary, SEO sign-off) | ⛔ Not green — they require live-site access, real infra, and stakeholder sign-off that don't exist in this repo |
> | Phase 7 — real database / data-primary cutover | ⛔ Not started — **all data is in-memory sample stores** |
>
> In other words: the *application* is finished and deployable; the *migration
> program* around it (shadow diff, canary ramp, DB cutover) is pending. Deploying
> the app is the prerequisite for most of those remaining steps. See
> [README.md → Phase status](./README.md) for the full breakdown.

---

## Table of contents

1. [Read this first — hard constraints](#1-read-this-first--hard-constraints)
2. [Prerequisites](#2-prerequisites)
3. [Environment variables](#3-environment-variables)
4. [Universal build steps (every deployment target)](#4-universal-build-steps-every-deployment-target)
5. [Option A — VPS / persistent Node server (recommended)](#5-option-a--vps--persistent-node-server-recommended)
6. [Option B — Docker](#6-option-b--docker)
7. [Option C — PaaS (Railway / Render / Fly.io)](#7-option-c--paas-railway--render--flyio)
8. [Option D — Vercel (read-only demo only)](#8-option-d--vercel-read-only-demo-only)
9. [Post-deploy verification checklist](#9-post-deploy-verification-checklist)
10. [Path to real production (plan alignment)](#10-path-to-real-production-plan-alignment)
11. [Ops notes — updating, restarting, logs](#11-ops-notes--updating-restarting-logs)

---

## 1. Read this first — hard constraints

These four facts decide *where* and *how* you can deploy. Everything else in this
guide follows from them.

### 1.1 All data is in-memory — wiped on every restart

Posts (`lib/content/posts.ts`), users (`lib/auth/users.mjs`), comments, bookmarks,
and the notifications read-cursor are **`globalThis` singletons inside the Node
process**. There is no database. Consequences:

- **Every restart or redeploy erases everything created at runtime** — new
  registrations, published posts, comments, bookmarks. Only the seeded sample
  content survives (it is re-seeded from source on boot).
- **Exactly one server process.** Two instances (PM2 cluster mode, multiple
  replicas, serverless lambdas) would each hold a *different* copy of the data —
  a post published on one instance would 404 on the other. Run a single process
  and do not horizontally scale until Phase 7 (real store) lands.
- Static export (`output: "export"`) is impossible — the app uses server actions,
  cookie-reading SSR pages, and route handlers.

### 1.2 Editor cover uploads write to the local filesystem

`lib/content/uploads.ts` writes uploaded cover images to `public/uploads/`
(relative to the process working directory) and serves them from there. So the
deployment needs a **writable, persistent** `public/uploads/` directory. On
read-only or ephemeral filesystems (Vercel/Netlify functions), publishing a post
*with a cover image* fails. This is the documented CDN-swap point for later.

It also imports **`sharp`**, which is *not* declared in `package.json` (it
currently resolves through Next.js's own bundled copy). Install it explicitly so
a lockfile or bundler change can't break publishing:

```bash
npm install sharp
```

### 1.3 Leave `middleware.ts.disabled` disabled

`middleware.ts.disabled` is the strangler-fig edge router from the rebuild plan.
If you rename it back to `middleware.ts`, **every request is proxied to
`OLD_ORIGIN` (default `https://www.lostmodesty.com`)** because all route classes
in `migration.config.mjs` sit at `canaryPercent: 0` — your deployment would just
mirror the old site. For a standalone deployment of the new app, keep the file
disabled. (Re-enabling it is a deliberate migration step — see §10.)

### 1.4 ⚠️ Change the seeded demo credentials before going public

`lib/auth/users.mjs` seeds three accounts whose **plaintext passwords are in this
public repo and in `LOCAL_TESTING.md`**:

| Account | Role | Can do |
|---|---|---|
| `lostmodesty@lostmodesty.com` / `raat-jaaga-1` | **author** | **publish, edit and delete posts** |
| `rumki@lostmodesty.com` / `modhyobortini-2` | reader | comment, bookmark |
| `nila@example.com` / `porano-shohor` | reader | comment, bookmark |

On any internet-facing deployment, anyone who has seen the repo can log in as the
author and publish to your site. **Before deploying publicly**, edit the `SEED`
array in `lib/auth/users.mjs`: change at minimum the author's email and the
password inside `hashPassword("…")`, and don't commit the real password. (Reader
accounts can simply be deleted from the array.)

---

## 2. Prerequisites

- **Node.js ≥ 20** (`engines` field; the app is developed on v24 — 22 LTS or 24
  both work). No `.nvmrc` is committed, so pin the version yourself on the server.
- **npm** (ships with Node; `package-lock.json` is committed, so use `npm ci`).
- **git** to clone the repo.
- *(Optional but recommended)* **Font binaries** — the repo self-hosts fonts but
  the binaries aren't committed. Drop the woff2/ttf files listed in
  [`public/fonts/README.md`](./public/fonts/README.md) into `public/fonts/` for
  proper Bengali typography and Bengali glyphs on the generated OG images. The
  build **never fails** without them — you just get fallback system fonts.
- No database, cache, or external service is required (see §1.1 — for better and
  worse).

---

## 3. Environment variables

Next.js loads `.env.production` / `.env.local` from the project root at build
**and** runtime, or you can set real environment variables (PM2 ecosystem file,
Docker `-e`, PaaS dashboard). No `.env.example` is committed; use this table:

| Variable | Required | Purpose |
|---|---|---|
| `SESSION_SECRET` | **Yes, in production** | HMAC key that signs the `lm_sess` login cookie (`lib/auth/session.ts`). Without it the app silently falls back to a **publicly known dev secret** (`dev-only-secret-not-for-production`) — anyone could forge a session cookie, including an author session. |
| `NEXT_PUBLIC_SITE_URL` | Yes, unless you own `www.lostmodesty.org` | Canonical origin used in `<link rel="canonical">`, OG/Twitter URLs, sitemap, robots and RSS. Defaults to `https://www.lostmodesty.org`. Set it to your real origin, e.g. `https://your-domain.com` — **before `npm run build`** (it is inlined at build time). |
| `NODE_ENV` | Set by `next build`/`next start` automatically | In production it turns on the `Secure` flag for auth cookies — which means **you must serve over HTTPS** or login cookies won't stick. |
| `OLD_ORIGIN` | No | Only read by the (disabled) strangler-fig middleware and the shadow-diff scripts. Irrelevant for a standalone deploy. |
| `PORT` | No | Port for `next start` (default `3000`). You can also pass `npm start -- -p 8080`. |

Generate a strong `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example `.env.local` on the server (git-ignored):

```ini
SESSION_SECRET=<paste the generated 64-char hex string>
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## 4. Universal build steps (every deployment target)

These steps are identical on a VPS, in a Dockerfile, or as a PaaS build command.

```bash
# 1. Clone
git clone https://github.com/Saifullahx190/lost_modesty.git
cd lost_modesty

# 2. Install exact locked dependencies (+ sharp for editor cover uploads, §1.2)
npm ci
npm install sharp

# 3. REQUIRED: generate the design-token CSS.
#    app/globals.css imports ./tokens.generated.css, which is git-ignored —
#    a fresh clone will NOT build without this step.
node scripts/build-tokens-css.mjs

# 4. Set env vars (see §3) — NEXT_PUBLIC_SITE_URL must be set BEFORE building.
#    e.g. create .env.local as shown above.

# 5. (Recommended) run the offline test suites — 36 tests, no network needed
npm test

# 6. Production build — SSG-prerenders every article/category/tag/author page
#    plus feed.xml, sitemap.xml, robots.txt and the OG images
npm run build

# 7. Serve
npm start          # → http://localhost:3000
```

Notes:

- `data/redirect-map.json` (also git-ignored) is **not** needed for the build —
  it is consumed only by the audit tooling (`npm run redirect:build` /
  `redirect:audit`). `next.config.mjs` currently ships no redirects.
- A quick local smoke test before deploying: run steps 1–7 on your machine and
  click through `http://localhost:3000` (works on Windows/macOS/Linux alike).

---

## 5. Option A — VPS / persistent Node server (recommended)

The best match for this app's constraints (§1.1): one long-lived Node process on
one machine, with the filesystem persisted. Any Ubuntu/Debian VPS (Hetzner,
DigitalOcean, Lightsail, …) works.

### 5.1 Install Node 22 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
```

### 5.2 Get the app onto the server and build it

```bash
sudo mkdir -p /srv && cd /srv
sudo git clone https://github.com/Saifullahx190/lost_modesty.git lostmodesty
sudo chown -R $USER: /srv/lostmodesty
cd /srv/lostmodesty

npm ci && npm install sharp
node scripts/build-tokens-css.mjs

cat > .env.local <<'EOF'
SESSION_SECRET=<generated-secret>
NEXT_PUBLIC_SITE_URL=https://your-domain.com
EOF

npm test
npm run build
```

### 5.3 Run it under PM2 — fork mode, exactly one instance

```bash
sudo npm install -g pm2

# IMPORTANT: fork mode with 1 instance. NEVER cluster mode ("-i max") —
# each worker would hold its own copy of the in-memory data (§1.1).
pm2 start npm --name lostmodesty -- start
pm2 save
pm2 startup   # follow the printed command so it survives reboots
```

*(systemd alternative: a plain unit with `WorkingDirectory=/srv/lostmodesty`,
`ExecStart=/usr/bin/npm start`, `Restart=always` does the same job.)*

### 5.4 Nginx reverse proxy + HTTPS

HTTPS is not optional: production auth cookies are `Secure`-flagged (§3), so
login only works over TLS.

```nginx
# /etc/nginx/sites-available/lostmodesty
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Editor cover uploads can be up to 5 MB (lib/content/uploads.ts)
    client_max_body_size 6m;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/lostmodesty /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# TLS via Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 5.5 Persist uploads

`public/uploads/` lives inside the repo checkout, so on a VPS it persists across
app restarts automatically. Just be careful **not to delete it when updating**
(it's git-ignored, so `git pull` won't touch it — see §11 for the update
procedure). Remember the caveat: the *post* referencing an upload is in memory
and dies on restart; the image file itself survives.

---

## 6. Option B — Docker

No Dockerfile is committed; use this one (it encodes the required token-CSS step):

```dockerfile
# Dockerfile
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm install sharp
COPY . .
# Required: globals.css imports the git-ignored tokens.generated.css
RUN node scripts/build-tokens-css.mjs
# NEXT_PUBLIC_SITE_URL is inlined at build time
ARG NEXT_PUBLIC_SITE_URL=https://your-domain.com
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run — **one replica only** (§1.1), with a volume for uploads (§1.2):

```bash
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://your-domain.com -t lostmodesty .

docker run -d --name lostmodesty \
  -p 3000:3000 \
  -e SESSION_SECRET=<generated-secret> \
  -v lostmodesty_uploads:/app/public/uploads \
  --restart unless-stopped \
  lostmodesty
```

Put Nginx/Caddy/Traefik with TLS in front exactly as in §5.4. Do **not** run this
behind a load balancer with multiple containers.

*(The image copies the full workspace for simplicity. If size matters later, add
`output: "standalone"` to `next.config.mjs` and copy `.next/standalone` instead —
a code change, so it's out of scope here.)*

---

## 7. Option C — PaaS (Railway / Render / Fly.io)

Workable, with two conditions: **exactly one instance**, and **a persistent
volume mounted at `public/uploads`** (Railway Volumes, Render Disks, Fly
Volumes). Note that PaaS deploys/restarts still wipe the in-memory data (§1.1).

Settings for any of them:

| Setting | Value |
|---|---|
| Build command | `npm ci && npm install sharp && node scripts/build-tokens-css.mjs && npm run build` |
| Start command | `npm start` |
| Instances / scaling | **1**, autoscaling off |
| Volume mount path | `<app dir>/public/uploads` |
| Env vars | `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL` (must be present at **build** time) |
| Health check | `GET /` |
| Node version | 20+ (set via `NODE_VERSION` env or the platform's setting) |

---

## 8. Option D — Vercel (read-only demo only)

Vercel runs pages and server actions in **stateless, ephemeral serverless
functions**, which collides with §1.1 and §1.2:

- The seeded **read path works fine** (it's SSG): home, articles, categories,
  tags, feed, sitemap, OG images.
- **Everything interactive silently loses data**: registrations, logins-after-
  registration, published posts, comments, bookmarks may land on one lambda and
  vanish on the next request (or on cold start).w
- **Publishing with a cover image fails** — the function filesystem is read-only
  (`public/uploads` write throws).

If you want a shareable preview of the seeded content: import the repo in
Vercel, set Build Command to
`npm install sharp && node scripts/build-tokens-css.mjs && next build`,
add `SESSION_SECRET` + `NEXT_PUBLIC_SITE_URL`, and treat it as a **read-only
demo**. Do not use it as the real site until the data layer is real (§10).

---

## 9. Post-deploy verification checklist

Replace `https://your-domain.com` with your origin. All sample URLs below exist
in the seeded content.

**Read path (anonymous):**

- [ ] `/` — home renders, Bengali text, no broken styles (if styles are missing, the token-CSS step was skipped — §4 step 3)
- [ ] `/blog` — index with pagination
- [ ] `/lostmodesty/raat-baarotar-por` — article: title, cover, footnotes, comments block
- [ ] `/category/golpo`, `/tag/raat`, `/author/lostmodesty` — listing pages
- [ ] `/feed.xml`, `/sitemap.xml`, `/robots.txt` — 200, and URLs inside them use your `NEXT_PUBLIC_SITE_URL` (not `www.lostmodesty.org`)
- [ ] View source of an article: `<link rel="canonical">` and JSON-LD (`NewsArticle`) point at your origin
- [ ] A garbage one-segment URL (e.g. `/nope`) → branded 404 page, HTTP status **404**
- [ ] Known quirk (verified): a garbage *article-shaped* URL (e.g. `/nope/nope-nope`) shows the same branded 404 page but with HTTP status **200** — a "soft 404". The article route streams its loading shell (200) before `notFound()` fires. The response carries `noindex` so it won't be indexed, but status-code parity is a CP1/§3B item to fix before any SEO cutover
- [ ] Theme toggle (☀/🌙) and Bangla⇄English chrome toggle work and persist on reload

**Auth + write path (use your changed credentials, §1.4):**

- [ ] `/login` over **HTTPS** — author login succeeds and survives a reload (if it doesn't stick, you're on plain HTTP — the `Secure` cookie flag is dropping it)
- [ ] `/dashboard` — greeting + quick links; logged-out visit redirects to `/login?next=/dashboard`
- [ ] `/editor` — publish a test post (with a cover image, to exercise the §1.2 upload path) → 303 to the live article URL, post appears on `/`
- [ ] `/settings`, `/activity`, `/notifications` — load for a logged-in user
- [ ] Register a fresh reader account, comment on a post, bookmark it — then check `/activity`
- [ ] **Expected limitation:** restart the server (`pm2 restart lostmodesty`) — the test post/account/comment are gone, seeded content is back. That's §1.1, not a bug.

---

## 10. Path to real production (plan alignment)

What `REBUILD_PLAN.md` still requires before this deployment can *replace*
`lostmodesty.com` — none of it changes this guide, but deploys depend on it:

1. **Real content/user store (Phase 7 prerequisite)** — replace the `globalThis`
   sample stores (`lib/content/posts.ts`, `lib/auth/users.mjs`, comments,
   bookmarks, notifications cursor) with a database. The modules are written as
   swap points: callers keep their signatures.
2. **Uploads → CDN/object storage** — swap `persistUpload()` in
   `lib/content/uploads.ts` and add the host to `images.remotePatterns` in
   `next.config.mjs`. Lifts the single-writable-disk constraint; after this plus
   the DB, horizontal scaling becomes possible.
3. **Real URL inventory + redirect map** — produce `data/url-inventory.csv` from
   the live site per `data/URL_INVENTORY_SPEC.md`, then `npm run redirect:build`
   and wire the map into `next.config.mjs` `redirects()`.
4. **Shadow parity + baselines** — `npm run shadow:diff` against the live site,
   baseline screenshots (`design/reference/`), CWV baseline (CP0/CP1 gates).
5. **Strangler-fig cutover** — rename `middleware.ts.disabled` →
   `middleware.ts`, set `OLD_ORIGIN`, then ramp `canaryPercent` per route class
   in `migration.config.mjs` (1 → 5 → 25 → 100) as checkpoints pass. This is how
   the plan intends the new app to take over the live domain gradually.
6. **Email notifications (#9)** — deliberately still on the old platform's
   service; cut over separately.

---

## 11. Ops notes — updating, restarting, logs

- **Any restart or deploy wipes runtime data** (§1.1). Until Phase 7, treat
  user-generated content as disposable and schedule updates accordingly. There is
  nothing to back up except `public/uploads/` (image files).
- **Update procedure (VPS/PM2):**

  ```bash
  cd /srv/lostmodesty
  git pull
  npm ci && npm install sharp        # sharp survives ci only if added to package.json — re-run to be safe
  node scripts/build-tokens-css.mjs  # tokens are git-ignored; regenerate every deploy
  npm test
  npm run build
  pm2 restart lostmodesty
  ```

  (`git pull` won't touch `public/uploads/` or `.env.local` — both git-ignored.)
- **Logs:** `pm2 logs lostmodesty` (PM2), `docker logs -f lostmodesty` (Docker).
- **Uncommitted work:** if you deploy by cloning from GitHub, remember the deploy
  only contains what's **pushed** — commit and push pending local work first.
- If the site comes up unstyled, the tokens step was skipped (§4 step 3). If
  login won't persist, you're missing HTTPS or `SESSION_SECRET` (§3).
- If `next start` boots but every request errors with
  `Cannot find module './NNN.js'` (from `.next/server/webpack-runtime.js`), a
  **dev server was running during `npm run build`** — `next dev` and `next build`
  share the `.next` directory and corrupt each other's artifacts. Stop
  `npm run dev`, delete `.next`, and rebuild. (Verified on this project — never
  build while the dev server is up.)
