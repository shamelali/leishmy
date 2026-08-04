import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { promoCodes, promoCodeUsages } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const codes = await db
      .select({
        id: promoCodes.id,
        code: promoCodes.code,
        type: promoCodes.type,
        value: promoCodes.value,
        minAmount: promoCodes.minAmount,
        maxUses: promoCodes.maxUses,
        usedCount: promoCodes.usedCount,
        validFrom: promoCodes.validFrom,
        validUntil: promoCodes.validUntil,
        active: promoCodes.active,
        createdAt: promoCodes.createdAt,
      })
      .from(promoCodes)
      .orderBy(desc(promoCodes.createdAt));

    return NextResponse.json({ codes });
  } catch (error) {
    console.error("List promo codes error:", error);
    return NextResponse.json({ error: "Failed to list promo codes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, type, value, minAmount, maxUses, validFrom, validUntil } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json({ error: "code, type, and value required" }, { status: 400 });
    }

    if (type !== "percent" && type !== "fixed") {
      return NextResponse.json({ error: "type must be 'percent' or 'fixed'" }, { status: 400 });
    }

    if (type === "percent" && (Number(value) < 0 || Number(value) > 100)) {
      return NextResponse.json({ error: "percent value must be 0-100" }, { status: 400 });
    }

    if (Number(value) <= 0) {
      return NextResponse.json({ error: "value must be positive" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: promoCodes.id })
      .from(promoCodes)
      .where(eq(promoCodes.code, code.toUpperCase()))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Promo code already exists" }, { status: 409 });
    }

    const [created] = await db
      .insert(promoCodes)
      .values({
        code: code.toUpperCase(),
        type,
        value: String(value),
        minAmount: minAmount ? String(minAmount) : "0",
        maxUses: maxUses || null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        createdBy: session.id,
      })
      .returning();

    return NextResponse.json({ success: true, code: created }, { status: 201 });
  } catch (error) {
    console.error("Create promo code error:", error);
    return NextResponse.json({ error: "Failed to create promo code" }, { status: 500 });
  }
}
