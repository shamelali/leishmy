import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, artistId, studioId, serviceId, date, time, amount, status } = body;

    if (!userId || !date || !amount) {
      return NextResponse.json(
        { error: "userId, date, and amount are required" },
        { status: 400 }
      );
    }

    const [booking] = await db
      .insert(bookings)
      .values({
        userId,
        artistId: artistId || null,
        studioId: studioId || null,
        serviceId: serviceId || null,
        date: new Date(date),
        time: time || null,
        amount,
        status: status || "pending",
      })
      .returning();

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const allBookings = await db.select().from(bookings);
    return NextResponse.json({ bookings: allBookings });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
