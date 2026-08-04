import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export const runtime = "nodejs";

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");
    const providerId = searchParams.get("providerId");

    const conditions = [];

    if (session.isAdmin && providerId) {
      conditions.push(
        eq(bookings.artistId, providerId),
      );
    } else if (!session.isAdmin) {
      conditions.push(
        eq(bookings.artistId, session.id),
      );
    }

    if (from) {
      conditions.push(gte(bookings.date, new Date(from)));
    }
    if (to) {
      conditions.push(lte(bookings.date, new Date(to)));
    }
    if (status) {
      conditions.push(eq(bookings.status, status));
    }

    const rows = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        time: bookings.time,
        service: bookings.service,
        status: bookings.status,
        amount: bookings.amount,
        depositAmount: bookings.depositAmount,
        depositPercent: bookings.depositPercent,
        travelSurcharge: bookings.travelSurcharge,
        accommodationFee: bookings.accommodationFee,
        discount: bookings.discount,
        location: bookings.location,
        milestone: bookings.milestone,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(bookings.date))
      .limit(5000);

    const userIds = [...new Set(rows.map((r) => r.id).filter(Boolean))];
    const artistIds = [
      ...new Set(
        rows.map(() => null).filter(Boolean),
      ),
    ];

    const headers = [
      "ID",
      "Date",
      "Time",
      "Service",
      "Status",
      "Total Amount (RM)",
      "Deposit Amount (RM)",
      "Deposit %",
      "Travel Surcharge (RM)",
      "Accommodation (RM)",
      "Discount (RM)",
      "Location",
      "Milestone",
      "Created At",
    ];

    const csvRows = rows.map((row) => [
      escapeCsv(row.id),
      escapeCsv(row.date ? new Date(row.date).toLocaleDateString("en-MY") : ""),
      escapeCsv(row.time),
      escapeCsv(row.service),
      escapeCsv(row.status),
      escapeCsv(row.amount),
      escapeCsv(row.depositAmount),
      escapeCsv(row.depositPercent),
      escapeCsv(row.travelSurcharge),
      escapeCsv(row.accommodationFee),
      escapeCsv(row.discount),
      escapeCsv(row.location),
      escapeCsv(row.milestone),
      escapeCsv(row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-MY") : ""),
    ].join(","));

    const csv = [headers.join(","), ...csvRows].join("\n");

    const filename = `leish-bookings-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Bookings export error:", error);
    return NextResponse.json({ error: "Failed to export bookings" }, { status: 500 });
  }
}
