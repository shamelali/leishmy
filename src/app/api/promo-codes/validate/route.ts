import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { promoCodes, promoCodeUsages } from "@/db/schema";
import { eq, and, gte, lte, sql, count } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code, amount } = await request.json();
    if (!code) return NextResponse.json({ valid: false, error: "Code is required" });

    const [promo] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, code.toUpperCase()))
      .limit(1);

    if (!promo) return NextResponse.json({ valid: false, error: "Invalid promo code" });
    if (!promo.active) return NextResponse.json({ valid: false, error: "This promo code has expired" });

    const now = new Date();
    if (promo.validFrom && new Date(promo.validFrom) > now)
      return NextResponse.json({ valid: false, error: "This promo code is not yet active" });
    if (promo.validUntil && new Date(promo.validUntil) < now)
      return NextResponse.json({ valid: false, error: "This promo code has expired" });

    const bookingAmount = Number(amount) || 0;
    const minAmount = Number(promo.minAmount) || 0;
    if (bookingAmount < minAmount)
      return NextResponse.json({ valid: false, error: `Minimum order amount is RM ${minAmount.toFixed(2)}` });

    if (promo.maxUses !== null && promo.usedCount !== null && promo.usedCount >= promo.maxUses)
      return NextResponse.json({ valid: false, error: "This promo code has reached its usage limit" });

    const [usageCount] = await db
      .select({ count: count() })
      .from(promoCodeUsages)
      .where(and(eq(promoCodeUsages.promoCodeId, promo.id), eq(promoCodeUsages.userId, session.id)));

    if (Number(usageCount?.count ?? 0) > 0)
      return NextResponse.json({ valid: false, error: "You have already used this promo code" });

    let discountAmount = 0;
    if (promo.type === "percent") {
      discountAmount = bookingAmount * (Number(promo.value) / 100);
      if (discountAmount > bookingAmount) discountAmount = bookingAmount;
    } else {
      discountAmount = Number(promo.value);
      if (discountAmount > bookingAmount) discountAmount = bookingAmount;
    }

    const finalAmount = bookingAmount - discountAmount;

    return NextResponse.json({
      valid: true,
      discount: Number(discountAmount.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      finalAmount: Number(finalAmount.toFixed(2)),
      promoCode: { id: promo.id, code: promo.code, type: promo.type, value: Number(promo.value) },
    });
  } catch (error) {
    console.error("Promo validate error:", error);
    return NextResponse.json({ valid: false, error: "Failed to validate promo code" });
  }
}