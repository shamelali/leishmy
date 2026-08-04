import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscription } = await request.json();
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    // Store push subscription in a simple JSON column via admin_settings
    // or create a dedicated table. For now, store in notifications table
    // as a system notification with type "push_subscription".
    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys?.p256dh || "";
    const auth = subscription.keys?.auth || "";

    // Upsert: delete old subscription for this user, insert new one
    await db.execute(sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth_key, created_at)
      VALUES (${session.id}, ${endpoint}, ${p256dh}, ${auth}, NOW())
      ON CONFLICT (user_id, endpoint) DO UPDATE SET
        p256dh = ${p256dh},
        auth_key = ${auth},
        created_at = NOW()
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscription error:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint } = await request.json();
    if (endpoint) {
      await db.execute(sql`
        DELETE FROM push_subscriptions
        WHERE user_id = ${session.id} AND endpoint = ${endpoint}
      `);
    } else {
      await db.execute(sql`
        DELETE FROM push_subscriptions WHERE user_id = ${session.id}
      `);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscription delete error:", error);
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}
