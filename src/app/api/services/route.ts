import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");
    const studioId = searchParams.get("studioId");

    if (!artistId && !studioId) {
      return NextResponse.json({ error: "artistId or studioId required" }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(services)
      .where(artistId ? eq(services.artistId, Number(artistId)) : eq(services.studioId, Number(studioId)));

    return NextResponse.json({ services: rows });
  } catch (error) {
    console.error("Services GET error:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { artistId, studioId, name, description, duration, price, popular } = body;

    if (!name || !price || (!artistId && !studioId)) {
      return NextResponse.json({ error: "name, price, and artistId or studioId required" }, { status: 400 });
    }

    const [service] = await db
      .insert(services)
      .values({
        name,
        description: description || null,
        duration: duration || null,
        price,
        artistId: artistId ? Number(artistId) : null,
        studioId: studioId ? Number(studioId) : null,
        popular: popular || false,
      })
      .returning();

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error) {
    console.error("Services POST error:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
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

    await db.delete(services).where(eq(services.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Services DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
