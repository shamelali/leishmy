import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/auth";

// Bare GET /api/user — returns the authenticated user's `user` row with profile data.
// All action-based handlers live in /api/user/[action]/route.ts.
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Fetch both user and profile data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Fetch profile to get studio/artist specific role
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    // Merge user and profile data, prioritizing profile role for studio/artist specific info
    const userWithProfile = {
      ...user,
      // Use profile role if it's not "customer" (which means it's a studio/artist role)
      // Otherwise fall back to user role
      role: profile && profile.role !== "customer" ? profile.role : user.role,
    };

    return NextResponse.json({ user: userWithProfile });
  } catch (error) {
    console.error("User GET error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
