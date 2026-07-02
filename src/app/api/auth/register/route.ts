import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, artists, studios, categories, artistCategories } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signSession } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role = "customer", phone, location, specialties } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 },
      );
    }

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
    const avatar = `https://images.unsplash.com/photo-${
      role === "artist" ? "1534528741775-53994a69daeb" : "1544005313-94ddf0286df2"
    }?w=150&h=150&fit=crop`;

    const [newUser] = await db
      .insert(users)
      .values({
        id,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        phone: phone || "",
        location: location || "Kuala Lumpur, Malaysia",
        avatar,
        specialties: specialties || [],
      })
      .returning();

    if (role === "artist") {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + "-" + id.slice(-5);

      const [newArtist] = await db
        .insert(artists)
        .values({
          name,
          slug,
          email: email.toLowerCase(),
          image: avatar,
          phone: phone || "",
          location: location || "Kuala Lumpur, Malaysia",
          bio: "",
          available: true,
          verified: false,
          userId: id,
        })
        .returning();

      const specialtyToSlug: Record<string, string> = {
        "Bridal Makeup": "bridal",
        "Soft Glam": "event",
        "Editorial / Photoshoot": "editorial",
        "Hijab Styling": "hijab",
        "Airbrush Makeup": "airbrush",
        "SFX / Creative": "sfx",
        Hairstyling: "hair",
      };

      const categorySlugs = (specialties || [])
        .map((s: string) => specialtyToSlug[s])
        .filter(Boolean);

      if (categorySlugs.length > 0) {
        const matchedCategories = await db
          .select({ id: categories.id })
          .from(categories)
          .where(inArray(categories.slug, categorySlugs));

        if (matchedCategories.length > 0) {
          await db.insert(artistCategories).values(
            matchedCategories.map((c) => ({
              artistId: newArtist.id,
              categoryId: c.id,
            })),
          );
        }
      }
    }

    if (role === "studio") {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + "-" + id.slice(-5);

      await db.insert(studios).values({
        name,
        slug,
        email: email.toLowerCase(),
        image: avatar,
        phone: phone || "",
        location: location || "Kuala Lumpur, Malaysia",
        description: "",
        userId: id,
      });
    }

    const token = signSession({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role || "customer",
      name: newUser.name,
      avatar: newUser.avatar,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        location: newUser.location,
        avatar: newUser.avatar,
        bio: newUser.bio,
        specialties: newUser.specialties,
      },
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 },
    );
  }
}
