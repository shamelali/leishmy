import { getSession } from "@/lib/auth/cookies";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ user: null });
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  if (rows.length === 0) {
    return Response.json({ user: null });
  }

  const u = rows[0];
  return Response.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      phone: u.phone,
      location: u.location,
      bio: u.bio,
      image: u.image,
    },
  });
}
