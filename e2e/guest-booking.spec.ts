import { test, expect } from "@playwright/test";
import {
  billplzSignature,
  billplzWebhookPayload,
} from "./helpers/billplz";

const ARTIST_ID = "7f06fdbd-804e-46b6-8e74-c5d221638385";

test.describe("Guest Booking Flow (no auth)", () => {
  test("POST /api/bookings creates a booking with clientEmail as guest", async ({
    request,
  }) => {
    test.setTimeout(30_000);

    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const email = `guest-${Date.now()}@leish-testing.com`;

    const res = await request.post("/api/bookings", {
      data: {
        artistId: ARTIST_ID,
        clientName: "Guest User",
        clientEmail: email,
        service: "Bridal Makeup",
        date: tomorrow,
        time: "10:00 AM",
        notes: "E2E guest booking test",
      },
      timeout: 30_000,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.booking.clientEmail).toBe(email);
    expect(body.booking.artistName).toBe("Amiera");
  });

  test("guest can create a bill for Event Glam booking", async ({
    request,
  }) => {
    test.setTimeout(30_000);

    const email = `event-glam-guest-${Date.now()}@leish-testing.com`;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const bookingRes = await request.post("/api/bookings", {
      data: {
        artistId: ARTIST_ID,
        clientName: "Event Glam Guest",
        clientEmail: email,
        service: "Event Glam",
        date: tomorrow,
        time: "3:00 PM",
        travelSurcharge: false,
      },
      timeout: 30_000,
    });
    expect(bookingRes.status()).toBe(200);
    const bookingBody = await bookingRes.json();
    const bookingId = bookingBody.booking.id;

    const billRes = await request.post(
      "/api/payments?action=create-bill",
      {
        data: {
          bookingId,
          name: "Event Glam Guest",
          email,
          description: "Event Glam with Amiera",
          idempotencyKey: `booking_${bookingId}`,
        },
        timeout: 30_000,
      },
    );
    expect(billRes.status()).toBe(201);
    const billBody = await billRes.json();
    expect(billBody.bill).toBeTruthy();
    expect(billBody.payment.status).toBe("pending");
  });

  test("guest booking shows deposit amount and milestone for bridal", async ({
    request,
  }) => {
    test.setTimeout(30_000);

    const email = `bridal-guest-${Date.now()}@leish-testing.com`;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const res = await request.post("/api/bookings", {
      data: {
        artistId: ARTIST_ID,
        clientName: "Bridal Guest",
        clientEmail: email,
        service: "Bridal Makeup",
        date: tomorrow,
        time: "11:00 AM",
      },
      timeout: 30_000,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.booking.milestone).toBe("deposit_50");
    expect(body.booking.depositAmount).toBeDefined();
  });

  test("POST /api/bookings rejects duplicate guest booking for same slot", async ({
    request,
  }) => {
    test.setTimeout(30_000);

    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const email = `dupe-guest-${Date.now()}@leish-testing.com`;

    const first = await request.post("/api/bookings", {
      data: {
        artistId: ARTIST_ID,
        clientName: "Duplicate User",
        clientEmail: email,
        service: "Bridal Makeup",
        date: tomorrow,
        time: "2:00 PM",
      },
      timeout: 30_000,
    });
    expect(first.status()).toBe(200);

    const second = await request.post("/api/bookings", {
      data: {
        artistId: ARTIST_ID,
        clientName: "Duplicate User 2",
        clientEmail: email,
        service: "Bridal Makeup",
        date: tomorrow,
        time: "2:00 PM",
      },
      timeout: 30_000,
    });
    expect(second.status()).toBe(409);
  });
});

test.describe("QR Payment for Event Glam (on-site collection)", () => {
  test("POST /api/payments?action=qr-payment records on-site payment", async ({
    request,
  }) => {
    test.setTimeout(30_000);

    const email = `qr-guest-${Date.now()}@leish-testing.com`;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const bookingRes = await request.post("/api/bookings", {
      data: {
        artistId: ARTIST_ID,
        clientName: "QR Payment Guest",
        clientEmail: email,
        service: "Event Glam",
        date: tomorrow,
        time: "4:00 PM",
      },
      timeout: 30_000,
    });
    expect(bookingRes.status()).toBe(200);
    const bookingBody = await bookingRes.json();
    const bookingId = bookingBody.booking.id;

    const remainingRes = await request.get(
      `/api/admin?action=bookings&id=${bookingId}`,
    );
    expect(remainingRes.status()).toBe(200);
    const bookingData = await remainingRes.json();
    const remainingAmount =
      Number(bookingData.booking.amount) -
      (Number(bookingData.booking.depositAmount) || 0);

    const qrRes = await request.post("/api/payments?action=qr-payment", {
      data: {
        bookingId,
        amount: remainingAmount,
      },
      timeout: 30_000,
    });
    expect(qrRes.status()).toBe(200);
    const qrBody = await qrRes.json();
    expect(qrBody.payment.status).toBe("paid");
    expect(qrBody.payment.method).toBe("qr");
    expect(bookingBody.booking.status).toBe("confirmed");
  });
});