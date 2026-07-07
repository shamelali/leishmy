import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, subscriptionPlans, users, webhookEvents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { sendSubscriptionCreatedEmail, sendSubscriptionCanceledEmail } from "@/lib/email";
import { prefixedEnvReader } from "@/lib/env-prefix";
import { createHmac, timingSafeEqual } from "crypto";

const billplz = prefixedEnvReader("BILLPLZ_");
const publicEnv = prefixedEnvReader("NEXT_PUBLIC_");

const BILLPLZ_API = billplz.get("API_URL");
const BASE_URL = publicEnv.get("URL") || "https://leish.my";

function billplzAuth() {
  return `Basic ${Buffer.from(billplz.require("API_KEY") + ":").toString("base64")}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "plans") {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.active, true))
        .orderBy(subscriptionPlans.price);

      return NextResponse.json({
        plans: plans.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          currency: p.currency,
          durationDays: p.durationDays,
          features: p.features || [],
          popular: p.popular,
        })),
      });
    }

    if (action === "my") {
      const userSubscriptions = await db
        .select({
          id: subscriptions.id,
          status: subscriptions.status,
          currentPeriodStart: subscriptions.currentPeriodStart,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          cancelledAt: subscriptions.cancelledAt,
          createdAt: subscriptions.createdAt,
          plan: {
            id: subscriptionPlans.id,
            name: subscriptionPlans.name,
            slug: subscriptionPlans.slug,
            price: subscriptionPlans.price,
            features: subscriptionPlans.features,
          },
        })
        .from(subscriptions)
        .innerJoin(
          subscriptionPlans,
          eq(subscriptions.planId, subscriptionPlans.id),
        )
        .where(
          and(
            eq(subscriptions.userId, session.id),
            eq(subscriptions.status, "active"),
          ),
        )
        .orderBy(subscriptions.createdAt)
        .limit(1);

      return NextResponse.json({
        subscription: userSubscriptions[0] || null,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Subscriptions GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();

    if (action === "create") {
      const { planId } = body;

      if (!planId) {
        return NextResponse.json({ error: "planId required" }, { status: 400 });
      }

      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(
          and(
            eq(subscriptionPlans.id, Number(planId)),
            eq(subscriptionPlans.active, true),
          ),
        )
        .limit(1);

      if (!plan) {
        return NextResponse.json(
          { error: "Plan not found or inactive" },
          { status: 404 },
        );
      }

      const [existingActive] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, session.id),
            eq(subscriptions.status, "active"),
          ),
        )
        .limit(1);

      if (existingActive) {
        return NextResponse.json(
          { error: "You already have an active subscription" },
          { status: 400 },
        );
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.id))
        .limit(1);

      const description = `Leish+ ${plan.name} subscription`;
      const billplzBody = new URLSearchParams({
        collection_id: billplz.require("COLLECTION_ID"),
        description,
        amount: String(plan.price),
        name: user?.name || "Customer",
        email: user?.email || session.email,
        phone: user?.phone || "",
        callback_url: `${BASE_URL}/api/subscriptions?action=webhook`,
        redirect_url: `${BASE_URL}/leish-plus/success`,
      });

      const billplzResponse = await fetch(`${BILLPLZ_API}/bills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: billplzAuth(),
        },
        body: billplzBody,
      });

      const billplzData = await billplzResponse.json();

      if (!billplzResponse.ok) {
        return NextResponse.json(
          { error: billplzData },
          { status: billplzResponse.status },
        );
      }

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + plan.durationDays);

      const [subscription] = await db
        .insert(subscriptions)
        .values({
          userId: session.id,
          planId: plan.id,
          status: "pending",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          billplzBillId: billplzData.id,
        })
        .returning();

      return NextResponse.json(
        { bill: billplzData, subscription },
        { status: 201 },
      );
    }

    if (action === "cancel") {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, session.id),
            eq(subscriptions.status, "active"),
          ),
        )
        .limit(1);

      if (!subscription) {
        return NextResponse.json(
          { error: "No active subscription found" },
          { status: 404 },
        );
      }

      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
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
        .where(eq(users.id, session.id))
        .limit(1);

      if (user && plan) {
        const cancelDate = subscription.currentPeriodEnd
          ? subscription.currentPeriodEnd.toLocaleDateString("en-MY", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : new Date().toLocaleDateString("en-MY", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

        sendSubscriptionCanceledEmail({
          email: user.email,
          customerName: user.name || "Valued Customer",
          planName: plan.name,
          cancelDate,
        }).catch(() => {});
      }

      return NextResponse.json({ success: true });
    }

    if (action === "webhook") {
      const rawBody = await request.text();
      const signatureKey = billplz.get("SIGNATURE_KEY");

      if (!signatureKey) {
        return NextResponse.json(
          { error: "Signature key not configured" },
          { status: 500 },
        );
      }

      const signatureHeader = request.headers.get("x-signature") || "";
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
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

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
            }).catch(() => {});
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Subscriptions POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
