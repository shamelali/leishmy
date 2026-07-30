import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/server";
import {
  getPointsBalance,
  getTransactionHistory,
  getTierInfo,
  getNextTier,
  getAllTiers,
  awardPoints,
  redeemPoints,
} from "@/lib/loyalty";
import { awardPointsSchema, redeemPointsSchema } from "@/lib/validations/loyalty";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    if (!session || session.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const points = await getPointsBalance(userId);
    const transactions = await getTransactionHistory(userId);
    const currentTier = points.tier ?? "bronze";
    const tierInfo = await getTierInfo(currentTier);
    const nextTier = await getNextTier(currentTier);
    const allTiers = await getAllTiers();

    return NextResponse.json({
      points,
      transactions,
      tierInfo,
      nextTier,
      allTiers,
    });
  } catch (error) {
    console.error("Loyalty GET error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json().catch(() => ({}));
    const userId = searchParams.get("userId") || body.userId;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    if (!session || session.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "award") {
      const parsed = awardPointsSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const { source, referenceId, description } = parsed.data;
      const result = await awardPoints(userId, source, referenceId, description);
      if (result === null) {
        return NextResponse.json({ error: "Unknown reward source" }, { status: 400 });
      }
      return NextResponse.json({ success: true, pointsAwarded: result });
    }

    if (action === "redeem") {
      const parsed = redeemPointsSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const { amount, referenceId } = parsed.data;
      const result = await redeemPoints(userId, amount, referenceId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Loyalty POST error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
