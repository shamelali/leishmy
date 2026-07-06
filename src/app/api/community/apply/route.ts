import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { communityApplications } from "@/db/schema";
import { z } from "zod";
import { limit } from "@/lib/rate-limit";

const applicationSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().min(1, "Phone number is required").max(50),
  city: z.string().min(1, "City is required").max(255),
  state: z.string().min(1, "State is required").max(255),
  yearsOfExperience: z
    .string()
    .min(1, "Years of experience is required")
    .max(5000),
  expertiseAreas: z
    .array(z.string())
    .min(1, "Select at least one area of expertise"),
  portfolioImageUrl: z.string().max(500).optional().default(""),
  portfolioLinks: z.string().max(2000).optional().default(""),
  certifications: z.string().max(2000).optional().default(""),
  socialProfiles: z.string().max(2000).optional().default(""),
  availability: z
    .string()
    .min(1, "Availability is required")
    .max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await limit(`apply:${ip}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = await request.json();
    const parsed = applicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const [application] = await db
      .insert(communityApplications)
      .values(parsed.data)
      .returning();

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 },
    );
  }
}
