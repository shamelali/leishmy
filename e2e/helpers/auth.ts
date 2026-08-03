import { type Page } from "@playwright/test";

/**
 * Log in via the Neon Auth sign-in API from within the browser context.
 * This way the browser automatically handles session cookies.
 */
export async function loginAs(page: Page, email: string, password: string) {
  // First navigate to the site so cookies are scoped to localhost
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Call the sign-in API from within the page context (browser handles cookies)
  const result = await page.evaluate(
    async ({ email, password }) => {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => null);
      return { status: res.status, ok: res.ok, body };
    },
    { email, password },
  );

  if (!result.ok) {
    throw new Error(
      `Login failed for ${email}: ${result.status} ${JSON.stringify(result.body)}`,
    );
  }

  // Reload so the page picks up the new session cookie
  await page.reload({ waitUntil: "domcontentloaded" });
}
