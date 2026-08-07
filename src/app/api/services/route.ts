import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services, profiles } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth/server";

// Single source of truth for profiles.price: always derived from MIN(services.price)
// for that provider. Nothing else should ever write to profiles.price directly —
// see ArtistProfileEditForm / studio edit page, where the old manual price field
// was removed for exactly this reason.
async function syncProviderPrice(providerId: string) {
  const [result] = await db
    .select({ minPrice: sql<number>`COALESCE(MIN(${services.price}), 0)::numeric` })
    .from(services)
    .where(sql`${services.artistId} = ${providerId} OR ${services.studioId} = ${providerId}`);

  await db
    .update(profiles)
    .set({ price: String(result.minPrice), updatedAt: new Date() })
    .where(eq(profiles.userId, providerId));
}

// Verify the requested provider belongs to the authenticated user. artistId is
// only valid against an "artist" profile, studioId only against a "studio"
// profile, and both must belong to `userId`. Returns an error message or null
// when ownership is confirmed.
async function ownershipError(
  sessionId: string,
  artistId?: string | null,
  studioId?: string | null,
): Promise<string | null> {
  if (artistId) {
    const [profile] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(and(eq(profiles.userId, String(artistId)), eq(profiles.role, "artist")))
      .limit(1);
    if (!profile || profile.userId !== sessionId) return "Forbidden";
  }
  if (studioId) {
    const [profile] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(and(eq(profiles.userId, String(studioId)), eq(profiles.role, "studio")))
      .limit(1);
    if (!profile || profile.userId !== sessionId) return "Forbidden";
  }
  return null;
}

async function ownershipErrorForService(
  sessionId: string,
  service: { artistId: string | null; studioId: string | null } | null,
): Promise<string | null> {
  if (!service) return "Service not found";
  return ownershipError(sessionId, service.artistId ?? undefined, service.studioId ?? undefined);
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
    const { artistId, studioId, name, description, duration, price, popular, category } = body;

    if (!name || (!artistId && !studioId)) {
      return NextResponse.json({ error: "name and artistId or studioId required" }, { status: 400 });
    }

    const forbidden = await ownershipError(session.id, artistId, studioId);
    if (forbidden) {
      return NextResponse.json({ error: forbidden }, { status: 403 });
    }

    const [service] = await db
      .insert(services)
      .values({
        name,
        description: description || null,
        duration: duration || null,
        price: price ?? "0",
        artistId: artistId ? String(artistId) : null,
        studioId: studioId ? String(studioId) : null,
        popular: popular || false,
        category: category || "event",
      })
      .returning();

    // Sync provider's starting price to minimum service price
    const providerId = artistId ? String(artistId) : studioId ? String(studioId) : null;
    if (providerId) {
      await syncProviderPrice(providerId);
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
    const { id, name, description, duration, price, popular, category } = body;

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
    const forbidden = await ownershipErrorForService(session.id, existing);
    if (forbidden) {
      return NextResponse.json({ error: forbidden }, { status: forbidden === "Service not found" ? 404 : 403 });
    }

    const [updated] = await db
      .update(services)
      .set({
        name: name ?? undefined,
        description: description !== undefined ? description : undefined,
        duration: duration !== undefined ? duration : undefined,
        price: price ?? undefined,
        popular: popular !== undefined ? popular : undefined,
        category: category !== undefined ? category : undefined,
      })
      .where(eq(services.id, Number(id)))
      .returning();

    if (existing.artistId) {
      await syncProviderPrice(existing.artistId);
    } else if (existing.studioId) {
      await syncProviderPrice(existing.studioId);
    }

    revalidatePath("/dashboard/artist/services");
    revalidatePath("/dashboard/studio/services");
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

    // Get provider id before deleting to sync price
    const [service] = await db
      .select({ artistId: services.artistId, studioId: services.studioId })
      .from(services)
      .where(eq(services.id, Number(id)))
      .limit(1);

    // Verify ownership before deleting
    const forbidden = await ownershipErrorForService(session.id, service);
    if (forbidden) {
      return NextResponse.json({ error: forbidden }, { status: forbidden === "Service not found" ? 404 : 403 });
    }

    await db.delete(services).where(eq(services.id, Number(id)));

    // Sync provider's starting price to minimum service price
    if (service?.artistId) {
      await syncProviderPrice(service.artistId);
    } else if (service?.studioId) {
      await syncProviderPrice(service.studioId);
    }

    revalidatePath("/dashboard/artist/services");
    revalidatePath("/dashboard/studio/services");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Services DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
