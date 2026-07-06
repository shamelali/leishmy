import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "./auth";

export { auth, authConfig as neauthConfig, getAuth, handler } from "./auth";

export async function getAuthSession(): Promise<{ id: string; email: string; role: string } | null> {
  const session = await getSession();
  if (!session?.user) return null;
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!dbUser) return null;
  return { id: dbUser.id, email: dbUser.email, role: dbUser.role || "customer" };
}
