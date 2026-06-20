import { test, expect } from "@playwright/test";

// Force Korean so locale auto-detection is deterministic in CI.
test.use({ locale: "ko-KR" });

test.describe("Home page", () => {
  test("loads and shows the hero header", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);

    // Hero heading is always present.
    await expect(
      page.getByRole("heading", { name: /명동 길거리 음식/ }),
    ).toBeVisible();

    // Header brand link is present.
    await expect(
      page.getByRole("link", { name: /명동 길거리 음식/ }).first(),
    ).toBeVisible();
  });

  test("shows either food content or the empty state", async ({ page }) => {
    await page.goto("/");

    const explore = page.getByRole("heading", { name: "전체 메뉴" });
    const emptyState = page.getByText("아직 등록된 음식이 없습니다", {
      exact: false,
    });

    // Whichever path the data is in, the page renders a known section.
    await expect(explore.or(emptyState).first()).toBeVisible();
  });
});
