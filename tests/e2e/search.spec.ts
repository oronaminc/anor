import { test, expect } from "@playwright/test";

// Result cards are the only `/shop/...` links rendered on the search page once a
// query is entered, so counting them is a locale-independent way to assert the
// client-side filtering (shop name + menu-food names + hashtags) works e2e.
const cards = 'a[href^="/shop/"]';

test.describe("search", () => {
  test("filters to a single match by Korean shop name", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await page.getByRole("searchbox").first().fill("씨푸드"); // only 명동씨푸드
    await expect(page.locator(cards)).toHaveCount(1, { timeout: 5000 });
  });

  test("matches a partial English menu-food token", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await page.getByRole("searchbox").first().fill("bokki"); // Tteokbokki → 명동분식
    await expect(page.locator(cards)).toHaveCount(1, { timeout: 5000 });
  });

  test("shows an empty state for no match", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await page.getByRole("searchbox").first().fill("zzzznotashop");
    await expect(page.locator(cards)).toHaveCount(0, { timeout: 5000 });
  });
});
