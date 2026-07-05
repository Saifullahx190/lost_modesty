# Frontend Design Plan — লস্টমডেস্টি ব্লগ (Lost Modesty Blog) Rebuild

## Companion document

This plan is the **frontend/UI counterpart** to `REBUILD_PLAN.md`. The rebuild plan governs migration sequencing, URL/SEO preservation, and infrastructure safety. This document governs **what the rebuilt site looks like, how it behaves, and how design work is produced, reviewed, and handed to engineering** — for the same Next.js platform, on the same phased timeline, without contradicting either document. Where the two overlap (e.g., Core Web Vitals, SSG/ISR rendering), this plan treats those as fixed constraints inherited from the rebuild plan, not open questions.

**Source of truth for current visual baseline:** eight screenshots of the live site (`lostmodesty.com`) covering the All Posts index and an article page, each in light/dark mode and desktop/mobile. This plan reverse-engineers the existing design language from those screenshots, treats it as the contract to preserve, and proposes where to refine rather than reinvent — consistent with the rebuild plan's "parity first" principle. The live site currently runs on a stock "Tailwind Nextjs Theme" starter (per its own footer credit); this plan keeps the parts readers already trust and removes the parts that read as default-template rather than intentional.

---

## 0. Design Brief Summary (grounding)

- **Subject:** লস্টমডেস্টি ("Lost Modesty") is a Bengali-language personal/literary blog — confessional prose, serialized multi-part stories ("পর্ব" / part 1, 2, 3, final), and reflective essays. Tone is intimate, melancholic, literary. Cover imagery is photographic and illustrative, often symbolic (a bear trap shaped like a heart, wilted roses, rusted locks, a curtain in a dark window).
- **Audience:** Bengali-reading readers arriving mostly from search and social shares, reading long-form text on phones, often at night (dark mode is a first-class, frequently-used mode, not an afterthought).
- **Page's single job (index):** Help a returning or search-arriving reader find the next thing worth reading, fast, by title, recency, or series.
- **Page's single job (article):** Get out of the way of long-form Bengali reading for 5–15 minutes, in either light or dark, on any screen size.
- **Existing signature element worth preserving:** the marigold/floral mark in the logo lockup, used as a quiet recurring motif (favicon, loading state, empty state) rather than redesigned away.

---

## 1. Scope and Constraints

### 1.1 Target platforms

| Platform | Support level | Notes |
|---|---|---|
| Mobile web (Android Chrome, iOS Safari) | **Primary** — majority of traffic per existing mobile-optimized layout evidence | Single-column, full-bleed cover images, hamburger nav already in place; preserve this pattern |
| Desktop web (Chrome, Safari, Firefox, Edge — last 2 versions) | **Primary** | Two-column card grid, inline top nav |
| Tablet (portrait/landscape) | **Secondary** — handled by fluid breakpoints, not bespoke layouts | Treat as a midpoint interpolation between mobile and desktop grids, not a third design |
| Bengali (bn) as primary locale, English (en) as secondary/admin locale | **Primary content language is Bengali** | Typography, line-height, and font stack must be tuned for Bengali script first; English is secondary (UI chrome only, in current site) |
| Screen readers (VoiceOver, TalkBack, NVDA) | **Required, not optional** | See 1.3 |
| Print / reader-mode extensions | **Best-effort** | Article CSS should degrade cleanly (no broken floats) but is not a dedicated deliverable |

No native app is in scope. No RTL support is required (Bengali is LTR).

### 1.2 Tech stack (inherits and extends REBUILD_PLAN.md's locked decision)

- **Framework:** Next.js (React), SSR/SSG/ISR hybrid — **locked**, carried over from the rebuild plan. Article and category pages render as SSG/ISR; auth/dashboard/editor as SSR.
- **CSS approach:** **Tailwind CSS**, continuing the current site's own stack (confirmed by its footer attribution to a "Tailwind Nextjs Theme"). Recommendation: **keep Tailwind but replace the starter theme's tokens with a bespoke design-token layer** (Section 2) rather than re-skinning the stock theme's defaults. Tailwind's utility classes are fine; the *values* they resolve to (the stock theme's default indigo/gray scale, default type scale) are what reads as templated and should be replaced.
- **Component primitives:** Headless, unstyled interaction libraries (Radix UI primitives or React Aria) underneath Tailwind for anything with accessibility state machinery — menus, dialogs, tabs, disclosure/accordion (used in footnote/citation blocks) — rather than hand-rolling focus-trap and ARIA logic per component.
- **Icons:** A single icon set, SVG, tree-shaken (Lucide or Heroicons outline set) — matching the thin-line moon/sun toggle and hamburger glyph already in use. No mixing icon families.
- **Fonts:** Self-hosted via `next/font` (avoids a render-blocking third-party request to Google Fonts CDN, which also helps CWV — see 1.3). Subset to Bengali + Latin only.
- **Build tooling:** Whatever the rebuild plan's Next.js app already uses (its own bundler/build pipeline) — this plan does not introduce a second build system. Storybook (or equivalent component sandbox) is added as a **design-system-only** dev dependency, not shipped to production.
- **State/data:** Server Components for static content (article body, post metadata); client components scoped narrowly to interactive islands (theme toggle, search box, bookmark button, comment form) to keep JS payload low on a page whose job is reading.

### 1.3 Performance and accessibility targets

**Performance** (must match-or-beat the Core Web Vitals baseline the rebuild plan requires capturing in its Phase 0 — these are the frontend-specific targets that feed that baseline):

| Metric | Target | Why this number |
|---|---|---|
| Lighthouse Performance | ≥ 95 (mobile, throttled) | Article pages are text-and-one-hero-image; there is no excuse for this to score lower than a near-static page |
| LCP (Largest Contentful Paint) | < 2.0s on 4G mobile | The cover image is almost always the LCP element — see imagery strategy in 2.4 for the optimization plan that hits this |
| CLS (Cumulative Layout Shift) | < 0.05 | Reserve aspect-ratio boxes for every cover image and ad/embed slot before content loads; the current site's image-heavy cards are a CLS risk if unsized |
| INP (Interaction to Next Paint) | < 200ms | Theme toggle, search-as-you-type, and pagination must not block on hydration of unrelated page chrome |
| Lighthouse Accessibility | ≥ 100 | Non-negotiable; see below |
| Lighthouse SEO | ≥ 100 | Carries the rebuild plan's SEO-preservation mandate into a measurable, repeatable check at every PR |
| Lighthouse Best Practices | ≥ 95 | |
| Total JS shipped on article route | < 100KB gzipped (excluding analytics) | Reading is the job; do not ship a comment widget's JS to a reader who never scrolls that far — lazy-load it |

**Accessibility** (WCAG 2.1 AA as the floor, not the ceiling):

- **Color contrast:** every text/background pairing in both light and dark palettes (Section 2.1) must pass 4.5:1 for body text, 3:1 for large text (≥24px) — checked against the *actual* tokens, not assumed from "looks dark enough."
- **Keyboard navigation:** full tab-order coverage; visible focus ring on every interactive element (the current site's minimalist aesthetic must not sacrifice focus visibility — a high-contrast focus outline is part of the design system, not an afterthought added at QA).
- **Reduced motion:** every transition (theme toggle crossfade, card hover lift, page-load reveal) respects `prefers-reduced-motion: reduce` with an instant-state fallback.
- **Semantic structure:** one `<h1>` per page (post title), proper heading hierarchy through the article body (the current Bengali long-form content uses numbered section breaks like "১) প্রেম রাজনীতি" — these must map to real `<h2>`/`<h3>`, not styled `<p>` tags, both for accessibility and for the rebuild plan's structured-data fidelity).
- **Images:** every cover image and inline illustration ships with a meaningful `alt` (author-authored at publish time in the editor, not auto-generated filenames); decorative-only marks (the floral logo glyph) get `alt=""` / `aria-hidden`.
- **Language attributes:** `<html lang="bn">` site-wide (with per-element `lang` overrides for any embedded English), so screen readers select the correct Bengali voice automatically.
- **Forms:** search box, comment form, login form all have associated `<label>` elements (visually hidden where the placeholder pattern is kept), inline error messages tied via `aria-describedby`, and error states announced via `aria-live` regions — not just a red border.
- **Touch targets:** ≥ 44×44px on mobile for nav icons, theme toggle, pagination arrows — the current mobile header's icon cluster (moon, hamburger) should be audited against this; screenshots suggest they may currently be tighter than 44px and should be expanded in the rebuild, not just restyled.

---

## 2. Design System and UI Architecture

### Design brainstorm (per frontend-design process: brainstorm → critique → revise → build)

**Color (4–6 named tokens):** The current site is a clean near-white / near-black duotone with a **marigold/amber accent** (visible in the logo mark, the "BLOG" eyebrow label, and link/tag text) and an **orange-red secondary accent** (visible in category tag text like "লাভ-ম্যারেজ-বনাম-এরেঞ্জড-ম্যারেজ"). This is already a deliberate, non-default choice — amber/marigold is not one of the three generic AI-design clusters (cream+terracotta-serif, near-black+acid-green, broadsheet-hairline) flagged in the design skill, and it visually echoes the marigold flower in the logo itself. **Decision: keep and formalize this palette** rather than replacing it with a trendier default; the brief (preserve existing reader trust + brand recognition) outweighs the impulse to "improve" a palette that already has a reason to exist.

**Type:** Current site appears to use a single sans-serif (likely a default Tailwind-theme system stack) for everything — headline, body, meta. For a literary, long-form-reading brand this is the one place worth taking a real risk: **pair a Bengali-and-Latin serif for headlines** (carries literary warmth, differentiates post titles in the card grid) **with a humanist sans for body and UI** (Bengali script needs generous letterforms at small sizes; an all-serif body would hurt long-form readability on mobile). This is a deliberate upgrade from the current single-typeface treatment, not a wholesale reinvention.

**Layout:** Keep the proven structure — search-first index page, two-column masonry-ish card grid on desktop collapsing to one column on mobile, hamburger nav on mobile / inline nav on desktop, fixed simple header. This structure is already working (it is not a generic SaaS-marketing template; it is a standard, reader-tested blog-index pattern) — the rebuild's job is to execute it with better tokens, not replace it.

**Signature element:** The marigold mark + a refined version of the existing illustrated/photographic cover-image treatment (irregular, symbolic, art-directed covers — a bear trap, a curtain, roses on concrete) **is** the brand's visual signature. The design system's job is to give those covers a more consistent frame (consistent aspect ratio, consistent corner radius, a subtle hover lift) so the existing art direction reads as intentional curation rather than inconsistent legacy uploads.

**Self-critique:** Initial instinct was to propose a moody near-black-with-one-accent dark mode (cluster #2 in the generic-AI-design list). Revised: the existing dark mode is already a true near-black (#0a0a0a-range) with off-white text and the *same* marigold accent carried through — that's correct and should be preserved exactly, not pushed toward a punchier single neon accent, because doing so would be choosing the generic answer over the brief's actual existing identity.

### 2.1 Color palette

Two parallel token sets (light / dark), same semantic names, so components never branch on theme — only the token values change.

| Token | Light value | Dark value | Usage |
|---|---|---|---|
| `--color-bg` | `#FFFFFF` | `#0B0B0C` | Page background |
| `--color-bg-subtle` | `#F7F6F4` | `#161616` | Search input fill, card hover surface |
| `--color-text` | `#171717` | `#EDEDED` | Body copy, headings |
| `--color-text-muted` | `#6B6B6B` | `#9A9A9A` | Dates, byline, meta row |
| `--color-border` | `#E7E5E2` | `#262626` | Hairline rules under header, between list items |
| `--color-accent` | `#D9A02B` (marigold) | `#E3B24F` | Logo mark, "BLOG" eyebrow, primary links, active nav state |
| `--color-accent-secondary` | `#C75B39` (terracotta-red) | `#D97A5C` | Category/tag labels, footnote markers |
| `--color-focus-ring` | `#1B6FE0` | `#5EA1FF` | Focus outline only — deliberately distinct from both accents so focus is never ambiguous with "this is a link" |
| `--color-danger` | `#C0362C` | `#E5645A` | Form errors, destructive confirmation |
| `--color-success` | `#2E7D4F` | `#52B07A` | Save/publish confirmation toasts |

All pairings above are pre-checked to meet 4.5:1 (text-on-bg) / 3:1 (large text, accent-on-bg) before implementation; any future token addition is checked the same way before merge, not after.

### 2.2 Typography

| Role | Typeface | Notes |
|---|---|---|
| Display / headline (post titles, section H1–H2) | A literary serif with Bengali support — e.g., **Tiro Bangla** or **Noto Serif Bengali** paired with a Latin literary serif (**Lora** or **Source Serif 4**) for any Latin fallback/admin text | Used with restraint: headline sizes only, never body paragraphs |
| Body (article copy, card descriptions) | A humanist sans with strong Bengali hinting — **Noto Sans Bengali** / **Hind Siliguri** paired with **Inter** for Latin | Optimized for 16–18px comfortable long-form reading; this is the workhorse face |
| UI / meta / captions / dates / tag labels | Same body sans, smaller size + the muted color token — not a third typeface | Keeps the type system to 2 families, not 3 |

**Type scale** (mobile base 16px, fluid via `clamp()` so desktop doesn't need a second hardcoded scale):

| Token | Size | Line-height | Used for |
|---|---|---|---|
| `--text-display` | `clamp(1.75rem, 4vw, 2.5rem)` | 1.25 | Article H1 / post title on its own page |
| `--text-card-title` | `clamp(1.125rem, 2.5vw, 1.375rem)` | 1.3 | Post title inside an index card |
| `--text-h2` | `1.375rem` | 1.35 | In-article section headings (the "১) প্রেম রাজনীতি" pattern) |
| `--text-body` | `1.0625rem` | 1.75 | Article paragraphs — generous line-height for Bengali script |
| `--text-meta` | `0.875rem` | 1.4 | Dates, tags, byline |
| `--text-caption` | `0.75rem` | 1.4 | Footnotes, image captions |

### 2.3 Spacing scale

A single 4px-based scale used everywhere (Tailwind's default spacing scale already matches this — keep it, just stop overriding it ad hoc):

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96px` — mapped to Tailwind's `1,2,3,4,6,8,12,16,24`. Card internal padding = 16–24px; section vertical rhythm on the index page = 48–64px; article paragraph spacing = 24px. No one-off magic-number margins outside this scale.

### 2.4 Component library plan

| Component | States to design | Notes from current site |
|---|---|---|
| **Header / nav bar** | default, scrolled (optional sticky shadow), mobile (hamburger open/closed) | Currently: logo lockup left, 4 nav links + theme toggle right (desktop); logo + theme toggle + hamburger (mobile). Preserve this exact information architecture; refine spacing and tap targets only. |
| **Theme toggle** | light, dark, focus, hover | Currently a simple moon/sun glyph swap with no visible transition — add a quick (150–200ms, reduced-motion-safe) crossfade so the switch doesn't feel like a hard flash |
| **Post card** (index grid) | default, hover (lift + shadow), no-image fallback, loading/skeleton | Must define a fixed aspect-ratio (16:10 reads close to current screenshots) for the cover image slot so CLS stays near zero regardless of source-image dimensions |
| **Search input** | empty, focused, typing (live results or instant filter), no-results | Currently a plain bordered input with a magnifier icon and no visible live-search feedback — define an explicit "X results" or empty-state below the field |
| **Pagination** | default, current page, disabled-edge ("Previous" on page 1) | Currently text-only "Previous / 1 of 25 / Next" — keep this lightweight pattern (it's appropriately minimal for a 25-page archive), just ensure disabled state has both a visual and `aria-disabled` treatment |
| **Tag / category pill** | default, hover, active/selected (on a filtered view) | Currently rendered as plain colored text links inline under the date — fine as-is; do not over-design into heavy pill/badge shapes that the current minimal aesthetic doesn't call for |
| **Article header block** | with cover image, without cover image | Title + date + tag row + optional hero image, per screenshots |
| **Footnote / citation block** | collapsed reference list, expanded, individual footnote anchor + back-link | Article pages show a numbered reference list at the bottom with bracketed in-text markers `[1]`, `[2]` — this should become an accessible disclosure pattern with `id`-anchored back-links, not just text |
| **Comment form & list** (Phase 3 of rebuild plan) | empty, composing, submitting, submitted, error, nested reply | New surface — design before Phase 3 build starts, not during it |
| **Bookmark button** (Phase 4) | unsaved, saved, saving (optimistic), error/rollback | Needs an explicit "saved" confirmation, not just an icon-fill change, for accessibility |
| **Auth forms** (login/register, Phase 2) | default, validating, error per-field, submitting, success | Must support the rebuild plan's password-hash/session-continuity requirements transparently — no UI difference for a migrated vs. new account |
| **Toast / inline confirmation** | success, error, neutral/info | "Saved," "Comment posted," "Couldn't connect — try again" |
| **Empty / error states** | 404, search-no-results, comments-disabled, offline | See 3.4 |
| **Footer** | — | Logo + name, copyright, theme/credit line, email + Facebook icons — keep minimal, this is already correctly restrained |

### 2.5 Layout system

- **Grid:** 2-column card grid on desktop/tablet-landscape (matches current screenshots exactly), single column on mobile/tablet-portrait. Implemented as CSS Grid with `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))` capped at 2 columns via a max-width container (not 3+, even on very wide screens — the current site's restraint here, leaving generous whitespace rather than cramming a 3rd column, is a deliberate readability choice worth keeping).
- **Breakpoints:**

| Name | Width | Layout behavior |
|---|---|---|
| `xs` (mobile) | < 640px | 1-column grid, hamburger nav, full-bleed cover images |
| `md` (tablet) | 640–1024px | 2-column grid begins, inline nav reappears at the top of this range |
| `lg` (desktop) | ≥ 1024px | 2-column grid, max content width ~720px for article body (optimal Bengali line length), ~1024px for the index grid container |
| `xl` (wide desktop) | ≥ 1440px | Same as `lg`, just more side margin — content width does not grow further |

- **Article content width:** capped at ~68–72 Bengali characters per line (roughly 680–720px at the body type scale) regardless of viewport — wide desktop screens get margin, not longer lines, which is the single highest-leverage readability decision for long-form text.
- **Responsive rule of thumb:** every component is designed mobile-first and only gains complexity (more columns, inline nav, hover states) at wider breakpoints — never the reverse.

### 2.6 Iconography and imagery strategy

- **Icons:** one outline icon set (Section 1.2), 20–24px, stroke-aligned to the type's optical weight. Used for: theme toggle, hamburger/close, search, social (email, Facebook — matching current footer), bookmark, comment, pagination chevrons.
- **Imagery (this is where the current site's identity actually lives):**
  - Cover images are **art-directed, often symbolic/illustrative**, not stock-generic — this must be preserved as an editorial standard, communicated to authors/editors in the CMS, not just a frontend rule.
  - **Aspect ratio:** lock to 16:10 across all cards and article headers for visual consistency (current screenshots show slightly inconsistent crops between cards — standardizing this is a real, low-risk improvement).
  - **Optimization pipeline:** every cover image served via `next/image` (automatic responsive `srcset`, AVIF/WebP with fallback, lazy-loading below the fold, eager+priority for the single LCP image per page) — this is the direct lever for the LCP < 2.0s target in 1.3.
  - **Dark mode image handling:** photographic covers stay as-is in dark mode (current screenshots confirm this — no inversion filter); only UI chrome and illustrations with white backgrounds (e.g., the rose-petals cover, the hand-drawn type cover) may warrant a subtle frame/border in dark mode so they don't look like an unstyled white box floating on black. Add a 1px `--color-border` frame around any cover image whose dominant background is near-white, in dark mode only.
  - **Illustration style** (for any newly commissioned in-article art, e.g. the hand/flower and the bear-trap-heart pieces): muted, slightly desaturated palette that doesn't fight the marigold/terracotta UI accents; line-art or flat-color over photo-collage, consistent with the existing samples.

---

## 3. User Flows and Wireframes

### 3.1 Key pages / screens

1. **Home / All Posts (index)** — `/` or `/blog`
2. **Article page** — `/{author}/{slug}` (URL pattern per rebuild plan Section 3A — frontend must not assume a different pattern)
3. **Category / tag index** — `/category/{slug}`
4. **Author archive** — `/author/{name}`
5. **Search results** (may be a filtered state of #1 rather than a separate route — see 3.3)
6. **Login / Register**
7. **User dashboard** (logged-in landing)
8. **Article composer / editor** (author-facing)
9. **404 / error page**

### 3.2 Primary user journeys

**Journey A — New reader arrives from a Google search result on an old article URL.**
`Search result click → article page resolves at preserved URL (200, no redirect chain) → reads in whichever theme matches OS preference by default → scrolls through footnotes → sees related/tag links at the bottom → clicks a tag → lands on category index.`
Design implication: theme should default to `prefers-color-scheme` on first visit (not hardcoded light), with the manual toggle overriding and persisting via cookie/localStorage for return visits — this is a likely-but-unconfirmed gap in the current site worth closing, given dark mode is clearly a fully-designed first-class mode here, not a token gesture.

**Journey B — Returning reader browses the archive.**
`Home → scans card grid by cover image (recognition) and title → uses search box to jump to a half-remembered title → paginates through 25 pages if not found → opens article.`
Design implication: search must filter *as you type* against title (and ideally body) with no full-page reload, and the empty-search-results state must suggest browsing by tag instead of just saying "no results."

**Journey C — Logged-in reader bookmarks a serialized story to continue later.**
`Article page → taps bookmark icon → optimistic save confirmation → later, from dashboard → "Saved" list → resumes at the next part in series.`
Design implication: serialized posts ("পর্ব ২", "পর্ব ৩", "শেষ পর্ব") benefit from an explicit "part of a series" navigation strip (prev part / next part) on the article page itself — not currently visible in screenshots, and a high-value, low-cost addition given how much of the catalog is serialized.

**Journey D — Author drafts and publishes a new post.**
`Login → dashboard → new post → editor (title, body, cover image, tags, series link) → preview (must visually match the live article template exactly, per rebuild plan's round-trip-fidelity requirement) → publish → redirected to the live URL.`

**Journey E — Reader leaves a comment.**
`Article page → scrolls to comment section → (if logged out) prompted to log in/register, returning to the same scroll position after auth → composes → submits → optimistic insertion into the thread → server confirmation replaces optimistic state.`

### 3.3 Primary interactions and state changes

- **Theme toggle:** click → instant token swap (CSS variables, no flash-of-wrong-theme on load — implemented via a blocking inline script reading the stored preference before first paint) → persists across sessions.
- **Search:** keystroke → debounced (150–200ms) client-side filter against an already-fetched lightweight index (title/date/tags) for instant feel, falling back to a server search route for full-text if the dataset is too large to ship client-side — decide which based on actual catalog size (25 pages × ~12 posts/page ≈ 300 posts is almost certainly small enough for the client-side index approach).
- **Card hover (desktop only):** subtle lift (`translateY(-2px)`) + soft shadow, 150ms ease, disabled entirely under `prefers-reduced-motion`.
- **Pagination:** click → URL updates (`?page=2`, matching rebuild plan's requirement to preserve the existing pagination URL scheme exactly) → scroll position resets to top of grid → previous/next disabled-state logic at the edges.
- **Bookmark toggle:** click → optimistic icon-fill change + toast → on server error, icon reverts and an inline error explains what happened (not a silent failure).
- **Comment submit:** click → button enters a loading state (label changes from "Post comment" to "Posting…", not just a spinner glyph, per the writing guidance of naming the action) → success appends to thread; failure keeps the user's typed text intact and shows an inline, specific error.

### 3.4 Edge cases and error states

| Case | Behavior |
|---|---|
| **404 — article truly gone** | Per rebuild plan, this should be rare (redirect-to-nearest-relevant preferred over a hard 404). When it does occur: branded 404 page with the search box front-and-center and a link to the category index, not a dead end. |
| **Search — no results** | "কিছু পাওয়া যায়নি" (nothing found) state with a suggestion to browse by category — never a blank white area. |
| **Cover image fails to load** | Graceful fallback to a solid `--color-bg-subtle` panel with the post title still legible (title text already renders separately from the image, per current layout, so this is mostly a matter of not leaving a broken-image glyph). |
| **JS fails to hydrate (slow network)** | Server-rendered HTML for the article body and index grid must be fully readable with zero JS — only the *enhancements* (live search, theme persistence, bookmark) degrade, never the core reading experience. This is a direct consequence of the SSR/SSG architecture and should be treated as a frontend contract, not just a backend nicety. |
| **Logged-out reader tries to comment/bookmark** | Redirect to login with a return-path, not a dead click or a disabled button with no explanation. |
| **Offline (mobile, lost connection mid-read)** | Already-loaded article content remains visible (no app-shell wipe); a small inline banner notes "অফলাইন" if the reader tries to navigate further. |
| **Very long titles** (some current titles run 8+ Bengali words, e.g. "অতঃপর তাহারা সুখে শান্তিতে বসবাস করিতে থাকিলো...?") | Card title truncates at a defined max-lines (3) with ellipsis, never overflowing into the image area below; full title always available via the article's own `<h1>` and `<title>` tag. |
| **RTL/foreign-script fallback text** | Not expected for this content, but the font stack's fallback chain should not break silently if a stray Latin/emoji character appears mid-Bengali-sentence — confirmed via the font pairing in 2.2. |

---

## 4. Asset and Reference Management

### 4.1 Organizing references, comps, and tokens

```
/design
  /reference                  ← read-only; the 8 baseline screenshots + any future live-site captures
    index-light-desktop.png
    index-dark-desktop.png
    index-light-mobile.png
    index-dark-mobile.png
    article-light-desktop.png
    article-dark-desktop.png
    article-light-mobile.png
    article-dark-mobile.png
  /tokens
    colors.json                ← single source of truth, consumed by Tailwind config AND Figma via Tokens Studio
    typography.json
    spacing.json
  /comps                       ← Figma exports per milestone, named by milestone + page (see 4.2)
  /components                  ← Storybook stories double as living component specs
  CHANGELOG.md                 ← every visual decision that deviates from /reference, with the reason
```

- **Tokens are the single source of truth.** Colors/type/spacing are authored once as JSON (Section 2.1–2.3 values), then consumed by both the Tailwind config (`tailwind.config.ts` reads `colors.json`) and the Figma file (via a tokens plugin), so design and code can never silently drift apart.
- **Reference screenshots are read-only historical baseline** — they document what must be preserved or deliberately changed, and every deviation from them gets one line in `CHANGELOG.md` explaining why (e.g., "increased mobile tap-target on theme toggle from ~32px to 44px — accessibility floor, see Section 1.3").

### 4.2 File naming conventions

- **Comps:** `{milestone}-{page}-{state}-{breakpoint}.fig` / exported as `{milestone}-{page}-{state}-{breakpoint}.png` — e.g., `m2-article-comment-expanded-mobile.png`.
- **Components (code + Storybook):** PascalCase component name matching the Section 2.4 table exactly — `PostCard.tsx`, `ThemeToggle.tsx`, `BookmarkButton.tsx` — so a reviewer can go from this document's component table straight to the file with no translation step.
- **Tokens:** kebab-case CSS variable names exactly as listed in Sections 2.1–2.3 (`--color-accent`, `--text-card-title`) — these names are considered locked API once Phase 1 components consume them; renaming later is a breaking change requiring a CHANGELOG entry.

### 4.3 Handoff artifacts

- **Component spec sheet** per component: states table (from Section 2.4), token usage, accessibility notes (focus order, ARIA role), and a Storybook link — produced once per component, before that component's implementation PR, not retrofitted after.
- **Redline/spacing annotations:** generated directly from Figma's inspect panel against the token set (never freehand pixel values) — if a spacing value can't be expressed as one of the Section 2.3 tokens, that's a signal to either fix the design or deliberately add a new token (and document why).
- **Motion spec:** a short table of every animated transition (theme crossfade, card hover, toast enter/exit) with duration, easing curve, and the reduced-motion fallback — handed over as part of the component spec, not left to engineering's interpretation.

---

## 5. Prototyping and Validation Plan

### 5.1 Tools

- **Figma** for all comps and the token-linked design system (via Tokens Studio plugin, syncing to the `/design/tokens` JSON files in 4.1).
- **Storybook** as the living, browser-real component library — every component in Section 2.4 gets a story per state before it's considered "built," and Storybook (not static Figma comps) is the artifact engineering implements against once a component reaches that stage.
- **Real-content prototypes over Lorem Ipsum:** given how distinctive the existing Bengali long-form content and art-directed cover images are, every comp uses real (or real-length) Bengali sample text and actual reference cover images, not placeholder Latin text — a layout that looks fine with "Lorem ipsum" can break badly with real Bengali line-wrapping and conjunct-character rendering, so this is a functional check, not a polish step.

### 5.2 Milestones and review cadence

Aligned to the rebuild plan's phases so design never blocks (or gets surprised by) engineering sequencing:

| Milestone | Aligns to rebuild plan phase | Deliverable | Review |
|---|---|---|---|
| **M0 — Design system foundation** | Phase 0 (pre-flight) | Token set finalized (Section 2.1–2.3), core primitives in Storybook (button, link, input, focus states) | Stakeholder sign-off before any Phase 1 component is built against it |
| **M1 — Article + Index comps** | Phase 1 (Articles + Categories) | Full comps for index grid, article page, category/author archive, all states from Section 3.4, light + dark + mobile + desktop | Design review + a side-by-side diff against the 8 baseline screenshots — every intentional deviation must be called out and justified |
| **M2 — Auth comps** | Phase 2 (Auth) | Login/register/error states | Lightweight review — low visual risk, `noindex`, but accessibility review is mandatory (this is the page most likely to be used by a stressed/locked-out returning user) |
| **M3 — Comments + Bookmarks + Dashboard** | Phases 3–4 | Comment thread, bookmark interactions, dashboard layout | Design + a product review focused on the optimistic-update edge cases (3.4) |
| **M4 — Editor** | Phase 5 | Composer UI whose **preview pane is pixel-validated against the M1 article template** | Author/editor user-testing session (the actual people who will use this daily), not just internal design review |
| **M5 — Notifications, profile, activity** | Phase 6 | Minimal versions per rebuild plan's "simplify" mandate | Fast, low-ceremony review — explicitly scoped as "enrich later" |

**Standing cadence:** weekly design review during active milestone work; an async Slack/Linear thread for day-to-day component-level feedback so the weekly meeting is reserved for decisions, not status updates.

### 5.3 Criteria for approving a design before implementation begins

A milestone's comps are approved only when **all** of the following are true:

1. Every component used appears in the Section 2.4 table (or has been added to it with a justification) — no orphan one-off components.
2. Every color pairing has a documented, passing contrast ratio (Section 1.3 / 2.1).
3. Every page has a designed mobile *and* desktop version, plus dark mode for both — not light-desktop-only with "we'll figure out the rest later."
4. Every interactive element has a designed focus state, not just default/hover.
5. Every new screen has a designed empty, loading, and error state (Section 3.4) — not just the happy path.
6. Real Bengali sample content has been used, and line-wrapping/conjunct rendering has been visually checked, not assumed.
7. Where the comp deviates from the 8 baseline reference screenshots, the deviation is logged in `CHANGELOG.md` with a reason traceable to this document.
8. Stakeholder (the person who confirmed the rebuild plan's locked decisions) has explicitly signed off — silence is not approval.

---

## 6. Handoff and Collaboration

### 6.1 Deliverables for the frontend engineering team

- **Design tokens** as framework-agnostic JSON (Section 4.1), pre-wired into `tailwind.config.ts` so engineering consumes `bg-accent`, `text-muted`, etc. directly — never a hardcoded hex in a component file.
- **Component specs** (Section 4.3) for every component in the Section 2.4 table, each with a corresponding Storybook story per state, before that component's implementation ticket is picked up.
- **A CSS/Tailwind usage guideline** covering: the locked spacing scale (2.3), the rule that custom one-off pixel values require a documented exception, the breakpoint names and pixel values (2.5), and the motion/reduced-motion pattern (4.3) as a reusable utility rather than reimplemented per component.
- **An accessibility checklist** (derived from Section 1.3) attached to the Definition of Done for every UI ticket — contrast, focus, keyboard nav, ARIA, and `lang` attributes checked per-component before merge, not audited in bulk at the end.
- **The annotated baseline screenshots + CHANGELOG** (Section 4.1) so engineering can self-verify visual parity on anything not explicitly called out as changed — directly supporting the rebuild plan's shadow-diff and canary process, which compares *rendered HTML*, but benefits from engineering also having an eyes-on visual reference for the same routes.

### 6.2 Integration points with backend and API contracts

These are the frontend's *dependencies* on contracts the rebuild plan's backend phases must supply — listed here so design and API work can proceed in parallel without the frontend guessing at shapes:

| Frontend need | Backend contract required | Rebuild plan phase that owns it |
|---|---|---|
| Post card data (title, date, tags, cover image URL + dimensions, excerpt) for the index grid | A list endpoint returning exactly these fields, with image dimensions included server-side (required for CLS-safe `next/image` sizing without a client-side fetch) | Phase 1 |
| Article body as structured content (not raw HTML string) where possible, so headings/footnotes render as real semantic elements (Section 1.3) | Article body delivered as markdown/MDX or a structured JSON document model, not a pre-rendered HTML blob that the frontend can't safely restructure | Phase 1 |
| Theme preference persistence (optional, if synced server-side for logged-in users across devices) | A user-preference field on the account object | Phase 4/dashboard, optional enhancement |
| Bookmark state per post for the logged-in reader | An endpoint keyed by **stable post ID**, matching the rebuild plan's explicit requirement that bookmarks reference canonical IDs through the slug/redirect map | Phase 4 |
| Comment thread per article, with stable anchor IDs | Comments keyed to stable post/user IDs with preserved `#comment-{id}` anchors, per rebuild plan Phase 3 | Phase 3 |
| Search index (titles/tags/dates for client-side instant search, per 3.3) | Either a small JSON index endpoint or confirmation that the catalog is small enough to inline at build time via SSG | Phase 1 |
| Auth session state for conditionally showing comment/bookmark CTAs vs. login prompts | Session/cookie contract preserved exactly per rebuild plan Phase 2 (no separate frontend-only auth state that can drift from the real session) | Phase 2 |
| Editor preview parity | The editor's save/preview endpoint must return content that resolves through the *same* rendering path as the live article page (Section 3.2 Journey D) — no separate "preview renderer" that can silently diverge | Phase 5 |

**Working agreement:** no frontend component ships against a *mocked* version of one of the contracts above past its milestone's comp-approval stage (Section 5.3) — once M1 comps are approved, the Phase 1 API contract must be real (even if backed by the read-replica, per the rebuild plan's data architecture) before the corresponding components are merged to the main branch.

---

## Guiding Principle (frontend-specific)

The existing site already has a real, recognizable identity — a marigold mark, a literary Bengali voice, art-directed and symbolic cover imagery, a dark mode readers actually use. The job of this rebuild's frontend is **fidelity and polish, not reinvention**: tighten the token system, fix the accessibility and CLS gaps a stock starter theme leaves on the table, and add the few genuinely missing affordances (series navigation, live search feedback, accessible footnotes) — without sanding off the parts of the design that already make this site feel like itself.
