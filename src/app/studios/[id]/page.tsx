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
    // fall through
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
              <a
                href="https://wa.me/601137633788"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Chat on WhatsApp
              </a>
              <Link
                href="/artists"
                className="w-full mt-3 inline-flex items-center justify-center gap-2 py-3.5 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all text-sm"
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
