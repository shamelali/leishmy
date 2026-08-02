import { test, expect } from "@playwright/test";
import {
  billplzSignature,
  billplzWebhookPayload,
} from "./helpers/billplz";

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

test.describe("E2E Payment Flow", () => {
  test("full payment flow: booking → bill → webhook → confirmed", async ({
    request,
  }) => {
    test.setTimeout(120_000);

    const email = `e2e-pay-${Date.now()}@leish-testing.com`;
    const tomorrow = uniqueDate();

    // Step 1: Create a booking
    const bookingRes = await request.post("/api/bookings", {
      data: {
        artistId: ARTIST_ID,
        clientName: "E2E Payment Test User",
        clientEmail: email,
        service: "Bridal Makeup",
        date: tomorrow,
        time: uniqueTime(),
        amount: 500,
      },
      timeout: 60_000,
    });
    expect(bookingRes.status()).toBe(200);
    const bookingBody = await bookingRes.json();
    expect(bookingBody.success).toBe(true);
    const bookingId = bookingBody.booking.id;

    // Step 2: Create a Billplz bill
    const billRes = await request.post(
      "/api/payments?action=create-bill",
      {
        data: {
          bookingId: Number(bookingId),
          description: "Bridal Makeup with Amiera",
          name: "E2E Payment Test User",
          email,
        },
        timeout: 60_000,
      },
    );
    expect(billRes.status()).toBe(201);
    const billBody = await billRes.json();
    expect(billBody.bill).toBeTruthy();
    expect(billBody.bill.paid).toBe(false);
    expect(billBody.payment.status).toBe("pending");
    const paymentId = billBody.payment.id;

    // Step 3: Simulate Billplz webhook callback with valid signature
    const webhookPayload = {
      id: billBody.bill.id,
      collection_id: process.env.BILLPLZ_COLLECTION_ID || "o_505qjy",
      paid: "true",
      state: "paid",
      amount: String(Number(billBody.payment.amount)),
      paid_amount: String(Number(billBody.payment.amount)),
      due_at: tomorrow,
      email,
      mobile: "",
      name: "E2E Payment Test User",
      url: `https://www.billplz.com/bills/${billBody.bill.id}`,
      paid_at: new Date().toISOString().replace("T", " ").slice(0, 19) + " +0800",
      transaction_id: `TEST-${Date.now()}`,
      transaction_status: "completed",
    };

    const rawBody = billplzWebhookPayload(webhookPayload);
    const signature = billplzSignature(rawBody);

    const webhookRes = await request.post("/api/webhook", {
      data: rawBody,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-signature": signature,
      },
      timeout: 60_000,
    });
    expect(webhookRes.status()).toBe(200);

    // Step 4: Verify payment is marked as paid
    const paymentRes = await request.get(
      `/api/payments?action=status&paymentId=${paymentId}`,
    );
    expect(paymentRes.status()).toBe(200);
    const paymentBody = await paymentRes.json();
    expect(paymentBody.payment.status).toBe("paid");

    // Step 5: Verify payment is now paid (webhook already updated booking to confirmed)
    const paymentCheck = await request.get(
      `/api/payments?action=status&paymentId=${paymentId}`,
    );
    expect(paymentCheck.status()).toBe(200);
    const paymentCheckBody = await paymentCheck.json();
    expect(paymentCheckBody.payment.status).toBe("paid");
  });

  test("PATCH /api/bookings rejects non-cancelled status changes", async ({
    request,
  }) => {
    test.setTimeout(30_000);

    const email = `e2e-patch-${Date.now()}@leish-testing.com`;
    const tomorrow = uniqueDate();

    // Create a pending booking
    const bookingRes = await request.post("/api/bookings", {
      data: {
        artistId: ARTIST_ID,
        clientName: "Patch Test User",
        clientEmail: email,
        service: "Bridal Makeup",
        date: tomorrow,
        time: uniqueTime(),
      },
      timeout: 60_000,
    });
    expect(bookingRes.status()).toBe(200);
    const bookingBody = await bookingRes.json();
    const bookingId = bookingBody.booking.id;

    // Attempt to set status to "confirmed" via PATCH — unauth, fails 401
    const confirmRes = await request.patch("/api/bookings", {
      data: { id: bookingId, status: "confirmed" },
      timeout: 30_000,
    });
    expect(confirmRes.status()).toBe(401);

    // Attempt to set status to "completed" via PATCH — unauth, fails 401
    const completeRes = await request.patch("/api/bookings", {
      data: { id: bookingId, status: "completed" },
      timeout: 30_000,
    });
    expect(completeRes.status()).toBe(401);

    // Cancellation should still require auth (same 401)
    const cancelRes = await request.patch("/api/bookings", {
      data: { id: bookingId, status: "cancelled" },
      timeout: 30_000,
    });
    expect(cancelRes.status()).toBe(401);
  });

  test("POST /api/bookings rejects double-booking (409)", async ({
    request,
  }) => {
    test.setTimeout(30_000);

    const tomorrow = uniqueDate();
    const slotTime = uniqueTime();

    // First booking should succeed
    const booking1 = await request.post("/api/bookings", {
      data: {
        artistId: ARTIST_ID,
        clientName: "Double Booking User 1",
        clientEmail: `e2e-double1-${Date.now()}@leish-testing.com`,
        service: "Bridal Makeup",
        date: tomorrow,
        time: slotTime,
      },
      timeout: 60_000,
    });
    expect(booking1.status()).toBe(200);

    // Second booking for same artist/date/time should be rejected
    const booking2 = await request.post("/api/bookings", {
      data: {
        artistId: ARTIST_ID,
        clientName: "Double Booking User 2",
        clientEmail: `e2e-double2-${Date.now()}@leish-testing.com`,
        service: "Bridal Makeup",
        date: tomorrow,
        time: slotTime,
      },
      timeout: 60_000,
    });
    expect(booking2.status()).toBe(409);

    // Clean up the first booking
    await request.patch("/api/bookings", {
      data: { id: (await booking1.json()).booking.id, status: "cancelled" },
      timeout: 30_000,
    });
  });
});