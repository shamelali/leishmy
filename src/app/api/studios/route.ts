import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios } from "@/db/schema";
import { ilike, or } from "drizzle-orm";
import { featuredStudios } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const query = db.select().from(studios).limit(limit);

    if (search) {
      query.where(
        or(
          ilike(studios.name, `%${search}%`),
          ilike(studios.location, `%${search}%`),
          ilike(studios.description, `%${search}%`),
        ),
      );
    }

    const rows = await query;

    if (rows.length === 0) {
      const fallback = search
        ? featuredStudios.filter(
            (s) =>
              s.name.toLowerCase().includes(search.toLowerCase()) ||
              s.location.toLowerCase().includes(search.toLowerCase()),
          )
        : featuredStudios;

      return NextResponse.json({ studios: fallback.slice(0, limit) });
    }

    return NextResponse.json({ studios: rows });
  } catch (error) {
    console.error("Fetch studios error:", error);
    return NextResponse.json(
      { studios: featuredStudios },
      { status: 200 },
    );
  }
}
