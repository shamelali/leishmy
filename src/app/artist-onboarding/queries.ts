"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artistCategories, categories, services } from "@/db/schema";
import { getAuthSession } from "@/lib/auth/server";
import { limit } from "@/lib/rate-limit";

export type CategoryRow = { id: number; name: string; slug: string; icon: string | null };

export async function listCategories(): Promise<CategoryRow[]> {
  const session = await getAuthSession();
  if (!session) return [];
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
    })
    .from(categories)
    .orderBy(categories.name);
  return rows;
}

export type ArtistServiceRow = {
  id: number;
  name: string;
  description: string | null;
  duration: string | null;
  price: number;
  popular: boolean;
};

export async function listArtistServices(artistId: number): Promise<ArtistServiceRow[]> {
  const session = await getAuthSession();
  if (!session) return [];
  const rl = await limit(`onboarding:read:${session.id}`);
  if (!rl.success) return [];
  const rows = await db
    .select()
    .from(services)
    .where(eq(services.artistId, artistId));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    duration: r.duration,
    price: r.price ? Number(r.price) : 0,
    popular: r.popular ?? false,
  }));
}

export async function listSelectedCategoryIds(artistId: number): Promise<number[]> {
  const session = await getAuthSession();
  if (!session) return [];
  const rows = await db
    .select({ id: artistCategories.categoryId })
    .from(artistCategories)
    .where(eq(artistCategories.artistId, artistId));
  return rows.map((r) => r.id);
}
