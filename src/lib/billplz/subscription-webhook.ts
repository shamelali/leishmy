import { db } from "@/db";
import { subscriptions, subscriptionPlans, users, webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "crypto";
import { prefixedEnvReader } from "@/lib/env-prefix";
import { sendSubscriptionCreatedEmail } from "@/lib/email";

const billplz = prefixedEnvReader("BILLPLZ_");

/**
 * Verify the Billplz signature over the exact raw body and, if valid, activate
 * the matching pending subscription. Shared by the dedicated webhook route and
 * the legacy `?action=webhook` branch for backward compatibility with bills
 * issued before the dedicated route existed.
 *
 * Always returns an explicit status so callers can relay it verbatim. A failed
 * signature is 401/500 and must not activate anything.
 */
export async function handleSubscriptionWebhook(rawBody: string, signatureHeader: string) {
  const signatureKey = billplz.get("SIGNATURE_KEY");

  if (!signatureKey) {
    return { ok: false as const, status: 500, body: { error: "Signature key not configured" } };
  }

  const computedSignature = createHmac("sha256", signatureKey)
    .update(rawBody)
    .digest("hex");

  if (
    computedSignature.length !== signatureHeader.length ||
    !timingSafeEqual(
      Buffer.from(computedSignature, "utf-8"),
      Buffer.from(signatureHeader, "utf-8"),
    )
  ) {
    return { ok: false as const, status: 401, body: { error: "Invalid signature" } };
  }

  try {
    const webhookBody = JSON.parse(rawBody);

    await db.insert(webhookEvents).values({
      event: "subscription.payment",
      payload: webhookBody,
    });

    if (webhookBody.id && webhookBody.paid_at) {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.billplzBillId, webhookBody.id))
        .limit(1);

      if (subscription) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30);

        await db
          .update(subscriptions)
          .set({
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            updatedAt: now,
          })
          .where(eq(subscriptions.id, subscription.id));

        const [plan] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, subscription.planId))
          .limit(1);

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, subscription.userId))
          .limit(1);

        if (user && plan) {
          sendSubscriptionCreatedEmail({
            email: user.email,
            customerName: user.name || "Valued Customer",
            planName: plan.name,
            amount: plan.price / 100,
          }).catch((err) => console.error("sendSubscriptionCreatedEmail failed:", err));
        }
      }
    }

    return { ok: true as const, status: 200, body: { success: true } };
  } catch (error) {
    console.error("Subscription webhook processing error:", error);
    return { ok: false as const, status: 500, body: { error: "Internal server error" } };
  }
}