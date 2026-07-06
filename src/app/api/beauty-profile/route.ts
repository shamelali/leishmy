import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { skinProfiles, beautyPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    if (!session || session.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "skin") {
      const [profile] = await db
        .select()
        .from(skinProfiles)
        .where(eq(skinProfiles.userId, userId))
        .limit(1);
      return NextResponse.json({ skinProfile: profile || null });
    }

    if (action === "preferences") {
      const [prefs] = await db
        .select()
        .from(beautyPreferences)
        .where(eq(beautyPreferences.userId, userId))
        .limit(1);
      return NextResponse.json({ preferences: prefs || null });
    }

    const [skin] = await db
      .select()
      .from(skinProfiles)
      .where(eq(skinProfiles.userId, userId))
      .limit(1);
    const [prefs] = await db
      .select()
      .from(beautyPreferences)
      .where(eq(beautyPreferences.userId, userId))
      .limit(1);

    return NextResponse.json({
      skinProfile: skin || null,
      preferences: prefs || null,
    });
  } catch (error) {
    console.error("Beauty profile GET error:", error);
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

    if (action === "skin") {
      const { skinType, skinConcerns, undertone, allergies } = body;
      const [existing] = await db
        .select()
        .from(skinProfiles)
        .where(eq(skinProfiles.userId, userId))
        .limit(1);

      if (existing) {
        await db
          .update(skinProfiles)
          .set({
            skinType: skinType ?? existing.skinType,
            skinConcerns: skinConcerns ?? existing.skinConcerns,
            undertone: undertone ?? existing.undertone,
            allergies: allergies ?? existing.allergies,
            updatedAt: new Date(),
          })
          .where(eq(skinProfiles.userId, userId));
      } else {
        await db.insert(skinProfiles).values({
          userId,
          skinType: skinType || null,
          skinConcerns: skinConcerns || [],
          undertone: undertone || null,
          allergies: allergies || [],
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "preferences") {
      const { preferredStyles, preferredProducts, makeupNotes } = body;
      const [existing] = await db
        .select()
        .from(beautyPreferences)
        .where(eq(beautyPreferences.userId, userId))
        .limit(1);

      if (existing) {
        await db
          .update(beautyPreferences)
          .set({
            preferredStyles: preferredStyles ?? existing.preferredStyles,
            preferredProducts: preferredProducts ?? existing.preferredProducts,
            makeupNotes: makeupNotes ?? existing.makeupNotes,
            updatedAt: new Date(),
          })
          .where(eq(beautyPreferences.userId, userId));
      } else {
        await db.insert(beautyPreferences).values({
          userId,
          preferredStyles: preferredStyles || [],
          preferredProducts: preferredProducts || [],
          makeupNotes: makeupNotes || null,
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Beauty profile POST error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
