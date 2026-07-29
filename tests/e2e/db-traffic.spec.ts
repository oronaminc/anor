import { test, expect } from "@playwright/test";

// Demo shop "명동씨푸드" (lib/demo-data) — its detail page renders both counts.
const SHOP = "/shop/10000000-0000-4000-8000-000000000001";

/**
 * The database is a serverless Postgres billed by COMPUTE TIME whose compute
 * only suspends after ~5 idle minutes, so what matters is how often a visit
 * touches it at all — a trickle of requests keeps it awake around the clock and
 * exhausts the monthly quota (see CLAUDE.md; it has happened).
 *
 * These specs pin the traffic a detail page is allowed to generate. Counts are
 * rendered from the shared read cache, so a page must never fetch a number it
 * was already given.
 */
test.describe("detail page database traffic", () => {
  test("opens with one write and no reads, then nothing on a repeat visit", async ({
    page,
  }) => {
    const calls: string[] = [];
    page.on("request", (r) => {
      const { pathname } = new URL(r.url());
      if (pathname.startsWith("/api/")) calls.push(`${r.method()} ${pathname}`);
    });

    await page.goto(SHOP, { waitUntil: "domcontentloaded" });
    // Counts come from the server render — no placeholder, no round-trip.
    await expect(page.getByTestId("view-count")).toBeVisible();
    await expect(page.getByTestId("like-count")).toBeVisible();
    await page.waitForTimeout(1500);

    // Recording the view is the ONLY thing a first visit may cost.
    expect(calls).toEqual([`POST /api${SHOP.replace("/shop", "/shops")}/view`]);

    // Second visit: the device already counted, so it must not touch the API.
    calls.length = 0;
    await page.goto(SHOP, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("view-count")).toBeVisible();
    await page.waitForTimeout(1500);
    expect(calls).toEqual([]);
  });

  test("the feed itself makes no API calls", async ({ page }) => {
    const calls: string[] = [];
    page.on("request", (r) => {
      const { pathname } = new URL(r.url());
      if (pathname.startsWith("/api/")) calls.push(`${r.method()} ${pathname}`);
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    expect(calls).toEqual([]);
  });
});
