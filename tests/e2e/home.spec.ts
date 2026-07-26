import { test, expect } from "@playwright/test";

// Force Korean so the assertions below are deterministic. The app does NOT
// sniff Accept-Language — locale is the `NEXT_LOCALE` cookie only (ja default),
// so the browser locale alone would leave the page in Japanese.
test.use({ locale: "ko-KR" });

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([
    { name: "NEXT_LOCALE", value: "ko", url: baseURL ?? "http://127.0.0.1:3000" },
  ]);
});

test.describe("Home page", () => {
  test("loads and shows the hero header", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);

    // Hero heading is always present. Matched on a distinctive fragment so it
    // can't collide with a shop-name heading in the feed.
    await expect(
      page.getByRole("heading", { name: /이 한 페이지에/ }),
    ).toBeVisible();

    // Header brand link is present.
    await expect(
      page.getByRole("link", { name: /헬로 명동/ }).first(),
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
