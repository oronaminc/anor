# CLAUDE.md

Guidance for Claude Code (and humans) working in this repo.

## What this is

A mobile-first web app for discovering Myeongdong (Seoul) street food:
trending feed, rankings, search, and a Google Map of stalls. Korean is the
default locale; EN / JA / ES are also supported.

## Stack

- **Next.js (App Router)** + React + TypeScript
- **Tailwind CSS** with CSS-variable design tokens (`app/globals.css`)
- **next-intl** for i18n (`messages/{ko,en,ja,es}.json`, `middleware.ts`)
- **Neon Postgres** (`@neondatabase/serverless`, raw SQL in `lib/db.ts`) for data
- **Admin auth**: password + signed HttpOnly cookie (Web Crypto HMAC in
  `lib/session.ts` / `lib/auth.ts`) — no external auth service
- **Cloudflare R2** (`aws4fetch`, `lib/storage.ts`) for thumbnail images; the DB
  stores only the public URL
- **@react-google-maps/api** for the map
- **framer-motion**, **lucide-react**, Radix primitives (`components/ui`)
- Tests: **vitest** (unit), **Playwright** (e2e)

## Commands

```bash
npm run dev        # next dev (default port 3000)
npm run build      # db:push (schema sync) then production build
npm run start      # serve the build
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
npm run test       # vitest unit tests
npm run test:e2e   # playwright (builds + starts, runs chromium + mobile)
npm run db:push    # apply db/schema.sql to DATABASE_URL (idempotent; no-op w/o DB)
npm run db:seed    # insert the demo foods (db/seed.sql) into the DB (idempotent)
npm run db:seed:clear  # remove ONLY the demo foods (thumbnail_url like /demo/%)
```

### Database migrations are automatic — do NOT hand-paste SQL

`scripts/db-push.mjs` applies `db/schema.sql` idempotently and runs
**automatically as part of `npm run build`** (so every Vercel deploy syncs the
schema), and on demand via `npm run db:push`. It loads `.env.local` itself and
no-ops when `DATABASE_URL` is absent (CI/demo).

So when a feature needs a schema change, **edit `db/schema.sql` only**, using
idempotent DDL — `create table if not exists`, `create index if not exists`,
`create or replace function`, and for new columns
`alter table ... add column if not exists`. The next deploy (or a local
`npm run db:push`) applies it; nobody touches the Neon console.

Destructive changes (drop/rename column or table) are NOT idempotent — write
those as a deliberate, guarded one-off and call it out explicitly.

Node 22 in CI. Playwright e2e `webServer` runs `build && start`; locally it
reuses an already-running server (`reuseExistingServer` when not CI).

## Running / screenshots without a backend

`lib/queries.ts` is resilient: when `DATABASE_URL` is **absent** (or
`NEXT_PUBLIC_DEMO_MODE=1`), public pages render the built-in sample dataset
(`lib/demo-data.ts`, thumbnails in `public/demo/*.svg`). So `npm run dev` works
with **zero config** — no `.env.local` needed for UI work. With `DATABASE_URL`
configured it always uses the real DB. The map shows a "no API key" placeholder
locally; it renders normally when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set.

**Run with a real backend (Neon + R2).** Copy `.env.local.example` →
`.env.local` and set at least `DATABASE_URL` (Neon connection string),
`ADMIN_PASSWORD` + `SESSION_SECRET` (admin login), and `IP_HASH_SALT`. Apply the
schema once — `psql "$DATABASE_URL" -f db/schema.sql` (then `db/seed.sql` for
sample rows). `R2_*` enables image upload; without it the admin form falls back
to pasting an image URL. Full var list + deploy steps: `.env.local.example` and
`DEPLOY.md`.

To screenshot a page headlessly (mobile viewport), see the recipe in `SKILL.md`.

## Layout

```
app/
  layout.tsx              # root: fonts, ThemeScript, cyber-bg, providers
  (public)/
    page.tsx              # HOME — Threads-style single-column feed
    food/[id]/page.tsx    # detail
    map/  search/  trending/
  (admin)/admin/...       # CRUD + login + analytics (password cookie auth)
  api/foods/[id]/view     # view-count increment
  api/foods/[id]/like     # anonymous like toggle (IP-deduped)
  api/search/log          # search-term collection (analytics)
  robots.ts  sitemap.ts   # SEO; /admin + /api are disallowed/noindex
components/
  FoodPost.tsx            # Threads-style feed row (home)
  FoodExplorer.tsx        # the home feed (sort tabs + list of FoodPost)
  FoodCard.tsx            # grid/carousel card (search, trending pages)
  TrendingSection / RankingSection   # used on /trending (not home anymore)
  GoogleMap, SearchView, SiteHeader, BottomNav, HighlightText, ViewTracker
  LikeButton.tsx          # anonymous, optimistic, localStorage dedupe
  theme/                  # ThemeProvider, ThemeScript, theme.ts
  AppearancePanel / AppearanceSheet  # mode + accent + language picker
  admin/                  # FoodForm, DeleteFoodButton, TrendingToggle
lib/
  queries.ts demo-data.ts sort.ts i18n-food.ts maps.ts utils.ts types.ts env.ts
  db.ts                   # Neon sql client (lazy; getSql())
  search.ts               # normalizeQuery (shared client/server)
  session.ts              # Web Crypto HMAC sign/verify (edge + node)
  auth.ts storage.ts ip.ts rate-limit.ts request-guard.ts  # server-only
messages/                 # ko (default), en, ja, es
db/                       # schema.sql + seed.sql (Neon Postgres)
tests/                    # unit/ (vitest), e2e/ (playwright)
```

## Engagement, analytics & admin security

- **Shop counts (real + synthetic) — IMPORTANT**: the displayed view/like count
  is **`view_count + synthetic_view_count`** (and like equivalent), two **stored**
  integers summed in `lib/counts.ts` (`totalViews`/`totalLikes`); `queries.ts`
  overwrites `shop.view_count`/`like_count` with the totals. **No compute-on-read
  growth, no live ticker** — the number only moves when the DB moves, so home,
  cards and detail always agree. *Real* = `view_count` (`increment_shop_view`) +
  `like_count` (`toggle_shop_like`, one-per-IP via `shop_likes`). *Synthetic* =
  admin "+1K", Telegram `/boost`, and the 5-min growth cron (`/api/cron/grow`,
  `applyGrowthTick`, GitHub Actions `grow.yml`, `CRON_SECRET`). **Invariant:**
  total views are ALWAYS > total likes — enforced atomically in `applyBoost`
  /`applyGrowthTick` SQL and mirrored + fuzz-tested in `lib/counts.ts`
  (`cappedLikeInc`/`likeBoostViewLift`, `tests/unit/counts.test.ts`).
  *Bugs fixed, don't reintroduce:* (1) compute-on-read organic growth →
  home≠detail / like drift — deleted `lib/growth.ts`+ticker, persist everything;
  (2) stale client/router cache showed an old detail count on home→detail — pages
  are `force-dynamic`, `staleTimes {dynamic:0,static:0}`, shop links
  `prefetch={false}`, and detail counts **reconcile to a fresh fetch on mount**
  (`ShopViewCount` via `POST /view`, `LikeButton` via `GET …/like`). Consistency
  guarded by `tests/e2e/counts.spec.ts`; capacity by `npm run stress`
  (`scripts/stress.mjs`, ~100 concurrent reads at 100%/p95≈1s). See `SKILL.md` §6.
- **Data access**: `lib/db.ts` exposes `getSql()` (lazy Neon client). Query with
  tagged templates (`await getSql()\`SELECT ... ${id}\``) and call the SQL
  functions directly (`SELECT * FROM toggle_like(${id}, ${ipHash})`). Always
  guard with `hasDb()` (`lib/env.ts`) and fall back to demo data when absent.
- **Likes** (`/api/foods/[id]/like` + `LikeButton`): no login. The hard
  "one like per IP" guarantee is the DB UNIQUE on `food_likes (food_id,
  ip_hash)` via the `toggle_like` function; the client also keeps a localStorage
  flag for instant UX. Raw IPs are never stored — only `sha256(ip +
  IP_HASH_SALT)` (`lib/ip.ts`); IP comes from `cf-connecting-ip`/`x-real-ip`.
- **Search collection** (`/api/search/log`): `SearchView` fire-and-forgets the
  settled query → `log_search` → `search_events`. Shown at `/admin/analytics`.
- **Abuse defenses** on all write APIs: same-origin guard (`lib/request-guard`,
  blocks other sites' JS), per-IP rate limit (`lib/rate-limit`, Upstash REST if
  configured else in-memory), UUID validation, generic errors. No-op in demo.
- **Admin is private**: login = `ADMIN_PASSWORD` (or `ADMIN_PASSWORD_HASH`) →
  signed cookie (`SESSION_SECRET`). Gated in middleware + admin layout + server
  actions (`isAdmin()` in `lib/auth.ts`); plus `noindex`, robots `Disallow`,
  `Cache-Control: no-store`. See `DEPLOY.md`.
- **Images**: admin upload → `lib/storage.ts` (R2); DB stores only the URL.
- Schema lives in `db/schema.sql` (+ `db/seed.sql`). `Food` has `like_count`;
  keep it set in `demo-data.ts` and any new fixtures.

## Design system — IMPORTANT

The app was redesigned to a **clean monochrome black & white** look (was a
neon "K-Demon-Hunters × cyberpunk" theme). Keep new UI consistent with this:

- All color comes from grayscale CSS variables in `app/globals.css`
  (`:root` = light/paper, `.dark` = dark/ink). Use `text-foreground`,
  `text-muted-foreground`, `bg-card`, `border-border`, `bg-primary`, etc.
  **Do not introduce colored/neon literals** (no `text-pink-*`, `#ff…`,
  saturated hsl). Destructive red is the only retained hue.
- Legacy utility classes still exist but are **neutralized**: `glow*` →
  soft neutral shadow, `gradient-text` → solid foreground, `bg-holo` → solid
  primary, `text-glow` → none, `animate-holo` → none, `neon-border` → plain
  hairline. Prefer plain Tailwind for new code.
- The accent picker (`theme.ts` / AppearancePanel) is effectively a **no-op**:
  every preset resolves to the same monochrome palette by design. Swatches are
  grayscale. If you re-enable colored themes, that's a deliberate product
  change.
- Home is a **Threads-style feed**: single column, small thumbnails, hairline
  dividers (`divide-border`), minimal underline sort tabs, calm hero. The
  trending carousel and ranking card were removed from home (ranking still
  lives on `/trending`).
- Demo thumbnails (`public/demo/*.svg`) are refined **graphite monotones**, not
  neon — keep that if you add more.
- Typography is intentionally restrained (hero ~20px; section headers `text-base`).

## i18n

Every user-facing string goes through next-intl. Server components use
`getTranslations(ns)`; client components use `useTranslations(ns)`. Add keys to
**all four** `messages/*.json`. Food names/descriptions are localized via
`lib/i18n-food.ts` (`localizedName`, `secondaryName`, `localizedDescription`).

## Git / pushing

`origin` is set to GitHub over **SSH on port 443** (`ssh://git@ssh.github.com:443/oronaminc/anor.git`)
because plain SSH (22) and authenticated HTTPS are blocked on this machine.
`git push` / `git fetch` work normally with that URL. There is **no `gh` CLI
and no GitHub token** in this environment, so PRs/MRs cannot be opened
programmatically — open them in the GitHub UI (compare link), or merge to
`main` locally and push. End commit messages with the project's
`Co-Authored-By` trailer.

## Conventions

- Match surrounding code style; keep components small and composable.
- Server components by default; add `"use client"` only when needed (hooks,
  state, framer-motion).
- Run `npm run typecheck` and `npm run build` before shipping; keep the two
  e2e home assertions passing (hero heading + a `전체 메뉴` heading — the latter
  is an `sr-only` heading in `FoodExplorer`).
