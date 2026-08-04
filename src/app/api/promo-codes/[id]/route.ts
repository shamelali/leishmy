import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { promoCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const promoId = Number(id);
    const body = await request.json();

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.code !== undefined) updates.code = body.code.toUpperCase();
    if (body.type !== undefined) updates.type = body.type;
    if (body.value !== undefined) updates.value = String(body.value);
    if (body.minAmount !== undefined) updates.minAmount = String(body.minAmount);
    if (body.maxUses !== undefined) updates.maxUses = body.maxUses;
    if (body.validFrom !== undefined) updates.validFrom = body.validFrom ? new Date(body.validFrom) : undefined;
    if (body.validUntil !== undefined) updates.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (body.active !== undefined) updates.active = body.active;

    const [updated] = await db
      .update(promoCodes)
      .set(updates)
      .where(eq(promoCodes.id, promoId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, code: updated });
  } catch (error) {
    console.error("Update promo code error:", error);
    return NextResponse.json({ error: "Failed to update promo code" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const promoId = Number(id);

    await db.delete(promoCodes).where(eq(promoCodes.id, promoId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete promo code error:", error);
    return NextResponse.json({ error: "Failed to delete promo code" }, { status: 500 });
  }
}
