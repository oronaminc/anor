import { test, expect } from "@playwright/test";

// Demo shop "명동씨푸드" (lib/demo-data). Its detail page renders the LikeButton.
const SHOP = "/shop/10000000-0000-4000-8000-000000000001";

test("like button toggles on click (optimistic, no login)", async ({
  page,
}) => {
  await page.goto(SHOP, { waitUntil: "domcontentloaded" });
  const btn = page.getByTestId("like-button");
  await expect(btn).toBeVisible({ timeout: 5000 });
  await expect(btn).toHaveAttribute("aria-pressed", "false");

  await btn.click();
  // Optimistic flip to liked; demo API returns ok and keeps the state.
  await expect(btn).toHaveAttribute("aria-pressed", "true", { timeout: 5000 });
});
