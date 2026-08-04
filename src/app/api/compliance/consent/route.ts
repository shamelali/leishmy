import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { consentRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, granted } = await request.json();
    if (!type || typeof granted !== "boolean")
      return NextResponse.json({ error: "type and granted required" }, { status: 400 });

    await db.insert(consentRecords).values({
      userId: session.id,
      type,
      granted,
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Consent record error:", error);
    return NextResponse.json({ error: "Failed to record consent" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const consents = await db
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.userId, session.id))
      .orderBy(consentRecords.createdAt);

    return NextResponse.json({ consents });
  } catch (error) {
    console.error("Consent list error:", error);
    return NextResponse.json({ error: "Failed to list consents" }, { status: 500 });
  }
}