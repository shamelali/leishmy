import { test, expect } from "@playwright/test";

const ARTIST_SLUG = "amiera-38385";

test.describe("Booking Flow", () => {
  test("create booking via API and verify it appears on the booking detail page", async ({
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
        artistId: 61,
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
    const bookingId = String(body.booking.id);
    console.log(`Created booking ID: ${bookingId}`);

    // 2. Navigate to the booking detail page (guest-friendly)
    await page.goto(`/bookings/${bookingId}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(`Booking #${bookingId}`, { timeout: 20000 });

    // 3. Verify our booking details appear
    await expect(page.getByText("Bridal Makeup")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("10:00 AM")).toBeVisible();
    await expect(page.getByText("Pending", { exact: false })).toBeVisible();
  });

  test("POST /api/bookings creates a booking and returns it from GET /api/bookings/:id", async ({
    request,
  }) => {
    test.setTimeout(30_000);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    // Create booking
    const postRes = await request.post("/api/bookings", {
      data: {
        artistId: 61,
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
    expect(postBody.booking.artistId).toBe(61);

    // Fetch the specific booking (guest-friendly) to verify it appears
    const bookingId = String(postBody.booking.id);
    const getRes = await request.get(`/api/bookings?id=${bookingId}`);
    expect(getRes.status()).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.booking).toBeDefined();
    expect(getBody.booking.clientName).toBe("API Test User");
    expect(getBody.booking.artistName).toBe("Amiera");
  });

  test("booking form renders correctly on artist detail page", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`/artists/${ARTIST_SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Amiera", { timeout: 20000 });

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
    await expect(page.locator("h1")).toContainText("Amiera", { timeout: 20000 });
    await expect(page.getByText("Book Amiera")).toBeVisible();
    await expect(page.getByText("Starting from MYR")).toBeVisible();
  });
});
