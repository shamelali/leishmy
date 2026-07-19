"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  profiles,
  users,
  services,
} from "@/db/schema";
import { getAuthSession } from "@/lib/auth/server";
import { limit } from "@/lib/rate-limit";
import {
  stepBasicsSchema,
  stepPortfolioSchema,
  stepProfessionalSchema,
  stepReviewSchema,
  stepServicesSchema,
} from "@/lib/validations/artist";
import { safeSlug, withSuffix } from "@/lib/utils/slug";
import { extractPublicId } from "@/lib/cloudinary-client";
import {
  deleteAssets,
  isOwnerScopedPublicId,
} from "@/lib/cloudinary-server";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const MAX_PORTFOLIO = 12;
const MAX_SERVICES = 25;

function flattenErrors(
  err: import("zod").ZodError,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = [];
    out[key].push(issue.message);
  }
  return out;
}

async function requireUser() {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login?next=/artist-onboarding/create");
  }
  return session;
}

type ArtistRow = {
  userId: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  location: string | null;
  slug: string | null;
  bio: string | null;
  experience: number | null;
  languages: string[] | null;
  specialties: any | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  willingToTravel: boolean | null;
  travelCoverage: string | null;
  operatingDays: any | null;
  responseTime: string | null;
  portfolio: string[] | null;
  price: string | null;
  onboardingStep: number | null;
  status: string | null;
  rejectionReason: string | null;
};

async function getOrCreateArtist(userId: string): Promise<ArtistRow> {
  const [existing] = await db
    .select({
      userId: profiles.userId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      image: users.image,
      location: users.location,
      slug: profiles.slug,
      bio: profiles.bio,
      experience: profiles.experience,
      languages: profiles.languages,
      specialties: profiles.specialties,
      instagramUrl: profiles.instagramUrl,
      tiktokUrl: profiles.tiktokUrl,
      willingToTravel: profiles.willingToTravel,
      travelCoverage: profiles.travelCoverage,
      operatingDays: profiles.operatingDays,
      responseTime: profiles.responseTime,
      portfolio: profiles.portfolio,
      price: profiles.price,
      onboardingStep: profiles.onboardingStep,
      status: profiles.status,
      rejectionReason: profiles.rejectionReason,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.userId, userId), eq(profiles.role, "artist")))
    .limit(1);

  if (existing) return existing as ArtistRow;

  await db
    .insert(profiles)
    .values({
      userId,
      role: "artist",
      status: "draft",
      onboardingStep: 0,
    });

  const [created] = await db
    .select({
      userId: profiles.userId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      image: users.image,
      location: users.location,
      slug: profiles.slug,
      bio: profiles.bio,
      experience: profiles.experience,
      languages: profiles.languages,
      specialties: profiles.specialties,
      instagramUrl: profiles.instagramUrl,
      tiktokUrl: profiles.tiktokUrl,
      willingToTravel: profiles.willingToTravel,
      travelCoverage: profiles.travelCoverage,
      operatingDays: profiles.operatingDays,
      responseTime: profiles.responseTime,
      portfolio: profiles.portfolio,
      price: profiles.price,
      onboardingStep: profiles.onboardingStep,
      status: profiles.status,
      rejectionReason: profiles.rejectionReason,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!created) {
    throw new Error("Failed to initialize artist profile");
  }
  return created as ArtistRow;
}

function assertOwnership(artist: { userId: string | null }, userId: string) {
  if (artist.userId !== userId) {
    throw new Error("Forbidden");
  }
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = safeSlug(name);
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? base : withSuffix(base, attempt);
    const [taken] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.slug, candidate))
      .limit(1);
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function saveStepBasics(input: unknown): Promise<ActionResult<{ id: number; step: number }>> {
  const session = await requireUser();
  const rl = await limit(`onboarding:basics:${session.id}`);
  if (!rl.success) {
    return { ok: false, error: "Too many requests, please slow down." };
  }

  const parsed = stepBasicsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please review the highlighted fields.",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  const data = parsed.data;

  const current = await getOrCreateArtist(session.id);
  assertOwnership(current, session.id);

  let slug = current.slug;
  if (!slug || (current.name ?? "").startsWith("Draft-")) {
    slug = await generateUniqueSlug(data.name);
  }

  await db
    .update(users)
    .set({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      image: data.image || null,
      location: data.location,
    })
    .where(eq(users.id, session.id));

  await db
    .update(profiles)
    .set({
      slug,
      area: data.area || null,
      district: data.district || null,
      onboardingStep: Math.max(current.onboardingStep ?? 0, 1),
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, session.id));

  revalidatePath("/artist-onboarding/create");
  return { ok: true, data: { id: 0, step: 1 } };
}

export async function saveStepProfessional(input: unknown): Promise<ActionResult<{ step: number }>> {
  const session = await requireUser();
  const rl = await limit(`onboarding:professional:${session.id}`);
  if (!rl.success) {
    return { ok: false, error: "Too many requests, please slow down." };
  }

  const parsed = stepProfessionalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please review the highlighted fields.",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  const data = parsed.data;

  const current = await getOrCreateArtist(session.id);
  assertOwnership(current, session.id);

  if ((current.onboardingStep ?? 0) < 1) {
    return { ok: false, error: "Please complete the previous step first." };
  }

  await db
    .update(profiles)
    .set({
      bio: data.bio,
      experience: data.experience,
      languages: data.languages,
      specialties: data.specialties,
      instagramUrl: data.instagramUrl || null,
      tiktokUrl: data.tiktokUrl || null,
      willingToTravel: data.willingToTravel,
      travelCoverage: data.willingToTravel ? data.travelCoverage || null : null,
      operatingDays: data.operatingDays,
      responseTime: data.responseTime || null,
      categories: data.categoryIds as string[],
      onboardingStep: Math.max(current.onboardingStep ?? 0, 2),
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, session.id));

  revalidatePath("/artist-onboarding/create");
  return { ok: true, data: { step: 2 } };
}

export async function saveStepPortfolio(input: unknown): Promise<ActionResult<{ step: number; count: number }>> {
  const session = await requireUser();
  const rl = await limit(`onboarding:portfolio:${session.id}`);
  if (!rl.success) {
    return { ok: false, error: "Too many requests, please slow down." };
  }

  const parsed = stepPortfolioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please upload at least one portfolio image.",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  const urls = parsed.data.portfolio.map((p) => p.url);
  if (urls.length > MAX_PORTFOLIO) {
    return { ok: false, error: `Maximum ${MAX_PORTFOLIO} images allowed.` };
  }

  const current = await getOrCreateArtist(session.id);
  assertOwnership(current, session.id);

  if ((current.onboardingStep ?? 0) < 2) {
    return { ok: false, error: "Please complete the previous step first." };
  }

  const previousUrls = current.portfolio ?? [];
  const nextSet = new Set(urls);
  const removedPublicIds: string[] = [];
  for (const oldUrl of previousUrls) {
    if (nextSet.has(oldUrl)) continue;
    const publicId = extractPublicId(oldUrl);
    if (publicId && isOwnerScopedPublicId(publicId, session.id)) {
      removedPublicIds.push(publicId);
    }
  }

  await db
    .update(profiles)
    .set({
      portfolio: urls,
      onboardingStep: Math.max(current.onboardingStep ?? 0, 3),
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, session.id));

  if (removedPublicIds.length > 0) {
    void deleteAssets(removedPublicIds).catch((err) => {
      console.error(
        `[onboarding:portfolio] cloudinary delete failed for user ${session.id}:`,
        err,
      );
    });
  }

  revalidatePath("/artist-onboarding/create");
  return {
    ok: true,
    data: { step: 3, count: urls.length },
  };
}

export async function saveStepServices(input: unknown): Promise<ActionResult<{ step: number; count: number }>> {
  const session = await requireUser();
  const rl = await limit(`onboarding:services:${session.id}`);
  if (!rl.success) {
    return { ok: false, error: "Too many requests, please slow down." };
  }

  const parsed = stepServicesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please add at least one service.",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  if (parsed.data.services.length > MAX_SERVICES) {
    return { ok: false, error: `Maximum ${MAX_SERVICES} services allowed.` };
  }

  const current = await getOrCreateArtist(session.id);
  assertOwnership(current, session.id);

  if ((current.onboardingStep ?? 0) < 3) {
    return { ok: false, error: "Please complete the previous step first." };
  }

  await db.transaction(async (tx) => {
    await tx.delete(services).where(eq(services.artistId, session.id));
    if (parsed.data.services.length > 0) {
      await tx.insert(services).values(
        parsed.data.services.map((s) => ({
          artistId: session.id,
          name: s.name,
          description: s.description || null,
          duration: s.duration || null,
          price: String(s.price),
          popular: s.popular,
        })),
      );
    }
    await tx
      .update(profiles)
      .set({
        price: String(parsed.data.price),
        onboardingStep: Math.max(current.onboardingStep ?? 0, 4),
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, session.id));
  });

  revalidatePath("/artist-onboarding/create");
  return { ok: true, data: { step: 4, count: parsed.data.services.length } };
}

export async function submitProfile(input: unknown): Promise<ActionResult<{ status: string; slug: string | null }>> {
  const session = await requireUser();
  const rl = await limit(`onboarding:submit:${session.id}`);
  if (!rl.success) {
    return { ok: false, error: "Too many requests, please slow down." };
  }

  const parsed = stepReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please accept the required agreements.",
      fieldErrors: flattenErrors(parsed.error),
    };
  }

  const [current] = await db
    .select({
      userId: profiles.userId,
      name: users.name,
      slug: profiles.slug,
      portfolio: profiles.portfolio,
      onboardingStep: profiles.onboardingStep,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.userId, session.id), eq(profiles.role, "artist")))
    .limit(1);

  if (!current) {
    return { ok: false, error: "No profile found. Please complete the previous steps." };
  }
  assertOwnership(current, session.id);

  if ((current.onboardingStep ?? 0) < 4) {
    return { ok: false, error: "Please complete all steps before submitting." };
  }

  if (!current.portfolio || current.portfolio.length === 0) {
    return { ok: false, error: "Add at least one portfolio image." };
  }

  const [servicesCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(services)
    .where(eq(services.artistId, session.id));
  if (!servicesCount?.count) {
    return { ok: false, error: "Add at least one service." };
  }

  const [updated] = await db
    .update(profiles)
    .set({
      status: "pending_verification",
      onboardingStep: 5,
      rejectionReason: null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, session.id))
    .returning({ status: profiles.status, slug: profiles.slug });

  revalidatePath("/artist-onboarding/create");
  revalidatePath("/dashboard/artist");
  return {
    ok: true,
    data: { status: updated.status ?? "pending_verification", slug: updated.slug },
  };
}

export async function getArtistProfileForEdit() {
  const session = await getAuthSession();
  if (!session) return null;
  const [row] = await db
    .select({
      userId: profiles.userId,
      name: users.name,
      slug: profiles.slug,
      email: users.email,
      phone: users.phone,
      image: users.image,
      location: users.location,
      area: profiles.area,
      district: profiles.district,
      bio: profiles.bio,
      experience: profiles.experience,
      languages: profiles.languages,
      specialties: profiles.specialties,
      instagramUrl: profiles.instagramUrl,
      tiktokUrl: profiles.tiktokUrl,
      willingToTravel: profiles.willingToTravel,
      travelCoverage: profiles.travelCoverage,
      operatingDays: profiles.operatingDays,
      responseTime: profiles.responseTime,
      portfolio: profiles.portfolio,
      price: profiles.price,
      onboardingStep: profiles.onboardingStep,
      status: profiles.status,
      rejectionReason: profiles.rejectionReason,
      categories: profiles.categories,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.userId, session.id), eq(profiles.role, "artist")))
    .limit(1);
  if (!row) return null;
  return {
    id: row.userId,
    name: row.name,
    slug: row.slug,
    email: row.email,
    phone: row.phone,
    image: row.image,
    location: row.location,
    area: row.area,
    district: row.district,
    bio: row.bio,
    experience: row.experience ?? 0,
    languages: row.languages ?? [],
    specialties: (row.specialties as string[] | null) ?? [],
    categories: (row.categories as string[] | null) ?? [],
    instagramUrl: row.instagramUrl,
    tiktokUrl: row.tiktokUrl,
    willingToTravel: row.willingToTravel ?? false,
    travelCoverage: row.travelCoverage,
    operatingDays: (row.operatingDays as string[] | null) ?? [],
    responseTime: row.responseTime,
    portfolio: row.portfolio ?? [],
    price: row.price ? Number(row.price) : 0,
    onboardingStep: row.onboardingStep ?? 0,
    status: row.status ?? "draft",
    rejectionReason: row.rejectionReason,
  };
}
