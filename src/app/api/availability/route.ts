import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { availabilityRules, availabilityOverrides, bookings } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const userId = sp.get("userId");
  const dateStr = sp.get("date");
  const duration = Number(sp.get("duration")) || 60;

  if (!userId || !dateStr) {
    return NextResponse.json({ error: "userId and date required" }, { status: 400 });
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const dayOfWeek = date.getDay();
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  try {
    // Get rules for this day of week
    const rules = await db
      .select()
      .from(availabilityRules)
      .where(
        and(
          eq(availabilityRules.userId, userId),
          eq(availabilityRules.dayOfWeek, dayOfWeek),
          eq(availabilityRules.active, true),
        ),
      );

    // Check overrides for this date
    const overrides = await db
      .select()
      .from(availabilityOverrides)
      .where(
        and(
          eq(availabilityOverrides.userId, userId),
          gte(availabilityOverrides.date, dateOnly),
          lte(availabilityOverrides.date, dateOnly),
        ),
      );

    // If fully unavailable, return empty
    const dayOverride = overrides.find(
      (o) => o.date.getTime() === dateOnly.getTime(),
    );
    if (dayOverride?.unavailable) {
      return NextResponse.json({
        slots: [],
        rules,
        overrides,
        message: dayOverride.reason || "Provider is unavailable on this date",
      });
    }

    // Get existing bookings for this date
    const existingBookings = await db
      .select({ time: bookings.time })
      .from(bookings)
      .where(
        and(
          sql`(${bookings.artistId} = ${userId} OR ${bookings.studioId} = ${userId})`,
          eq(bookings.date, dateOnly),
          sql`${bookings.status} NOT IN ('cancelled', 'rejected')`,
        ),
      );

    const bookedTimes = new Set(existingBookings.map((b) => b.time).filter(Boolean));

    // Generate time slots from rules
    const slots: Array<{ time: string; available: boolean }> = [];
    const effectiveStart = dayOverride?.startTime || rules[0]?.startTime;
    const effectiveEnd = dayOverride?.endTime || rules[0]?.endTime;

    if (effectiveStart && effectiveEnd) {
      const slotDuration = rules[0]?.slotDurationMinutes || 60;
      const [startH, startM] = effectiveStart.split(":").map(Number);
      const [endH, endM] = effectiveEnd.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      for (let mins = startMinutes; mins + slotDuration <= endMinutes; mins += slotDuration) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        slots.push({
          time: timeStr,
          available: !bookedTimes.has(timeStr),
        });
      }
    }

    return NextResponse.json({ slots, rules, overrides });
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rules } = body as {
      rules: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        slotDurationMinutes?: number;
      }>;
    };

    if (!Array.isArray(rules)) {
      return NextResponse.json({ error: "rules array required" }, { status: 400 });
    }

    // Delete existing rules and insert new ones
    await db
      .delete(availabilityRules)
      .where(eq(availabilityRules.userId, session.id));

    if (rules.length > 0) {
      await db.insert(availabilityRules).values(
        rules.map((r) => ({
          userId: session.id,
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
          slotDurationMinutes: r.slotDurationMinutes || 60,
        })),
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update availability error:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
