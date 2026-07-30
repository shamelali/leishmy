import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services, profiles } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth/server";

async function syncArtistPrice(artistId: string) {
  const [result] = await db
    .select({ minPrice: sql<number>`COALESCE(MIN(${services.price}), 0)::numeric` })
    .from(services)
    .where(eq(services.artistId, artistId));

  await db
    .update(profiles)
    .set({ price: String(result.minPrice), updatedAt: new Date() })
    .where(eq(profiles.userId, artistId));
}

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
      .where(artistId ? eq(services.artistId, artistId) : eq(services.studioId, studioId!));

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
        artistId: artistId ? String(artistId) : null,
        studioId: studioId ? String(studioId) : null,
        popular: popular || false,
      })
      .returning();

    // Sync artist's starting price to minimum service price
    if (artistId) {
      await syncArtistPrice(artistId);
    }

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error) {
    console.error("Services POST error:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { id, name, description, duration, price, popular } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const [existing] = await db
      .select({ artistId: services.artistId, studioId: services.studioId })
      .from(services)
      .where(eq(services.id, Number(id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Verify ownership
    if (existing.artistId) {
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.userId, existing.artistId), eq(profiles.role, "artist")))
        .limit(1);
      if (!profile || profile.userId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (existing.studioId) {
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.userId, existing.studioId), eq(profiles.role, "studio")))
        .limit(1);
      if (!profile || profile.userId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const [updated] = await db
      .update(services)
      .set({
        name: name ?? undefined,
        description: description !== undefined ? description : undefined,
        duration: duration !== undefined ? duration : undefined,
        price: price ?? undefined,
        popular: popular !== undefined ? popular : undefined,
      })
      .where(eq(services.id, Number(id)))
      .returning();

    if (existing.artistId) {
      await syncArtistPrice(existing.artistId);
    }

    revalidatePath("/dashboard/artist/services");
    return NextResponse.json({ success: true, service: updated });
  } catch (error) {
    console.error("Services PUT error:", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
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

    // Get artistId before deleting to sync price
    const [service] = await db
      .select({ artistId: services.artistId })
      .from(services)
      .where(eq(services.id, Number(id)))
      .limit(1);

    await db.delete(services).where(eq(services.id, Number(id)));

    // Sync artist's starting price to minimum service price
    if (service?.artistId) {
      await syncArtistPrice(service.artistId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Services DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
