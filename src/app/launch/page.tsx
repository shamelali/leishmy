import { db } from "@/db";
import { contacts } from "@/db/schema";
import { count } from "drizzle-orm";
import { LaunchPage as LandingPage } from "@/components/LaunchPage";

async function getWaitlistCount() {
  try {
    const rows = await db.select({ count: count() }).from(contacts);
    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

export const metadata = {
  title: "Leish! — Launch Waitlist",
  description:
    "Join the waitlist for Leish! — Malaysia's beauty booking marketplace. Be the first to book makeup artists and studios.",
  keywords: ["beauty booking", "Malaysia", "makeup artist", "waitlist"],
};

export default async function LaunchPage() {
  const waitlistCount = await getWaitlistCount();
  return <LandingPage waitlistCount={waitlistCount} />;
}