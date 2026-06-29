import { test, expect } from "@playwright/test";

// Force Korean so locale detection is deterministic.
test.use({ locale: "ko-KR" });

const num = (s: string) => parseInt(s.replace(/[^0-9]/g, ""), 10) || 0;

test.describe("count consistency (home ↔ detail)", () => {
  test("detail counts match the card it was opened from (no stale jump)", async ({
    page,
  }) => {
    await page.goto("/");

    // First shop card's like + view, as shown on the home feed.
    await expect(page.getByTestId("card-view").first()).toBeVisible();
    const cardView = num(await page.getByTestId("card-view").first().innerText());
    const cardLike = num(await page.getByTestId("card-like").first().innerText());

    // Open that shop via a real client-side navigation (the exact path the bug
    // appeared on: home → detail). Then read the detail's counts.
    await page.locator('a[href^="/shop/"]').first().click();
    await page.waitForURL("**/shop/**");

    // These testids appear only once the live count has loaded (the components
    // never render the cached/SSR value), so reading them waits for the real
    // number rather than a placeholder.
    await expect(page.getByTestId("view-count")).toBeVisible();
    await expect(page.getByTestId("like-count")).toBeVisible();
    const detailView = num(await page.getByTestId("view-count").innerText());
    const detailLike = num(await page.getByTestId("like-count").innerText());

    // The detail must reflect the same shop, not a stale cached render.
    // Views: opening counts +1, so detail ∈ [card, card + small].
    expect(detailView).toBeGreaterThanOrEqual(cardView);
    expect(detailView - cardView).toBeLessThanOrEqual(10);
    // Likes don't change on a view, so they must match closely.
    expect(Math.abs(detailLike - cardLike)).toBeLessThanOrEqual(2);
    // Core invariant everywhere: total views stay above total likes.
    expect(detailView).toBeGreaterThan(detailLike);
  });

  test("every home card keeps views > likes", async ({ page }) => {
    await page.goto("/");
    const views = await page.getByTestId("card-view").allInnerTexts();
    const likes = await page.getByTestId("card-like").allInnerTexts();
    expect(views.length).toBeGreaterThan(0);
    expect(views.length).toBe(likes.length);
    for (let i = 0; i < views.length; i++) {
      expect(num(views[i])).toBeGreaterThan(num(likes[i]));
    }
  });
});
