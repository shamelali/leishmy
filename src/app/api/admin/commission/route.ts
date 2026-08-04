import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [setting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, "commission_rate"))
      .limit(1);

    return NextResponse.json({ commissionRate: setting ? Number(setting.value) : 8 });
  } catch (error) {
    console.error("Get commission error:", error);
    return NextResponse.json({ error: "Failed to get commission" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { commissionRate } = await request.json();
    const rate = Number(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100)
      return NextResponse.json({ error: "Commission rate must be 0-100" }, { status: 400 });

    await db
      .insert(adminSettings)
      .values({ key: "commission_rate", value: String(rate) })
      .onConflictDoUpdate({ target: adminSettings.key, set: { value: String(rate) } });

    return NextResponse.json({ success: true, commissionRate: rate });
  } catch (error) {
    console.error("Update commission error:", error);
    return NextResponse.json({ error: "Failed to update commission" }, { status: 500 });
  }
}