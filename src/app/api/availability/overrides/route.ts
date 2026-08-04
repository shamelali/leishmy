import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { availabilityOverrides } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const requestedUserId = sp.get("userId") || "me";
  const from = sp.get("from");
  const to = sp.get("to");

  let userId = requestedUserId;
  if (requestedUserId === "me") {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = session.id;
  }

  try {
    const conditions = [eq(availabilityOverrides.userId, userId)];
    if (from) conditions.push(gte(availabilityOverrides.date, new Date(from)));
    if (to) conditions.push(lte(availabilityOverrides.date, new Date(to)));

    const overrides = await db
      .select()
      .from(availabilityOverrides)
      .where(and(...conditions))
      .orderBy(availabilityOverrides.date);

    return NextResponse.json({ overrides });
  } catch (error) {
    console.error("Get overrides error:", error);
    return NextResponse.json({ error: "Failed to fetch overrides" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, unavailable, startTime, endTime, reason } = body as {
      date: string;
      unavailable?: boolean;
      startTime?: string;
      endTime?: string;
      reason?: string;
    };

    if (!date) {
      return NextResponse.json({ error: "date required" }, { status: 400 });
    }

    const overrideDate = new Date(date);

    // Upsert: check existing
    const [existing] = await db
      .select({ id: availabilityOverrides.id })
      .from(availabilityOverrides)
      .where(
        and(
          eq(availabilityOverrides.userId, session.id),
          eq(availabilityOverrides.date, overrideDate),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(availabilityOverrides)
        .set({
          unavailable: unavailable ?? false,
          startTime: startTime || null,
          endTime: endTime || null,
          reason: reason || null,
        })
        .where(eq(availabilityOverrides.id, existing.id));
    } else {
      await db.insert(availabilityOverrides).values({
        userId: session.id,
        date: overrideDate,
        unavailable: unavailable ?? false,
        startTime: startTime || null,
        endTime: endTime || null,
        reason: reason || null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create override error:", error);
    return NextResponse.json({ error: "Failed to create override" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { overrideId } = body as { overrideId: number };

    if (!overrideId) {
      return NextResponse.json({ error: "overrideId required" }, { status: 400 });
    }

    await db
      .delete(availabilityOverrides)
      .where(
        and(
          eq(availabilityOverrides.id, overrideId),
          eq(availabilityOverrides.userId, session.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete override error:", error);
    return NextResponse.json({ error: "Failed to delete override" }, { status: 500 });
  }
}
