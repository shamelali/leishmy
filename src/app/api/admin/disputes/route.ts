import { hasAdminAccess } from "@/lib/auth/admin";
import { getAuthSession } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { disputes, users, bookings } from "@/db/schema";
import { eq, count, and, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(Math.max(1, Number(searchParams.get("pageSize")) || 20), 100);
    const offset = (page - 1) * pageSize;
    const statusFilter = searchParams.get("status");

    const reporterUsers = alias(users, "reporter_users");
    const againstUsers = alias(users, "against_users");

    const filters = [];
    if (statusFilter) filters.push(eq(disputes.status, statusFilter));

    const [rows, [{ count: total }]] = await Promise.all([
      db
        .select({
          id: disputes.id,
          bookingId: disputes.bookingId,
          reporterName: reporterUsers.name,
          againstName: againstUsers.name,
          reason: disputes.reason,
          category: disputes.category,
          status: disputes.status,
          resolution: disputes.resolution,
          createdAt: disputes.createdAt,
          updatedAt: disputes.updatedAt,
        })
        .from(disputes)
        .leftJoin(reporterUsers, eq(disputes.reporterId, reporterUsers.id))
        .leftJoin(againstUsers, eq(disputes.againstId, againstUsers.id))
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(disputes.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: count() })
        .from(disputes)
        .where(filters.length ? and(...filters) : undefined),
    ]);

    return NextResponse.json({
      disputes: rows.map((d) => ({
        id: d.id,
        bookingId: d.bookingId,
        reporterName: d.reporterName || "—",
        againstName: d.againstName || "—",
        reason: d.reason,
        category: d.category || "general",
        status: d.status || "open",
        resolution: d.resolution || null,
        createdAt: d.createdAt?.toISOString() || "",
        updatedAt: d.updatedAt?.toISOString() || "",
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Admin disputes GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "update-status") {
      const { disputeId, status, resolution } = body;
      if (!disputeId || !status) {
        return NextResponse.json({ error: "disputeId and status required" }, { status: 400 });
      }
      await db
        .update(disputes)
        .set({
          status,
          ...(resolution !== undefined && { resolution }),
          updatedAt: new Date(),
        })
        .where(eq(disputes.id, Number(disputeId)));
      return NextResponse.json({ success: true });
    }

    if (action === "close") {
      const { disputeId, resolution } = body;
      if (!disputeId) {
        return NextResponse.json({ error: "disputeId required" }, { status: 400 });
      }
      await db
        .update(disputes)
        .set({
          status: "closed",
          resolution: resolution || null,
          updatedAt: new Date(),
        })
        .where(eq(disputes.id, Number(disputeId)));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin disputes POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
