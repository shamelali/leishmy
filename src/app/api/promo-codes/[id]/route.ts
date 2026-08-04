import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { promoCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session || !hasAdminAccess(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.code !== undefined) updates.code = body.code.toUpperCase();
  if (body.type !== undefined) updates.type = body.type;
  if (body.value !== undefined) updates.value = String(body.value);
  if (body.minAmount !== undefined) updates.minAmount = String(body.minAmount);
  if (body.maxUses !== undefined) updates.maxUses = Number(body.maxUses);
  if (body.validFrom !== undefined) updates.validFrom = new Date(body.validFrom);
  if (body.validUntil !== undefined) updates.validUntil = body.validUntil ? new Date(body.validUntil) : null;
  if (body.active !== undefined) updates.active = Boolean(body.active);
  updates.updatedAt = new Date();

  await db.update(promoCodes).set(updates).where(eq(promoCodes.id, Number(id)));
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session || !hasAdminAccess(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(promoCodes).where(eq(promoCodes.id, Number(id)));
  return NextResponse.json({ success: true });
}