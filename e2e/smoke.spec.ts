import { test, expect } from "@playwright/test";

test("homepage renders hero section", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("text=Leish!").first()).toBeVisible();
});

test("artists listing page loads", async ({ page }) => {
  await page.goto("/artists");
  await expect(page.locator("h1")).toBeVisible();
});

test("studios listing page loads", async ({ page }) => {
  await page.goto("/studios");
  await expect(page.locator("h1")).toBeVisible();
});

test("health endpoint returns ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
});
