import { test, expect } from "@playwright/test";

test.describe("Auth UI", () => {
  test("login page renders form", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByPlaceholder("you@example.my")).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
  });

  test("register page renders form", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await expect(page.getByPlaceholder("you@example.my")).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder("At least 6 characters")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
  });

  test("forgot password page renders form", async ({ page }) => {
    await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });
    await expect(page.getByPlaceholder("you@example.my")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Send Reset Link" })).toBeVisible();
  });

  test("profile page redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/login/, { timeout: 30000 });
    expect(page.url()).toContain("/login");
  });

  test("GET /api/user returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/user");
    expect(res.status()).toBe(401);
  });
});
