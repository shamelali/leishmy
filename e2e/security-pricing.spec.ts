import { test, expect } from "@playwright/test";

test.describe("Security: server must resolve prices itself, never trust the client", () => {
  test("POST /api/bookings ignores a tampered client-submitted amount", async ({ request }) => {
    test.setTimeout(120_000);

    // Fetch an artist with a price first (warm-up DB)
    const artRes = await request.get("/api/artists?limit=25");
    expect(artRes.status()).toBe(200);
    const artBody = await artRes.json();
    const artist = (artBody.artists || []).find((a: any) => a && Number(a.price) > 0);
    expect(artist, "Need a seeded artist with price > 0").toBeTruthy();

    const realPrice = String(artist.price);
    const tamperedAmount = "1.00";
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const res = await request.post("/api/bookings", {
      data: {
        artistId: artist.id,
        clientName: "Security Test User",
        clientEmail: `sec-book-${Date.now()}@leish-testing.com`,
        service: "Bridal Makeup",
        date: tomorrow,
        time: "11:00 AM",
        amount: tamperedAmount,
      },
      timeout: 60_000,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(
      Number(body.booking.amount),
      `Booking amount is RM${body.booking.amount} but should be RM${realPrice}. ` +
      `The client-submitted amount (RM${tamperedAmount}) was trusted instead of ` +
      `the artist's DB price. Fix resolveAmount() in bookings/route.ts.`,
    ).toBeCloseTo(Number(realPrice), 2);
  });

  test("POST /api/payments?action=create-bill uses booking stored amount", async ({ request }) => {
    test.setTimeout(120_000);

    // Fetch artist
    const artRes = await request.get("/api/artists?limit=25");
    expect(artRes.status()).toBe(200);
    const artBody = await artRes.json();
    const artist = (artBody.artists || []).find((a: any) => a && Number(a.price) > 0);
    expect(artist, "Need a seeded artist with price > 0").toBeTruthy();

    const email = `sec-pay-${Date.now()}@leish-testing.com`;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    // Create a booking without submitting amount (let server resolve it)
    const bookingRes = await request.post("/api/bookings", {
      data: {
        artistId: artist.id,
        clientEmail: email,
        clientName: "Security Pay Test",
        service: "Event Glam",
        date: tomorrow,
        time: "3:00 PM",
      },
      timeout: 60_000,
    });
    expect(bookingRes.status()).toBe(200);
    const bookingBody = await bookingRes.json();
    const bookingId = bookingBody.booking.id;
    const storedAmount = Number(bookingBody.booking.amount);

    // The server-resolved amount must match artist's DB price
    expect(storedAmount).toBeCloseTo(Number(artist.price), 2);

    // Try to create a bill with a tampered amount
    const tamperedAmount = 1;
    const billRes = await request.post("/api/payments?action=create-bill", {
      data: {
        bookingId,
        amount: tamperedAmount,
        description: "Beauty booking payment",
        name: "Security Test User",
        email,
      },
      timeout: 60_000,
    });

    // Server should either reject the mismatch (4xx) or use booking's stored amount
    if (billRes.status() >= 400) {
      console.log(`Server rejected tampered amount with ${billRes.status()} — acceptable outcome`);
      return;
    }

    expect(billRes.status()).toBe(201);
    const billBody = await billRes.json();
    const expectedCents = Math.round(storedAmount * 100);

    expect(
      billBody.payment.amount,
      `Payment created with amount ${billBody.payment.amount} cents instead of ` +
      `${expectedCents} cents (RM${storedAmount}). The create-bill action must ` +
      `use the booking's stored amount, ignoring body.amount.`,
    ).toBe(expectedCents);
  });
});
