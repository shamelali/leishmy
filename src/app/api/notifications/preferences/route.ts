import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export const runtime = "nodejs";

const DEFAULT_PREFS = {
  emailEnabled: true,
  pushEnabled: true,
  whatsappEnabled: true,
  bookingNotifications: true,
  messageNotifications: true,
  promoNotifications: false,
  quietHoursStart: null as string | null,
  quietHoursEnd: null as string | null,
};

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, session.id))
      .limit(1);

    return NextResponse.json(prefs || DEFAULT_PREFS);
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const [existing] = await db
      .select({ id: notificationPreferences.id })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, session.id))
      .limit(1);

    const updates = {
      emailEnabled: body.emailEnabled ?? DEFAULT_PREFS.emailEnabled,
      pushEnabled: body.pushEnabled ?? DEFAULT_PREFS.pushEnabled,
      whatsappEnabled: body.whatsappEnabled ?? DEFAULT_PREFS.whatsappEnabled,
      bookingNotifications: body.bookingNotifications ?? DEFAULT_PREFS.bookingNotifications,
      messageNotifications: body.messageNotifications ?? DEFAULT_PREFS.messageNotifications,
      promoNotifications: body.promoNotifications ?? DEFAULT_PREFS.promoNotifications,
      quietHoursStart: body.quietHoursStart ?? DEFAULT_PREFS.quietHoursStart,
      quietHoursEnd: body.quietHoursEnd ?? DEFAULT_PREFS.quietHoursEnd,
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(notificationPreferences)
        .set(updates)
        .where(eq(notificationPreferences.id, existing.id));
    } else {
      await db.insert(notificationPreferences).values({
        userId: session.id,
        ...updates,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
