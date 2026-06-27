import { test, expect } from "@playwright/test";

// Cheese Lobster (first demo food). Detail page renders the LikeButton.
const FOOD = "/food/11111111-1111-4111-8111-111111111111";

test("like button toggles on click (optimistic, no login)", async ({
  page,
}) => {
  await page.goto(FOOD, { waitUntil: "domcontentloaded" });
  const btn = page.getByTestId("like-button");
  await expect(btn).toBeVisible({ timeout: 5000 });
  await expect(btn).toHaveAttribute("aria-pressed", "false");

  await btn.click();
  // Optimistic flip to liked; demo API returns ok and keeps the state.
  await expect(btn).toHaveAttribute("aria-pressed", "true", { timeout: 5000 });
});
