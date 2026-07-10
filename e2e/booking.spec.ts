import { test, expect } from "@playwright/test";

const ARTIST_SLUG = "leiynda-rahman-e192e";

test.describe("Booking Flow", () => {
  test("create booking via API and verify it appears on the /bookings page", async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);

    // 1. Create a booking via the API
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const res = await request.post("/api/bookings", {
      data: {
        artistId: 58,
        clientName: "E2E Test User",
        clientEmail: `e2e-${Date.now()}@leish-testing.com`,
        service: "Bridal Makeup",
        date: dateStr,
        time: "10:00 AM",
        notes: "E2E test booking",
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    console.log(`Created booking ID: ${body.booking.id}`);

    // 2. Navigate to /bookings page
    await page.goto("/bookings", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("My Bookings", { timeout: 20000 });

    // 3. Verify our booking appears — look for the booking time and pending status
    await expect(page.getByText("10:00 AM", { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("pending", { exact: true }).first()).toBeVisible();
  });

  test("POST /api/bookings creates a booking and returns it from GET /api/bookings", async ({
    request,
  }) => {
    test.setTimeout(30_000);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    // Create booking
    const postRes = await request.post("/api/bookings", {
      data: {
        artistId: 58,
        clientName: "API Test User",
        clientEmail: `api-test-${Date.now()}@leish-testing.com`,
        service: "Event Glam",
        date: dateStr,
        time: "2:00 PM",
      },
    });
    expect(postRes.status()).toBe(200);
    const postBody = await postRes.json();
    expect(postBody.success).toBe(true);
    expect(postBody.booking.artistId).toBe(58);

    // Fetch all bookings to verify it appears
    const getRes = await request.get("/api/bookings");
    expect(getRes.status()).toBe(200);
    const getBody = await getRes.json();
    expect(Array.isArray(getBody.bookings)).toBe(true);

    const found = getBody.bookings.find(
      (b: any) => b.id === String(postBody.booking.id),
    );
    expect(found).toBeDefined();
    expect(found.clientName).toBe("API Test User");
    expect(found.artistName).toBe("Leiynda Rahman");
  });

  test("booking form renders correctly on artist detail page", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`/artists/${ARTIST_SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Leiynda Rahman", { timeout: 20000 });

    await expect(page.getByPlaceholder("Siti Nurhaliza")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByText("Book Now")).toBeVisible();
  });

  test("booking form validates required fields", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`/artists/${ARTIST_SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Book Now" })).toBeVisible();

    await page.getByRole("button", { name: "Book Now" }).click();

    await expect(page.getByText("Your Name")).toBeVisible();
    await expect(page.getByText("Booking Confirmed!")).not.toBeVisible();
  });

  test("artist detail page loads with booking form", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`/artists/${ARTIST_SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Leiynda Rahman", { timeout: 20000 });
    await expect(page.getByText("Book Leiynda Rahman")).toBeVisible();
    await expect(page.getByText("Starting from MYR")).toBeVisible();
  });
});
