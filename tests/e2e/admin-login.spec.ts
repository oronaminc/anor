import { test, expect } from "@playwright/test";

// Runs only when ADMIN_PASSWORD is provided to the test runner (and the same
// value to the server). Skipped in the default/demo e2e run.
const PASSWORD = process.env.ADMIN_PASSWORD;

test.describe("admin login", () => {
  test.skip(!PASSWORD, "ADMIN_PASSWORD not set");

  test("wrong password is rejected", async ({ page }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("비밀번호").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.getByText("비밀번호가 올바르지 않습니다.")).toBeVisible({
      timeout: 8000,
    });
  });

  test("correct password reaches the dashboard", async ({ page }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("비밀번호").fill(PASSWORD!);
    await page.getByRole("button", { name: "로그인" }).click();
    await page.waitForURL("**/admin", { timeout: 8000 });
    await expect(page.getByRole("heading", { name: "가게 관리" })).toBeVisible();
  });
});
