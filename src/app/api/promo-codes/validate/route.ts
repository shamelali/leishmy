import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { promoCodes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, amount } = await request.json();

    if (!code || amount === undefined) {
      return NextResponse.json({ error: "code and amount required" }, { status: 400 });
    }

    const bookingAmount = Number(amount);
    if (isNaN(bookingAmount) || bookingAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const [promo] = await db
      .select()
      .from(promoCodes)
      .where(
        and(
          eq(promoCodes.code, code.toUpperCase()),
          eq(promoCodes.active, true),
          sql`${promoCodes.validFrom} <= NOW()`,
          sql`(${promoCodes.validUntil} IS NULL OR ${promoCodes.validUntil} >= NOW())`,
        ),
      )
      .limit(1);

    if (!promo) {
      return NextResponse.json({ valid: false, error: "Invalid or expired promo code" });
    }

    if (promo.maxUses && (promo.usedCount ?? 0) >= promo.maxUses) {
      return NextResponse.json({ valid: false, error: "Promo code usage limit reached" });
    }

    const minAmount = Number(promo.minAmount) || 0;
    if (bookingAmount < minAmount) {
      return NextResponse.json({
        valid: false,
        error: `Minimum booking amount is RM ${minAmount.toFixed(2)}`,
      });
    }

    let discountAmount: number;
    if (promo.type === "percent") {
      discountAmount = (bookingAmount * Number(promo.value)) / 100;
    } else {
      discountAmount = Math.min(Number(promo.value), bookingAmount);
    }

    const finalAmount = bookingAmount - discountAmount;

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promo.id,
        code: promo.code,
        type: promo.type,
        value: Number(promo.value),
      },
      discountAmount: discountAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
    });
  } catch (error) {
    console.error("Validate promo code error:", error);
    return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 });
  }
}
