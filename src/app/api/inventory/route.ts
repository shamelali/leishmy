import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studioInventory, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get("studioId");

    if (!studioId) {
      return NextResponse.json({ error: "studioId required" }, { status: 400 });
    }

    const [studio] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(and(eq(profiles.userId, studioId), eq(profiles.role, "studio")))
      .limit(1);

    if (!studio || studio.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await db
      .select()
      .from(studioInventory)
      .where(eq(studioInventory.studioId, studioId))
      .orderBy(studioInventory.name);

    return NextResponse.json({ items: rows });
  } catch (error) {
    console.error("Inventory GET error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { studioId, name, category, quantity, notes } = body;

    if (!studioId || !name) {
      return NextResponse.json({ error: "studioId and name required" }, { status: 400 });
    }

    const [item] = await db
      .insert(studioInventory)
      .values({
        studioId: String(studioId),
        name,
        category: category || null,
        quantity: quantity != null ? Number(quantity) : 0,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error("Inventory POST error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const [item] = await db
      .select({ studioId: studioInventory.studioId })
      .from(studioInventory)
      .where(eq(studioInventory.id, Number(id)))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const [studio] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(and(eq(profiles.userId, item.studioId), eq(profiles.role, "studio")))
      .limit(1);

    if (!studio || studio.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(studioInventory).where(eq(studioInventory.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inventory DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
