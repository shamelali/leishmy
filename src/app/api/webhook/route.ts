import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhookEvents, payments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const event = request.headers.get("x-event") || "unknown";

    await db.insert(webhookEvents).values({
      event,
      payload: body,
      status: "received",
    });

    if (body.id && body.paid_at) {
      await db
        .update(payments)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(payments.billplzId, body.id));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
