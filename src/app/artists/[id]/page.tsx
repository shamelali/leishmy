import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Star,
  MapPin,
  Clock,
  BadgeCheck,
  ArrowLeft,
  Languages,
  Palette,
} from "lucide-react";
import { db } from "@/db";
import { artists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { featuredArtists } from "@/lib/data";
import { BookingForm } from "@/components/BookingForm";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

async function findArtist(slug: string) {
  try {
    const rows = await db.select().from(artists).where(eq(artists.slug, slug)).limit(1);
    if (rows.length > 0) {
      const a = rows[0];
      return {
        id: String(a.id),
        name: a.name,
        slug: a.slug,
        image: a.image || "",
        location: a.location || "",
        rating: Number(a.rating) || 0,
        reviewCount: a.reviewCount || 0,
        price: Number(a.price) || 0,
        verified: a.verified || false,
        responseTime: a.responseTime || "",
        categories: [] as string[],
        specialties: [] as string[],
        languages: (a.languages || []) as string[],
        bio: a.bio || "",
        portfolio: (a.portfolio || []) as string[],
        featured: false,
      };
    }
  } catch {
    // fall through to mock
  }
  return featuredArtists.find((a) => a.slug === slug) || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artist = await findArtist(id);
  if (!artist)
    return { title: "Artist Not Found — Leish!" };
  return {
    title: `${artist.name} — Leish!`,
    description: artist.bio,
  };
}

export default async function ArtistDetailPage({ params }: Props) {
  const { id } = await params;
  const artist = await findArtist(id);

  if (!artist) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          href="/artists"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-rose-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Artists
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left Column - Artist Info */}
          <div className="lg:col-span-2">
            {/* Hero Image */}
            <div className="relative rounded-3xl overflow-hidden aspect-[16/10] mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artist.image}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 mb-2">
                  {artist.verified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {artist.rating} ({artist.reviewCount} reviews)
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  {artist.name}
                </h1>
              </div>
            </div>

            {/* Info cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
                <MapPin className="w-5 h-5 text-rose-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="font-semibold text-gray-900 dark:text-white">{artist.location}</p>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
                <Clock className="w-5 h-5 text-rose-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Response Time</p>
                <p className="font-semibold text-gray-900 dark:text-white">{artist.responseTime}</p>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
                <Palette className="w-5 h-5 text-rose-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Starting From</p>
                <p className="font-semibold text-gray-900 dark:text-white">MYR {artist.price}/hr</p>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{artist.bio}</p>
            </div>

            {/* Specialties */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {artist.specialties.map((s) => (
                  <span
                    key={s}
                    className="px-4 py-2 text-sm font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/50"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Languages className="w-5 h-5 text-rose-500" /> Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {artist.languages.map((lang) => (
                  <span
                    key={lang}
                    className="px-4 py-2 text-sm font-medium bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-neutral-700"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            {artist.portfolio.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Portfolio</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {artist.portfolio.map((img, i) => (
                    <div
                      key={i}
                      className="rounded-2xl overflow-hidden aspect-square group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`${artist.name} portfolio ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-700 shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Book {artist.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Starting from MYR {artist.price}/hr
                </p>
                <BookingForm artistId={artist.id} artistName={artist.name} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
