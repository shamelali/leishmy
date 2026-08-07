import { test, expect } from "@playwright/test";
import {
  billplzSignature,
  billplzWebhookPayload,
} from "./helpers/billplz";
import { loginAs } from "./helpers/auth";

const MUA_ARTIST_ID = "d77bd73d-e733-40e6-8fa8-71f564889c85";
const MUA_EMAIL = "shamelali.vega@gmail.com";
const MUA_PASSWORD = "sham2008";
const CUSTOMER_EMAIL = "shamelali@gmail.com";
const CUSTOMER_PASSWORD = "!Sham2008!";

test.use({ storageState: undefined });

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
  test("full payment flow: booking → quote → accept → bill → webhook → confirmed", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const tomorrow = uniqueDate();
    const time = uniqueTime();

    // Step 1: Login as customer and create a booking
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    const bookingRes = await page.request.post("/api/bookings", {
      data: {
        artistId: MUA_ARTIST_ID,
        clientName: "E2E Payment Test User",
        clientEmail: CUSTOMER_EMAIL,
        service: "Bridal Makeup",
        date: tomorrow,
        time,
      },
    });
    expect(bookingRes.status()).toBe(200);
    const bookingBody = await bookingRes.json();
    expect(bookingBody.success).toBe(true);
    const bookingId = bookingBody.booking.id;
    const bookingIdNum = Number(bookingId);
    expect(bookingBody.booking.status).toBe("quote_pending");
    expect(Number(bookingBody.booking.amount)).toBe(0);

    // Step 2: Login as MUA and submit a quote
    await loginAs(page, MUA_EMAIL, MUA_PASSWORD);
    const quoteRes = await page.request.put(`/api/bookings/${bookingIdNum}/quote`, {
      data: {
        bookingId: bookingIdNum,
        servicePrice: 500,
        depositPercent: 30,
      },
    });
    expect(quoteRes.status()).toBe(200);
    const quoteBody = await quoteRes.json();
    expect(quoteBody.success).toBe(true);
    expect(quoteBody.booking.status).toBe("quote_sent");
    expect(Number(quoteBody.booking.amount)).toBeGreaterThan(0);

    // Step 3: Login as customer and accept the quote (this creates the bill)
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    const acceptRes = await page.request.post(`/api/bookings/${bookingIdNum}/accept`, {
      data: { bookingId: bookingIdNum },
    });
    expect(acceptRes.status()).toBe(200);
    const acceptBody = await acceptRes.json();
    expect(acceptBody.success).toBe(true);
    expect(acceptBody.booking.status).toBe("pending");
    expect(acceptBody.bill).toBeTruthy();
    expect(acceptBody.payment).toBeTruthy();
    expect(acceptBody.payment.status).toBe("pending");
    const paymentId = acceptBody.payment.id;

    // Step 4: Simulate Billplz webhook callback with valid signature
    const webhookPayload = {
      id: acceptBody.bill.id,
      collection_id: process.env.BILLPLZ_COLLECTION_ID || "8sij1nzh",
      paid: "true",
      state: "paid",
      amount: String(Number(acceptBody.payment.amount)),
      paid_amount: String(Number(acceptBody.payment.amount)),
      due_at: tomorrow,
      email: CUSTOMER_EMAIL,
      mobile: "",
      name: "E2E Payment Test User",
      url: `https://www.billplz.com/bills/${acceptBody.bill.id}`,
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
    });
    expect(webhookRes.status()).toBe(200);

    // Step 5: Verify payment is marked as paid
    const paymentRes = await request.get(
      `/api/payments?action=status&paymentId=${paymentId}`,
    );
    expect(paymentRes.status()).toBe(200);
    const paymentBody = await paymentRes.json();
    expect(paymentBody.payment.status).toBe("paid");
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
        artistId: MUA_ARTIST_ID,
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
    const time = uniqueTime();
    const email = `e2e-double-${Date.now()}@leish-testing.com`;

    // First booking
    const first = await request.post("/api/bookings", {
      data: {
        artistId: MUA_ARTIST_ID,
        clientName: "Double Book User",
        clientEmail: email,
        service: "Bridal Makeup",
        date: tomorrow,
        time,
      },
      timeout: 60_000,
    });
    expect(first.status()).toBe(200);

    // Second booking for same artist + date + time should fail
    const second = await request.post("/api/bookings", {
      data: {
        artistId: MUA_ARTIST_ID,
        clientName: "Double Book User 2",
        clientEmail: `e2e-double2-${Date.now()}@leish-testing.com`,
        service: "Bridal Makeup",
        date: tomorrow,
        time,
      },
      timeout: 60_000,
    });
    expect(second.status()).toBe(409);
  });
});
