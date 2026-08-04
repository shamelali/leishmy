import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dataExportRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [request] = await db
      .insert(dataExportRequests)
      .values({ userId: session.id, status: "pending" })
      .returning();

    return NextResponse.json({ success: true, requestId: request.id }, { status: 201 });
  } catch (error) {
    console.error("Export request error:", error);
    return NextResponse.json({ error: "Failed to create export" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requests = await db
      .select()
      .from(dataExportRequests)
      .where(eq(dataExportRequests.userId, session.id))
      .orderBy(desc(dataExportRequests.createdAt));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Export list error:", error);
    return NextResponse.json({ error: "Failed to list exports" }, { status: 500 });
  }
}