# CLAUDE.md

Guidance for Claude Code (and humans) working in this repo.

**This file = what the system is and which rules must hold.**
For step-by-step recipes (run it, screenshot it, verify it, push it, manage
content) see [`SKILL.md`](SKILL.md). Deployment/env setup: [`DEPLOY.md`](DEPLOY.md).
Newcomer overview: [`README.md`](README.md).

## What this is

A mobile-first web app for discovering Myeongdong (Seoul), aimed at Japanese
women tourists — **헬로 명동 / ハロー明洞**, live at **hellomyeongdong.com**.
Three content pillars: **street food** stalls, **Olive Young** K-beauty, and
**Daiso** goods — each with a trending/ranking feed, one unified search, and a
Google Map of locations. The brand copy (`common.appName`/`tagline`/
`description`) must stay pillar-neutral: it names the whole guide, not food.
**Japanese is the default locale**; Korean is the only other UI language.

## Stack

- **Next.js (App Router)** + React + TypeScript
- **Tailwind CSS** with CSS-variable design tokens (`app/globals.css`)
- **next-intl** for i18n (`messages/{ja,ko}.json`, `middleware.ts`; ja default)
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

### Database migrations — do NOT hand-paste SQL

`scripts/db-push.mjs` applies `db/schema.sql` idempotently. It loads
`.env.local` itself and no-ops when `DATABASE_URL` is absent (CI/demo).

So when a feature needs a schema change, **edit `db/schema.sql` only**, using
idempotent DDL — `create table if not exists`, `create index if not exists`,
`create or replace function`, and for new columns
`alter table ... add column if not exists`. Then apply it with
`npm run db:push`; nobody touches the Neon console.

**It does NOT run on deploy, despite the name of the `build` script.**
`package.json` has `"build": "node scripts/db-push.mjs && next build"`, but
`vercel.json` sets `"buildCommand": "next build"`, which wins — so Vercel skips
the schema sync. **Run `npm run db:push` yourself after changing the schema.**
Pointing `buildCommand` at `npm run build` would automate it, at the cost of
coupling deploys to the database: `db-push.mjs` exits 1 on failure, so any DB
outage (see the compute-quota note below) would then break every deploy instead
of just leaving the site empty. Decide deliberately; don't "fix" it by accident.

Destructive changes (drop/rename column or table) are NOT idempotent — write
those as a deliberate, guarded one-off and call it out explicitly.

Node 22 in CI. Playwright e2e `webServer` runs `build && start`; locally it
reuses an already-running server (`reuseExistingServer` when not CI).

## Demo fallback — why the app runs with zero config

`lib/queries.ts` is resilient: when `DATABASE_URL` is **absent** (or
`NEXT_PUBLIC_DEMO_MODE=1`), public pages render the built-in sample dataset
(`lib/demo-data.ts`, thumbnails in `public/demo/*.svg`). So `npm run dev` works
with **no `.env.local`** for UI work. With `DATABASE_URL` configured it always
uses the real DB. The map shows a "no API key" placeholder locally; it renders
normally when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set.

Keep this property when adding queries: guard with `hasDb()` (`lib/env.ts`) and
fall back to demo data, or UI work breaks for anyone without a database.

→ Running it for real, screenshots: `SKILL.md` §1–§2. Env vars: `DEPLOY.md`.

## Layout

```
app/
  layout.tsx                    # root: fonts, ThemeScript, bg, providers
  (public)/
    page.tsx                    # HOME — street-food Threads-style feed
    shop/[id]/  s/[code]/       # street-food detail + short link
    beauty/  daiso/             # Olive Young / Daiso rankings (+ product search)
    product/[id]/  p/[code]/    # product detail + short link
    trending/                   # UNIFIED hub: 길거리 + 올영 + 다이소 carousels
    map/  search/               # street-food map + UNIFIED 3-pillar search
  (admin)/admin/
    page.tsx  shops/…           # street-food CRUD
    products/…                  # Olive Young / Daiso CRUD
    login/  analytics/          # password-cookie auth + search analytics
  api/shops/[id]/{view,like}    # street-food count APIs
  api/products/[id]/{view,like} # product count APIs (mirror shops)
  api/search/log  api/cron/grow  api/telegram/webhook
  robots.ts  sitemap.ts         # SEO; /admin + /api disallowed/noindex
components/
  ShopPost / ShopExplorer / ShopCard   # street-food home feed + cards
  TrendCarousel.tsx             # one trending strip (used ×3 on /trending)
  RetailRankingPage / RetailRankingView  # /beauty + /daiso (search + chips + list)
  ProductViewCount / ProductLikeButton / RetailerBadge  # retail (mirror shop ones)
  ProductListItem.tsx           # product row: ranking (rank) + search (highlight)
  GoogleMap MapEmbed MapExplorer SearchView SiteHeader BottomNav LikeButton ShareButton
  PayPayBadge CertifiedBadge TrendingFlame HighlightText
  theme/                        # ThemeProvider, ThemeScript, theme.ts
  AppearancePanel / AppearanceSheet / LanguageSwitcher
  admin/                        # ShopForm, ProductForm, ProductAdminControls, …
lib/
  queries.ts (shops)  products.ts (retail)  retailers.ts (retailer meta+taxonomy)
  demo-data.ts  products-demo.ts  sort.ts  i18n-food.ts  counts.ts
  maps.ts utils.ts types.ts env.ts db.ts (lazy getSql())  search.ts  session.ts
  product-search.ts             # pure ko+ja product matcher (search + rankings)
  auth.ts storage.ts ip.ts rate-limit.ts request-guard.ts  # server-only
messages/                       # ja (default), ko
db/                             # schema.sql + seed.sql (Neon Postgres)
scripts/                        # seed-products, regen-product-tiles, sync-stores,
                                # csv, data-export/sync, db-push, stress, …
tests/                          # unit/ (vitest), e2e/ (playwright)
```

## Engagement, analytics & admin security

- **Shop counts (real + synthetic) — IMPORTANT**: the displayed view/like count
  is **`view_count + synthetic_view_count`** (and like equivalent), two **stored**
  integers summed in `lib/counts.ts` (`totalViews`/`totalLikes`); `queries.ts`
  overwrites `shop.view_count`/`like_count` with the totals. **No compute-on-read
  growth, no live ticker** — the number only moves when the DB moves, so home,
  cards and detail always agree. *Real* = `view_count` (`increment_shop_view`) +
  `like_count` (`toggle_shop_like`, one-per-IP via `shop_likes`). *Synthetic* =
  admin "+1K", Telegram `/boost`, and the **hourly** growth cron
  (`/api/cron/grow` → `growAllShops`, GitHub Actions `grow.yml`, `CRON_SECRET`;
  one call = `TICKS_PER_RUN` 5-min ticks, so the rate per hour is unchanged).
  **Database compute is the budget, not a free resource** — the cron must grow
  the whole table in ONE statement and must leave hour-long gaps so the
  serverless compute can auto-suspend. Growing row-by-row every 5 minutes is
  what exhausted the Neon quota on 2026-07-26: every query returned HTTP 402 and
  the whole live site rendered its "no shops yet" empty state, because
  `getShops`/`getProducts` swallow errors and return `[]`. **Invariant:**
  total views are ALWAYS > total likes — enforced atomically in `applyBoost`
  /`applyGrowthTick` SQL and mirrored + fuzz-tested in `lib/counts.ts`
  (`cappedLikeInc`/`likeBoostViewLift`, `tests/unit/counts.test.ts`).
  *Bugs fixed, don't reintroduce:* (1) compute-on-read organic growth →
  home≠detail / like drift — deleted `lib/growth.ts`+ticker, persist everything;
  (2) stale client/router cache showed an old detail count on home→detail — pages
  are `force-dynamic`, `staleTimes {dynamic:0,static:0}`, shop links
  `prefetch={false}`, and **every surface now renders one shared cached snapshot**
  (see "Read caching" below), so they agree by construction. Detail counts used
  to reconcile to a fresh fetch on mount; that is **removed on purpose** — it
  cost 3 queries per detail open. Consistency guarded by
  `tests/e2e/counts.spec.ts`, traffic by `tests/e2e/db-traffic.spec.ts`, capacity
  by `npm run stress` (`scripts/stress.mjs`). See `SKILL.md` §6.
- **Read caching — the database budget is COMPUTE TIME, not queries.** Neon's
  compute wakes on any query and only suspends after ~5 idle minutes, so a
  trickle of traffic spread through the day keeps it billing 24/7. Every public
  read therefore goes through `lib/cache.ts` (`cachedRead` → `unstable_cache`,
  tags `shops`/`products`, TTL `DB_CACHE_TTL_SECONDS`, default 1h to match the
  growth cron). Rules:
  - **Never set a TTL near the ~5-minute suspend delay** — the refreshes alone
    would keep the compute permanently awake, which defeats the whole thing.
  - Loaders **throw** on DB errors and the exported wrappers catch; a rejected
    promise isn't cached, so an outage can't be stored as "no content" for a
    whole TTL.
  - Admin mutations call `revalidateShops()`/`revalidateProducts()` so edits
    publish instantly. **Views/likes must NOT revalidate** — busting the cache on
    engagement would restore the per-visit query it exists to avoid.
  - A view is recorded fire-and-forget and deduped per device for 6h
    (`lib/record-view.ts`); `/view` routes are **write-only** (no read-back).
- **Content / media model** — the *rules*; the commands are in `SKILL.md` §7.
  Shops/foods/photos are managed from **gitignored CSVs + Cloudflare R2**, never
  by hand-editing the DB.
  - **`districts` is the location master.** A shop stores only a `district` code
    (e.g. `52-A`, free text) and **no coordinates**; lat/lng resolve by JOIN at
    read time. Move a zone once → every shop in it moves.
  - **R2 keys are stable** (`foods/<slug>.<ext>`), so replacing a file in the
    Cloudflare dashboard updates the app with **no DB change**. The DB stores
    only the URL. **A sync never touches counts.**
  - **Categories** (`shops.categories text[]`, ≈20 fine codes in
    `lib/categories.ts`, each holding ≤10 shops) are separate from the specific
    menu foods and drive the map + home-feed filters. Split finely so no category
    is unwieldy on the map. The home feed lazy-loads 24 at a time.
  - **Maps cost is deliberate**: `/map` filters client-side (no extra Maps
    loads), the home map is lazy (`LazyGoogleMap`), detail uses the free **Maps
    Embed API** (`MapEmbed`), and **only `/map` uses the billed Dynamic map.**
    Don't add a Dynamic map elsewhere without meaning to.
  - Per-shop `pay_pay` drives the PayPay badge (`components/PayPayBadge`; LINE
    Pay merged into PayPay in 2025). Raster photos animate via `.animate-photo`
    (CSS Ken-Burns); animated webp/SVG keep their own motion (`unoptimized`).
- **Data access**: `lib/db.ts` exposes `getSql()` (lazy Neon client). Query with
  tagged templates (`await getSql()\`SELECT ... ${id}\``) and call the SQL
  functions directly (`SELECT * FROM toggle_shop_like(${id}, ${ipHash})`). Always
  guard with `hasDb()` (`lib/env.ts`) and fall back to demo data when absent.
- **Likes** (`/api/shops/[id]/like` + `LikeButton`; products mirror this at
  `/api/products/[id]/like`): no login. The hard "one like per IP" guarantee is
  the DB UNIQUE on `shop_likes (shop_id, ip_hash)` via the `toggle_shop_like`
  function (`product_likes` + `toggle_product_like` for products); the client
  also keeps a localStorage
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

## Retail pillar (올리브영 + 다이소) — second content axis

Beyond street food, the app now ranks **Olive Young cosmetics** and **Daiso
goods**. It's a parallel model to shops, deliberately kept separate (less risk
than generalizing `shops`):

- **Data**: `products` table (`db/schema.sql`) — `retailer` (`olive_young` |
  `daiso`), `brand`, `category` (code within the retailer taxonomy), price,
  thumbnail, `is_trending`, `short_id` (→ `/p/{n}`), and the SAME count
  architecture as shops (real + `synthetic_*`, displayed = totals, **invariant
  total views > total likes** enforced atomically in `toggle_product_like` and
  `boostProduct`). `retail_stores` holds each retailer's Myeongdong locations
  (the "where to buy" map). `product_likes` = one like per IP.
- **Metadata**: `lib/retailers.ts` (isomorphic) — retailer labels/accent/emoji
  + the fixed per-retailer category taxonomy (`RETAIL_CATEGORIES`). Brand accent
  hexes (OY green `#00A54F`, Daiso red `#E60012`) are functional accents like
  PayPay red / certified blue — used only on the badge + active chip.
- **Queries**: `lib/products.ts` (server-only, demo fallback via
  `lib/products-demo.ts`). Localization reuses `lib/i18n-food.ts`
  (`localizedName`/`localizedPrice` etc — ja shows ¥ at ₩÷10, same rule).
- **Public**: `/beauty` + `/daiso` (`RetailRankingPage` → `RetailRankingView`:
  a per-page product **search** (`filterProducts`, see "Search is unified" below)
  plus category chips + view-ranked list),
  `/product/[id]` detail (lists ALL of the retailer's Myeongdong stores — every
  product is sold at every store), `/p/[code]` short link, view/like APIs under
  `/api/products/[id]/*` (mirror the shop ones).
- **Search is unified**: `/search` (`SearchView`) covers ALL three pillars with
  scope chips (전체 / 길거리 음식 / 올리브영 / 다이소). Every pillar is filtered on
  each keystroke so the chips can show live hit counts; 전체 groups results into
  per-pillar sections. Product matching lives in `lib/product-search.ts`
  (`filterProducts` — name ko/ja/en + brand + the category label in BOTH
  languages) and is shared with the ranking pages, so both agree on a "match".
  Shops still use `filterShops` (`lib/sort.ts`). All filtering is client-side.
- **Nav / trending**: bottom nav = 길거리(홈)·올영·다이소·트렌딩·검색 — **no map
  tab** (`/map` is reached from detail pages). `/trending` is a **unified hub**:
  three `TrendCarousel` strips (길거리 음식 + 올리브영 + 다이소), each
  trending-first then top-viewed. (Legacy `TrendingSection`/`RankingSection` are
  superseded there.)
- **Admin**: `/admin/products` (list) + new/edit (`components/admin/ProductForm`,
  `app/(admin)/admin/products/actions.ts`, controls in `ProductAdminControls`).
- **Seed / scripts** (all read `data/retail-data.json`, gitignored):
  `scripts/seed-products.mjs` writes brand-toned **SVG placeholder tiles** to
  `public/products/*.svg`, inserts 24 Olive Young + 24 Daiso products + the
  stores, and regenerates `lib/products-demo.ts` (**re-inserting resets counts —
  run once**). `scripts/regen-product-tiles.mjs` rewrites ONLY the tiles in place
  (stable filenames → DB/counts untouched). `scripts/sync-stores.mjs` replaces
  `retail_stores` (**8 Olive Young + 2 Daiso** Myeongdong stores) + regenerates
  the demo store list, without touching products. Real product photos are **not**
  rehosted (copyright) — swap one per product via the admin form (R2), same
  pipeline as food. Product data is real, currently-popular 2025-2026 items
  (several 2025 Olive Young Awards winners); prices/availability are best-effort,
  not a live scrape.

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

## i18n — IMPORTANT

The app ships **Japanese (default) + Korean only** (`i18n/config.ts`,
`defaultLocale: "ja"`). There is no English/Spanish UI (`messages/en.json` and
`es.json` were removed). Locale is a `NEXT_LOCALE` cookie (no URL routing); the
`LanguageSwitcher` does a full `window.location.reload()` after setting it so the
new locale reliably applies.

**Every user-facing string goes through next-intl** — no hardcoded labels (that
was the certified-badge bug: it hardcoded Korean "인증"). Server components use
`getTranslations(ns)`, client components `useTranslations(ns)`; a small
label-only component that renders inside a server page can be `"use client"` to
use the hook. Add every key to **both** `messages/ja.json` AND `messages/ko.json`.

**Write PROPER, natural translations for BOTH languages — never a literal /
machine translation.** Verify the term is actually idiomatic in each language.
(e.g. official vendor certification is Japanese `認定`/`公認`, NOT `認証`, which
means technical/login authentication.) When the owner asks for a new/changed
string, produce the natural ja + ko wording, not a direct gloss. A missing key
breaks that language outright.

**Brand names stay untranslated**: PayPay, Olive Young (nav abbrev オリヤン /
올영), Daiso (ダイソー / 다이소). Food names/descriptions are localized via
`lib/i18n-food.ts` (`localizedName`, `secondaryName` shows the ja↔ko pair,
`localizedDescription`); `localizedPrice` shows ¥ at ₩÷10 for ja.

## Git / pushing

`origin` is `ssh://git@ssh.github.com:443/oronaminc/anor.git` — GitHub over **SSH
on port 443**, historically the reliable path here (plain SSH:22 and authenticated
HTTPS have both been blocked at times). **This is fluid.** If 443 stalls
(`Connection timed out during banner exchange`), plain **SSH port 22 has worked** —
push via the explicit URL and then sync the tracking ref:

```bash
git push ssh://git@github.com/oronaminc/anor.git main
git update-ref refs/remotes/origin/main HEAD
```

Read-only verification always works over HTTPS:
`git ls-remote https://github.com/oronaminc/anor.git refs/heads/main`. There is
**no `gh` CLI and no GitHub token** — open PRs in the GitHub UI (compare link), or
merge to `main` locally and push. End commit messages with the project's
`Co-Authored-By` trailer.

## Conventions

- Match surrounding code style; keep components small and composable.
- Server components by default; add `"use client"` only when needed (hooks,
  state, framer-motion).
- Run `npm run typecheck` and `npm run build` before shipping; keep the two
  e2e home assertions passing (hero heading + a `전체 메뉴` heading — the latter
  is an `sr-only` heading in `ShopExplorer`).
- Add every new user-facing string to **both** `messages/ja.json` and
  `messages/ko.json` (ja is default) — natural translations, never a gloss.
