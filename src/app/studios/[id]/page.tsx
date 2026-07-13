import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, MapPin, Users, ArrowLeft, Wifi, Car, Crown, Coffee } from "lucide-react";
import { db } from "@/db";
import { studios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

const amenityIcons: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  Parking: Car,
  "VIP Room": Crown,
  "Private Room": Crown,
  Refreshments: Coffee,
};

async function findStudio(slug: string) {
  try {
    const rows = await db.select().from(studios).where(eq(studios.slug, slug)).limit(1);
    if (rows.length > 0) {
      const s = rows[0];
      return {
        id: String(s.id),
        name: s.name,
        slug: s.slug || String(s.id),
        image: s.image || "/placeholder.svg",
        location: s.location || "",
        rating: Number(s.rating) || 0,
        reviewCount: s.reviewCount || 0,
        priceRange: s.price ? `MYR ${s.price}` : "Contact for price",
        description: s.description || "",
        amenities: [] as string[],
        artistCount: 0,
        featured: s.featured || false,
      };
    }
  } catch {
    console.error("Failed to fetch studio detail");
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const studio = await findStudio(id);
  const t = await getTranslations("studioDetail");
  const m = await getTranslations("metadata");
  if (!studio) return { title: t("detailNotFound") };
  return {
    title: `${studio.name} — ${m("brand")}`,
    description: studio.description,
  };
}

export default async function StudioDetailPage({ params }: Props) {
  const { id } = await params;
  const studio = await findStudio(id);

  if (!studio) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          href="/studios"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-rose-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Studios
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden aspect-[2/1] mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={studio.image}
            alt={studio.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {studio.rating} ({studio.reviewCount} reviews)
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {studio.name}
            </h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Info cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
                <MapPin className="w-5 h-5 text-rose-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="font-semibold text-gray-900 dark:text-white">{studio.location}</p>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
                <Users className="w-5 h-5 text-rose-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Artists</p>
                <p className="font-semibold text-gray-900 dark:text-white">{studio.artistCount} professionals</p>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
                <Star className="w-5 h-5 text-rose-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Price Range</p>
                <p className="font-semibold text-gray-900 dark:text-white">{studio.priceRange}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{studio.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {studio.amenities.map((amenity) => {
                  const Icon = amenityIcons[amenity] || Wifi;
                  return (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800"
                    >
                      <Icon className="w-5 h-5 text-rose-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-700 shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Contact Studio
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Get in touch to book a session at {studio.name}.
              </p>
              <Link
                href="/artists"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg text-sm"
              >
                Browse Our Artists
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
