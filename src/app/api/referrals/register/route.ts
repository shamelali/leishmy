import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { referrals } from "@/db/schema";
import { getAuthSession } from "@/lib/auth/server";
import { eq, and, isNull } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { referralCode } = body;
    if (!referralCode) {
      return NextResponse.json({ error: "referralCode is required" }, { status: 400 });
    }

    const [referral] = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.id, Number(referralCode)),
          isNull(referrals.referredUserId),
        ),
      )
      .limit(1);

    if (!referral) {
      return NextResponse.json({ error: "Invalid or expired referral" }, { status: 404 });
    }

    await db
      .update(referrals)
      .set({
        referredUserId: session.id,
        referredEmail: session.email,
        status: "registered",
        registeredAt: new Date(),
      })
      .where(eq(referrals.id, referral.id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
