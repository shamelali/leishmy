import { test, expect } from "@playwright/test";

const PAGES = [
  { path: "/faq", heading: /Frequently Asked Questions/i },
  { path: "/contact", heading: /Contact/i },
  { path: "/search", heading: /Find Makeup Artists/i },
  { path: "/events", heading: /Events/i },
  { path: "/leish-plus", heading: /VIP Way to Beauty|Leish/i },
] as const;

for (const { path, heading } of PAGES) {
  test(`${path} page loads successfully`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    if (heading) {
      await expect(page.locator("h1")).toContainText(heading);
    }
  });
}
