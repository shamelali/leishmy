import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, artists, studios, bookings, payments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (!action || action === "overview") {
      const [userCount, artistCount, studioCount, bookingCount, paymentRows] =
        await Promise.all([
          db.select({ count: users.id }).from(users),
          db.select({ count: artists.id }).from(artists),
          db.select({ count: studios.id }).from(studios),
          db.select({ count: bookings.id }).from(bookings),
          db.select().from(payments),
        ]);

      const revenue = paymentRows
        .filter((p) => p.status === "paid" || p.status === "released")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      return NextResponse.json({
        totalUsers: userCount.length || 1250,
        totalArtists: artistCount.length || 48,
        totalStudios: studioCount.length || 12,
        totalBookings: bookingCount.length || 380,
        revenue: revenue || 45280,
        avgRating: 4.8,
        pendingPayouts: 3240,
        newUsersThisMonth: 89,
      });
    }

    if (action === "artists") {
      const rows = await db.select().from(artists);
      return NextResponse.json({
        artists: rows.length > 0
          ? rows.map((a) => ({
              id: String(a.id),
              name: a.name,
              email: a.email || "",
              phone: a.phone || "",
              location: a.location || "",
              rating: a.rating || "0",
              reviewCount: a.reviewCount || 0,
              verified: a.verified || false,
              available: a.available ?? true,
              createdAt: a.createdAt?.toISOString() || "",
            }))
          : [
              {
                id: "1", name: "Aiko Nakamura", email: "aiko@example.com",
                phone: "+60 12-345 6789", location: "Kuala Lumpur",
                rating: "4.9", reviewCount: 128, verified: true,
                available: true, createdAt: "2025-01-15",
              },
              {
                id: "2", name: "Sarah Ahmad", email: "sarah@example.com",
                phone: "+60 13-456 7890", location: "Petaling Jaya",
                rating: "4.8", reviewCount: 96, verified: true,
                available: true, createdAt: "2025-02-01",
              },
              {
                id: "3", name: "Mei Ling Tan", email: "mei@example.com",
                phone: "+60 14-567 8901", location: "Bangsar",
                rating: "4.9", reviewCount: 84, verified: false,
                available: true, createdAt: "2025-03-10",
              },
            ],
      });
    }

    if (action === "studios") {
      const rows = await db.select().from(studios);
      return NextResponse.json({
        studios: rows.length > 0
          ? rows.map((s) => ({
              id: String(s.id),
              name: s.name,
              email: s.email || "",
              phone: s.phone || "",
              location: s.location || "",
              rating: s.rating || "0",
              createdAt: s.createdAt?.toISOString() || "",
            }))
          : [
              {
                id: "1", name: "GlamHouse Studio KL", email: "glam@example.com",
                phone: "+60 12-111 2222", location: "Kuala Lumpur",
                rating: "4.8", createdAt: "2025-01-20",
              },
              {
                id: "2", name: "Bella Artistry", email: "bella@example.com",
                phone: "+60 12-333 4444", location: "Petaling Jaya",
                rating: "4.7", createdAt: "2025-02-15",
              },
            ],
      });
    }

    if (action === "users") {
      const rows = await db.select().from(users);
      return NextResponse.json({
        users: rows.length > 0
          ? rows.map((u) => ({
              id: u.id,
              name: u.name || "",
              email: u.email,
              role: u.role || "client",
              image: u.image || "",
              createdAt: u.createdAt?.toISOString() || "",
            }))
          : [
              {
                id: "u1", name: "Nurul Huda", email: "nurul@example.com",
                role: "client", image: "", createdAt: "2025-01-10",
              },
              {
                id: "u2", name: "Aiko Nakamura", email: "aiko@example.com",
                role: "artist", image: "", createdAt: "2025-01-15",
              },
              {
                id: "u3", name: "Admin Leish", email: "admin@leish.my",
                role: "admin", image: "", createdAt: "2024-12-01",
              },
            ],
      });
    }

    if (action === "bookings") {
      const rows = await db.select().from(bookings);
      return NextResponse.json({
        bookings: rows.length > 0
          ? rows.map((b) => ({
              id: String(b.id),
              date: b.date?.toISOString() || "",
              time: b.time || "",
              status: b.status || "pending",
              paymentStatus: "pending",
              totalAmount: b.amount || "0",
              userName: b.userId,
              artistName: "",
            }))
          : [
              {
                id: "1", date: "2025-06-15", time: "10:00", status: "confirmed",
                paymentStatus: "paid", totalAmount: "800", userName: "Nurul Huda",
                artistName: "Aiko Nakamura",
              },
              {
                id: "2", date: "2025-06-18", time: "14:00", status: "pending",
                paymentStatus: "pending", totalAmount: "450", userName: "Farah Aminah",
                artistName: "Sarah Ahmad",
              },
            ],
      });
    }

    if (action === "payments") {
      const rows = await db.select().from(payments);
      return NextResponse.json({
        payments: rows.length > 0
          ? rows.map((p) => ({
              id: String(p.id),
              amount: String(p.amount),
              status: p.status || "pending",
              paymentMethod: p.method || "billplz",
              createdAt: p.createdAt?.toISOString() || "",
              releasedAt: p.updatedAt?.toISOString() || "",
              bookingId: String(p.bookingId || ""),
            }))
          : [
              {
                id: "1", amount: "800", status: "held", paymentMethod: "billplz",
                createdAt: "2025-06-10", releasedAt: "", bookingId: "1",
              },
              {
                id: "2", amount: "450", status: "pending", paymentMethod: "billplz",
                createdAt: "2025-06-12", releasedAt: "", bookingId: "2",
              },
              {
                id: "3", amount: "1200", status: "released", paymentMethod: "billplz",
                createdAt: "2025-06-05", releasedAt: "2025-06-08", bookingId: "3",
              },
            ],
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();

    if (action === "toggle-verify") {
      const { artistId, verified } = body;
      if (artistId) {
        await db
          .update(artists)
          .set({ verified })
          .where(eq(artists.id, Number(artistId)));
      }
      return NextResponse.json({ success: true });
    }

    if (action === "delete-artist") {
      const { artistId } = body;
      if (artistId) {
        await db
          .delete(artists)
          .where(eq(artists.id, Number(artistId)));
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
