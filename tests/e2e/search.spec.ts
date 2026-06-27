import { test, expect } from "@playwright/test";

// Result cards are the only `/food/...` links rendered on the search page once
// a query is entered, so counting them is a locale-independent way to assert
// the client-side filtering works end-to-end.
const cards = 'a[href^="/food/"]';

test.describe("search", () => {
  test("filters to a single match by Korean name", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await page.getByRole("searchbox").first().fill("호떡");
    await expect(page.locator(cards)).toHaveCount(1, { timeout: 5000 });
  });

  test("matches a partial English token", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await page.getByRole("searchbox").first().fill("bokki");
    await expect(page.locator(cards)).toHaveCount(1, { timeout: 5000 });
  });

  test("shows an empty state for no match", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await page.getByRole("searchbox").first().fill("zzzznotfood");
    await expect(page.locator(cards)).toHaveCount(0, { timeout: 5000 });
  });
});
