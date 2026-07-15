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
  AtSign,
  Award,
  CalendarDays,
  ExternalLink,
  Scissors,
  Clock as ClockIcon,
} from "lucide-react";
import { db } from "@/db";
import {
  artists,
  artistCategories,
  categories as categoriesTable,
  services as servicesTable,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { BookingForm } from "@/components/BookingForm";
import ArtistReviews from "@/components/ArtistReviews";
import ShareButtons from "@/components/ShareButtons";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

function formatAvailability(value: string): string {
  if (!value) return "";
  const map: Record<string, string> = {
    weekdays: "Weekdays only",
    weekends: "Weekends only",
    both: "Weekdays & Weekends",
    evenings: "Evenings only",
    flexible: "Flexible / By appointment",
    custom: "Custom schedule",
  };
  return map[value.toLowerCase()] || value;
}

async function findArtist(slug: string) {
  try {
    const rows = await db.select().from(artists).where(eq(artists.slug, slug)).limit(1);
    if (rows.length > 0) {
      const a = rows[0];

      const [categoryLinks, serviceRows] = await Promise.all([
        db
          .select({ categoryName: categoriesTable.name })
          .from(artistCategories)
          .innerJoin(categoriesTable, eq(artistCategories.categoryId, categoriesTable.id))
          .where(eq(artistCategories.artistId, a.id)),
        db
          .select({
            id: servicesTable.id,
            name: servicesTable.name,
            description: servicesTable.description,
            duration: servicesTable.duration,
            price: servicesTable.price,
            popular: servicesTable.popular,
          })
          .from(servicesTable)
          .where(eq(servicesTable.artistId, a.id))
          .orderBy(desc(servicesTable.popular), servicesTable.name),
      ]);

      return {
        id: String(a.id),
        name: a.name,
        slug: a.slug,
        image: a.image || "/placeholder.svg",
        location: a.location || "",
        area: a.area || "",
        district: a.district || "",
        rating: Number(a.rating) || 0,
        reviewCount: a.reviewCount || 0,
        price: Number(a.price) || 0,
        verified: a.verified || false,
        responseTime: a.responseTime || "",
        categories: categoryLinks.map((l) => l.categoryName),
        specialties: ((a.specialties as string[] | null) || []) as string[],
        languages: (a.languages || []) as string[],
        bio: a.bio || "",
        portfolio: (a.portfolio || []) as string[],
        instagramUrl: a.instagramUrl || "",
        tiktokUrl: a.tiktokUrl || "",
        certifications: a.certifications || "",
        availability: a.availability || "",
        services: serviceRows.map((s) => ({
          id: String(s.id),
          name: s.name,
          description: s.description || "",
          duration: s.duration || "",
          price: Number(s.price) || 0,
          popular: Boolean(s.popular),
        })),
        featured: false,
      };
    }
  } catch {
    console.error("Failed to fetch artist detail");
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artist = await findArtist(id);
  const t = await getTranslations("artistDetail");
  const m = await getTranslations("metadata");
  if (!artist)
    return { title: t("detailNotFound") };
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://leish.my";
  return {
    title: `${artist.name} — ${m("brand")}`,
    description: artist.bio || `Makeup artist in ${[artist.district, artist.area, artist.location].filter(Boolean).join(", ") || "Malaysia"}`,
    openGraph: {
      title: `${artist.name} — Leish.my`,
      description: `⭐ ${artist.rating} | ${artist.location || "Malaysia"} ${artist.price ? `| From RM${artist.price}` : ""}`,
      url: `${baseUrl}/artists/${artist.slug}`,
      siteName: "Leish.my",
      images: artist.image ? [{ url: artist.image, width: 800, height: 600 }] : [],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${artist.name} — Leish.my`,
      description: `⭐ ${artist.rating} | ${artist.location || "Malaysia"} ${artist.price ? `| From RM${artist.price}` : ""}`,
      images: artist.image ? [artist.image] : [],
    },
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
              <div className="absolute top-4 right-4">
                <ShareButtons url={`${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/r/${artist.slug}`} title={`${artist.name} — Book on Leish!`} variant="dropdown" />
              </div>
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
                <MapPin className="w-5 h-5 text-rose-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {[artist.district, artist.area, artist.location].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
                <Clock className="w-5 h-5 text-rose-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Response Time</p>
                <p className="font-semibold text-gray-900 dark:text-white">{artist.responseTime || "—"}</p>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
                <Palette className="w-5 h-5 text-rose-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Starting From</p>
                <p className="font-semibold text-gray-900 dark:text-white">MYR {artist.price}/hr</p>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
                <CalendarDays className="w-5 h-5 text-rose-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Availability</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatAvailability(artist.availability) || "—"}</p>
              </div>
            </div>

            {/* Bio */}
            {artist.bio && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{artist.bio}</p>
              </div>
            )}

            {/* Specialties */}
            {artist.specialties.length > 0 && (
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
            )}

            {/* Languages */}
            {artist.languages.length > 0 && (
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
            )}

            {/* Certifications */}
            {artist.certifications && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-rose-500" /> Certifications & Training
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {artist.certifications}
                </p>
              </div>
            )}

            {/* Social */}
            {(artist.instagramUrl || artist.tiktokUrl) && (
              <div className="mb-8 flex flex-wrap gap-3">
                {artist.instagramUrl && (
                  <a
                    href={artist.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <AtSign className="w-4 h-4" /> Instagram
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                )}
                {artist.tiktokUrl && (
                  <a
                    href={artist.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    TikTok
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                )}
              </div>
            )}

            {/* Services */}
            {artist.services.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-rose-500" /> Services
                </h2>
                <div className="space-y-3">
                  {artist.services.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {s.name}
                          </h3>
                          {s.popular && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                              Popular
                            </span>
                          )}
                        </div>
                        {s.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {s.description}
                          </p>
                        )}
                        {s.duration && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 inline-flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" /> {s.duration}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                          MYR {s.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            <ArtistReviews
              artistId={artist.id}
              artistName={artist.name}
              services={artist.services.map((s) => ({ id: s.id, name: s.name }))}
            />
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
