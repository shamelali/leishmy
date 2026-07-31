import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { servicePackages, services, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const artistId = searchParams.get("artistId");
    const studioId = searchParams.get("studioId");

    const conditions = [];
    if (serviceId) conditions.push(eq(servicePackages.serviceId, Number(serviceId)));
    if (artistId) conditions.push(eq(servicePackages.artistId, artistId));
    if (studioId) conditions.push(eq(servicePackages.studioId, studioId));

    if (conditions.length === 0) {
      return NextResponse.json({ error: "At least one filter is required" }, { status: 400 });
    }

    const packages = await db
      .select()
      .from(servicePackages)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(servicePackages.sortOrder, servicePackages.createdAt);

    return NextResponse.json({ packages });
  } catch (error) {
    console.error("Fetch packages error:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId, name, description, price, includes, duration, popular, active, sortOrder } = body;

    if (!serviceId || !name || price === undefined) {
      return NextResponse.json({ error: "serviceId, name, and price are required" }, { status: 400 });
    }

    // Verify service belongs to user
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, Number(serviceId)))
      .limit(1);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const isOwner = service.artistId === session.id || service.studioId === session.id;
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [pkg] = await db
      .insert(servicePackages)
      .values({
        serviceId: Number(serviceId),
        artistId: service.artistId,
        studioId: service.studioId,
        name,
        description: description || null,
        price: String(price),
        includes: includes || [],
        duration: duration || null,
        popular: popular || false,
        active: active !== false,
        sortOrder: sortOrder || 0,
      })
      .returning();

    revalidatePath("/dashboard/artist/services");
    return NextResponse.json({ package: pkg });
  } catch (error) {
    console.error("Create package error:", error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, price, includes, duration, popular, active, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "Package id is required" }, { status: 400 });
    }

    // Verify package belongs to user
    const [existing] = await db
      .select()
      .from(servicePackages)
      .where(eq(servicePackages.id, Number(id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const isOwner = existing.artistId === session.id || existing.studioId === session.id;
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = String(price);
    if (includes !== undefined) updateData.includes = includes;
    if (duration !== undefined) updateData.duration = duration;
    if (popular !== undefined) updateData.popular = popular;
    if (active !== undefined) updateData.active = active;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const [updated] = await db
      .update(servicePackages)
      .set(updateData)
      .where(eq(servicePackages.id, Number(id)))
      .returning();

    revalidatePath("/dashboard/artist/services");
    return NextResponse.json({ package: updated });
  } catch (error) {
    console.error("Update package error:", error);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
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
      return NextResponse.json({ error: "Package id is required" }, { status: 400 });
    }

    // Verify package belongs to user
    const [existing] = await db
      .select()
      .from(servicePackages)
      .where(eq(servicePackages.id, Number(id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const isOwner = existing.artistId === session.id || existing.studioId === session.id;
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(servicePackages).where(eq(servicePackages.id, Number(id)));

    revalidatePath("/dashboard/artist/services");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete package error:", error);
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
