# SKILL.md

**Repeatable recipes — how to do things.** The architecture, invariants and
rules they rest on live in [`CLAUDE.md`](CLAUDE.md); this file does not repeat
them. Deployment/env: [`DEPLOY.md`](DEPLOY.md).

## 1. Run the app locally (zero config)

No `.env.local` is required for UI work — demo data renders automatically.

```bash
npm install            # first time
PORT=3210 npm run dev  # any free port
# open http://localhost:3210
```

To force the demo dataset even with a database configured, set
`NEXT_PUBLIC_DEMO_MODE=1`.

**With a real backend (Neon + R2):** copy `.env.local.example` → `.env.local`,
set `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `IP_HASH_SALT` (+ `R2_*`
for image upload), then apply the schema once:

```bash
psql "$DATABASE_URL" -f db/schema.sql   # tables + functions
psql "$DATABASE_URL" -f db/seed.sql     # (optional) 8 sample foods
```

Admin login is at `/admin/login` (password = `ADMIN_PASSWORD`). See `DEPLOY.md`.

## 2. Headless screenshot (mobile viewport)

Used to review visual changes. Requires the Chromium browser once:

```bash
npx playwright install chromium
```

Save this as a temp script **inside the repo** (so `playwright` resolves) and
run it while `dev` is up:

```js
// _shot.mjs  (delete after use)
import { chromium } from "playwright";
const base = "http://localhost:3210";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
async function shot(theme, file) {
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((t) => { try { localStorage.setItem("md.mode", t); } catch {} }, theme);
  // Use domcontentloaded, not networkidle: the external Google Fonts <link>
  // can keep the page from ever reaching "idle" in a sandbox/offline shell.
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: file, fullPage: true });
}
await shot("dark", "/tmp/home-dark.png");
await shot("light", "/tmp/home-light.png");
await browser.close();
```

```bash
node _shot.mjs && rm _shot.mjs   # outputs /tmp/home-{dark,light}.png
```

Theme is controlled by `localStorage` key `md.mode` (`light|dark|system`) and
`md.accent` (`huntrix|sax|lavender|gold|demon` — all monochrome now).

## 3. Theming (monochrome)

All design tokens live in `app/globals.css` under `:root` (light) and `.dark`.
Change the look by editing those HSL variables — components reference them via
Tailwind (`bg-card`, `text-muted-foreground`, `border-border`, …). Keep values
desaturated (`0 0%` lightness-only) to preserve the black & white system. See
the "Design system" section of `CLAUDE.md` for the rules and which legacy
utility classes are neutralized.

## 4. Verify before shipping

```bash
npm run typecheck
npm run build
npx vitest run                                   # unit (counts/session/ip/rate-limit/…)
npx playwright test --project=chromium           # e2e: home/search/like/counts
npm run stress -- https://anor-sable.vercel.app /  # load test (read-only)
```

e2e specs: `home` (hero + `전체 메뉴` `sr-only` heading), `search` (filter by
ko/en, empty state), `like` (optimistic toggle), and `admin-login` — the last
**self-skips** unless `ADMIN_PASSWORD` is set for both the server and the test
runner. To exercise login locally:

```bash
ADMIN_PASSWORD=x SESSION_SECRET=y PORT=3210 npm run start &   # in one shell
PORT=3210 ADMIN_PASSWORD=x npx playwright test tests/e2e/admin-login.spec.ts --project=chromium
```

The home e2e asserts a hero heading and a `전체 메뉴` heading (an `sr-only` `<h2>`
in `components/ShopExplorer.tsx`) — keep it (or update the test) if you
restructure the feed.

**Korean assertions need the cookie, not the browser locale.** The app never
sniffs `Accept-Language` — locale is the `NEXT_LOCALE` cookie only (ja default),
so `test.use({ locale: "ko-KR" })` alone leaves the page in Japanese. Set the
cookie in a `beforeEach` (see `tests/e2e/home.spec.ts`).

Two local gotchas when running e2e by hand: `next start` still loads
`.env.local`, so the write APIs hit the **real DB** unless you pass an empty
`DATABASE_URL=`; and if the port is already taken the new server dies with
`EADDRINUSE` while the tests silently run against the **old** one — check the
server log says `Ready` before trusting a run.

## 5. Push / open a PR

Remote quirks (SSH over 443, the port-22 fallback, no `gh` CLI) are explained in
`CLAUDE.md` § "Git / pushing" — read that first if a push stalls. Normal case:

```bash
git push                      # works for the current branch
git push -u origin <branch>   # new branch
```

PRs can't be created from the shell (no `gh` / token). Either:

- open one in the GitHub UI:
  `https://github.com/oronaminc/anor/compare/main...<branch>?expand=1`, or
- merge locally and push `main`:
  ```bash
  git checkout main
  git merge --no-ff <branch> -m "Merge: <summary>"
  git push
  ```

End commit messages with the `Co-Authored-By` trailer used across the history.

## 6. Engagement counts — operating & verifying them

The count model, its invariant (**total views ALWAYS > total likes**) and the
two bugs never to reintroduce are documented in `CLAUDE.md` § "Engagement,
analytics & admin security". **Read that before touching count code.** Here are
the operational bits:

**Growth cron.** GitHub Actions (`.github/workflows/grow.yml`, **hourly**) →
`POST /api/cron/grow` (header `x-cron-secret: $CRON_SECRET`) → `growAllShops`
adds a small random amount to every shop's synthetic columns in ONE statement.
Set `CRON_SECRET` in **both** the Vercel env and the GitHub repo secret — a
mismatch silently stops growth (the endpoint just 401s).

Hourly, batched, and unchanged in rate (one call = `TICKS_PER_RUN` 5-min ticks)
— all three on purpose. The old version ran one UPDATE **per shop** every 5
minutes, so Neon's compute never got its 5-minute idle window and the monthly
compute quota ran out; every query then failed with **HTTP 402** and the site
silently rendered empty. Don't shorten the interval or go back to a loop.

**Site suddenly empty on every page?** Check the database before the code — the
queries swallow errors and return `[]`, which looks identical to "no content":

```bash
node -e 'import("./scripts/lib.mjs").then(async (m)=>{m.loadEnvLocal();
  try{console.log(await m.neon(m.databaseUrl())`select count(*) from shops`)}
  catch(e){console.log("DB DOWN:",e.message)}})'
```

**Verify a change to counts:**

```bash
npx vitest run tests/unit/counts.test.ts        # invariants, fuzzed 2000× each
npx playwright test tests/e2e/counts.spec.ts    # home card ↔ detail consistency
npm run stress -- https://anor-sable.vercel.app /   # read-only load test
```

`stress` (`scripts/stress.mjs`) ramps concurrency and reports success% / latency
/ the healthy ceiling. Baseline: **~100 concurrent reads at 100% success,
p95 ≈ 1 s** (Vercel auto-scales; Neon connections are the real ceiling).

## 7. Content management — CSV + R2 (`data/` is gitignored, never pushed)

Manage shops/foods/photos from human-editable CSVs + Cloudflare R2, not the DB
by hand:

```bash
npm run data:export   # DB -> data/{shops,foods,districts}.csv (+ data/images/)
# edit the CSVs in Excel/Sheets — they carry a UTF-8 BOM (scripts/csv.mjs toCsv)
# so Korean/Japanese don't garble; save back as "CSV UTF-8".
npm run data:sync     # CSVs (+ data/images/*) -> DB (+ R2 image upload). Idempotent.
npm run data:image -- "계란빵" data/images/gyeranppang.jpg  # one photo -> R2 + DB
npm run r2:test       # R2 smoke test (upload / public GET / delete)
```

(The model behind this — districts as location master, stable R2 keys, sync never
touching counts — is in `CLAUDE.md` § "Content / media model".)

- **Moving a whole zone:** edit that row's `lat,lng` in `districts.csv` and
  `data:sync`. Every shop with that `district` code moves — you never edit shops.
  `district` is free text, so codes (`52-A`) or names both work.
- **Replacing one photo:** upload to the same key and the app picks it up with no
  DB/CSV change — either `npm run data:image -- "<name>" <file>` or drop the file
  in the R2 dashboard's `foods/` folder. `data/images/` is only upload staging,
  deletable afterwards.
- **Orphaned R2 objects.** The admin upload (`lib/storage.ts`) uses a random key,
  so replacing/deleting a shop removes the old object once nothing points at it
  (`deleteFromR2` + `deleteImageIfUnused`). Shared images and non-R2 URLs
  (`/demo/*`) are never touched. To sweep the whole bucket:
  ```bash
  npm run r2:prune            # dry run — lists orphans
  npm run r2:prune -- --yes   # actually delete
  ```
- **Assigning categories** — admin form checkboxes, the CSV `categories` column
  (`|`-joined), or bulk from foods with `node scripts/_categorize.mjs`.
- Demo SVGs show Japanese food names; keep that if you add more.

## 8. Adding or changing a user-facing string

The translation rules (both files, natural wording not a gloss, brand names
untranslated, the `認証`/`認定` mistake) are in `CLAUDE.md` § "i18n". The
mechanical steps:

1. Add the key to **both** `messages/ja.json` AND `messages/ko.json`.
2. Read it with `getTranslations(ns)` (server) or `useTranslations(ns)` (client).
   A label-only component inside a server page can be `"use client"` just for the
   hook — e.g. `components/CertifiedBadge.tsx`.
3. Check both locales in the browser: the switcher sets a `NEXT_LOCALE` cookie
   and reloads.

## 9. Retail pillar — Olive Young + Daiso (products)

Second content axis alongside street food; architecture lives in `CLAUDE.md`
(§ "Retail pillar"). Operational recipes:

- **Replace one product's photo (real image)** — same as food: upload via the
  admin form at `/admin/products/<id>/edit` (→ R2), or set the image URL field.
  DB stores only the URL; no redeploy needed (pages are `force-dynamic`).
- **Re-skin the placeholder tiles** without touching data:
  `node scripts/regen-product-tiles.mjs` — rewrites `public/products/*.svg` at
  their stable filenames, so DB rows, trending flags and counts are untouched.
- **Add / edit Myeongdong stores** — edit the `stores` array in
  `data/retail-data.json` (gitignored), then `node scripts/sync-stores.mjs`:
  replaces `retail_stores` in the DB and regenerates `DEMO_RETAIL_STORES` in
  `lib/products-demo.ts`. Products/counts are never touched. Every product detail
  shows ALL of its retailer's stores (every product is sold at every store).
- **Re-seed products** (`node scripts/seed-products.mjs`) DELETEs + re-inserts
  the seeded rows → **resets their counts**. Run once; use the two scripts above
  for day-to-day changes. Product engagement uses the same synthetic-count model
  as shops (admin `+1K`, `is_trending` toggle) with the views > likes invariant.
- **Trending / search**: `/beauty` + `/daiso` each have a product search (matches
  ja/ko/en name + brand + category); `/trending` shows all three pillars at once.
