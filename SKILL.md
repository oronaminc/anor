# SKILL.md

Repeatable recipes for working on this repo (read alongside `CLAUDE.md`).

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
npx vitest run                                   # unit (session/ip/rate-limit/…)
npx playwright test --project=chromium           # e2e: home/search/like
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
in `components/FoodExplorer.tsx`) — keep it (or update the test) if you
restructure the feed.

## 5. Push / open a PR

`origin` already points at `ssh://git@ssh.github.com:443/oronaminc/anor.git`
(GitHub SSH over 443 — plain SSH/HTTPS are blocked here), so:

```bash
git push                      # works for the current branch
git push -u origin <branch>   # new branch
```

There is **no `gh` CLI / token** in this environment, so PRs/MRs cannot be
created from the shell. Either:

- open one in the GitHub UI:
  `https://github.com/oronaminc/anor/compare/main...<branch>?expand=1`, or
- merge locally and push `main`:
  ```bash
  git checkout main
  git merge --no-ff <branch> -m "Merge: <summary>"
  git push
  ```

End commit messages with the `Co-Authored-By` trailer used across the history.
