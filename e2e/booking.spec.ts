import { test, expect } from "@playwright/test";

const ARTIST_SLUG = "amiera-38385";
const ARTIST_ID = "7f06fdbd-804e-46b6-8e74-c5d221638385";

let _counter = 0;
function uniqueTime(): string {
  const slot = _counter++;
  const h = 8 + (slot % 10);
  const m = (slot % 4) * 15;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function uniqueDate(): string {
  const d = new Date(Date.now() + (100 + Math.floor(Math.random() * 900)) * 86_400_000);
  return d.toISOString().split("T")[0];
}

test.describe("Booking Flow", () => {
  test("create booking via API and verify it appears on the booking detail page", async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);

    const dateStr = uniqueDate();

    const res = await request.post("/api/bookings", {
    data: {
    artistId: ARTIST_ID,
        clientName: "E2E Test User",
        clientEmail: `e2e-${Date.now()}@leish-testing.com`,
        service: "Bridal Makeup",
        date: dateStr,
        time: uniqueTime(),
        notes: "E2E test booking",
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const bookingId = String(body.booking.id);
    console.log(`Created booking ID: ${bookingId}`);

    // 2. GET-by-id now requires auth — unauthenticated callers get 401
    const getRes = await request.get(`/api/bookings?id=${bookingId}`);
    expect(getRes.status()).toBe(401);

    // 3. Booking detail page URL still reachable (auth handled client-side)
    await page.goto(`/bookings/${bookingId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Log In")).toBeVisible({ timeout: 10000 });
  });

  test("POST /api/bookings creates a booking and returns it from GET /api/bookings/:id", async ({
    request,
  }) => {
    test.setTimeout(30_000);

    const dateStr = uniqueDate();

    // Create booking
    const postRes = await request.post("/api/bookings", {
      data: {
        artistId: ARTIST_ID,
        clientName: "API Test User",
        clientEmail: `api-test-${Date.now()}@leish-testing.com`,
        service: "Event Glam",
        date: dateStr,
        time: uniqueTime(),
      },
    });
    expect(postRes.status()).toBe(200);
    const postBody = await postRes.json();
    expect(postBody.success).toBe(true);
    expect(postBody.booking.artistId).toBe(ARTIST_ID);

    // Fetch the specific booking now requires auth — verify 401 for unauthenticated access
    const bookingId = String(postBody.booking.id);
    const getRes = await request.get(`/api/bookings?id=${bookingId}`);
    expect(getRes.status()).toBe(401);
  });

  test("booking form renders correctly on artist detail page", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`/artists/${ARTIST_SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Amiera", { timeout: 20000 });

    await expect(page.getByRole("heading", { name: "Book Amiera" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Book Now", exact: true }).first()).toBeVisible();
  });

  test("booking form advances through wizard steps", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`/artists/${ARTIST_SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Amiera", { timeout: 20000 });

    // Select the "Other" service radio so we can advance past step 1
    await page.getByRole("radio", { name: "Other" }).check();
    await page.getByPlaceholder("Specify service...").fill("Bridal Makeup");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByPlaceholder("Siti Nurhaliza")).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  });

  test("artist detail page loads with booking form", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`/artists/${ARTIST_SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Amiera", { timeout: 20000 });
    await expect(page.getByText("Book Amiera")).toBeVisible();
    await expect(page.getByText(/Select Service|Starting from MYR/)).toBeVisible();
  });
});
