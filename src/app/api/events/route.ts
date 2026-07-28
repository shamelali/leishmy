import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { desc, asc, eq, and, gte, lte, ilike, or, count } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const upcoming = searchParams.get("upcoming") !== "false";
    const admin = searchParams.get("admin") === "true";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(Math.max(1, Number(searchParams.get("pageSize")) || 20), 100);

    let conditions = [];

    if (admin) {
      const session = await getAuthSession();
      if (!session || !hasAdminAccess(session)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      conditions.push(eq(events.published, true));
    }

    if (category) {
      conditions.push(eq(events.category, category));
    }

    if (search) {
      conditions.push(
        or(
          ilike(events.title, `%${search}%`),
          ilike(events.description, `%${search}%`),
          ilike(events.location, `%${search}%`),
        ),
      );
    }

    if (upcoming) {
      conditions.push(gte(events.date, new Date()));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    if (admin) {
      const [totalResult] = await db.select({ count: count() }).from(events).where(where);
      const result = await db
        .select()
        .from(events)
        .where(where)
        .orderBy(asc(events.date))
        .limit(pageSize)
        .offset(offset);
      return NextResponse.json({ events: result, total: totalResult?.count || 0 });
    }

    const result = await db
      .select()
      .from(events)
      .where(where)
      .orderBy(asc(events.date))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Events GET error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || !hasAdminAccess(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const [event] = await db
      .insert(events)
      .values({
        title: body.title,
        slug,
        description: body.description || null,
        date: new Date(body.date),
        endDate: body.endDate ? new Date(body.endDate) : null,
        time: body.time || null,
        endTime: body.endTime || null,
        location: body.location || null,
        address: body.address || null,
        category: body.category || "Workshop",
        image: body.image || "/placeholder.svg",
        organizerName: body.organizerName || null,
        organizerContact: body.organizerContact || null,
        ticketUrl: body.ticketUrl || null,
        featured: body.featured || false,
        published: body.published || false,
      })
      .returning();

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("Event creation failed:", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || !hasAdminAccess(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const [event] = await db
      .update(events)
      .set({
        title: body.title,
        description: body.description,
        date: body.date ? new Date(body.date) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : null,
        time: body.time,
        endTime: body.endTime,
        location: body.location,
        address: body.address,
        category: body.category,
        image: body.image,
        organizerName: body.organizerName,
        organizerContact: body.organizerContact,
        ticketUrl: body.ticketUrl,
        featured: body.featured,
        published: body.published,
        updatedAt: new Date(),
      })
      .where(eq(events.id, body.id))
      .returning();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (err) {
    console.error("Event update failed:", err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || !hasAdminAccess(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }

  await db.delete(events).where(eq(events.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
