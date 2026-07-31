import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      defaultDepositPercent: profile.defaultDepositPercent ?? 30,
      pricingRules: profile.pricingRules ?? {},
    });
  } catch (error) {
    console.error("Fetch pricing rules error:", error);
    return NextResponse.json({ error: "Failed to fetch pricing rules" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { defaultDepositPercent, pricingRules } = body;

    if (defaultDepositPercent !== undefined && (defaultDepositPercent < 10 || defaultDepositPercent > 100)) {
      return NextResponse.json(
        { error: "Deposit percent must be between 10 and 100" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (defaultDepositPercent !== undefined) updateData.defaultDepositPercent = defaultDepositPercent;
    if (pricingRules !== undefined) updateData.pricingRules = pricingRules;

    const [updated] = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.userId, session.id))
      .returning();

    revalidatePath("/dashboard/artist/services");
    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("Update pricing rules error:", error);
    return NextResponse.json({ error: "Failed to update pricing rules" }, { status: 500 });
  }
}