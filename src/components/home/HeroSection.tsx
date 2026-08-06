import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Star, Clock } from "lucide-react";
import { db } from "@/db";
import { adminSettings, profiles, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { cldImage } from "@/lib/cloudinary-url-gen";

function getCloudinaryUrl(publicId: string): string {
  return cldImage(publicId, { width: 1920, crop: "fill", quality: "auto", format: "auto" });
}

async function getHeroBgImage(): Promise<string> {
  try {
    const rows = await db.select().from(adminSettings).where(eq(adminSettings.key, "hero_bg_image")).limit(1);
    if (rows[0]?.value) return rows[0].value;
  } catch {}
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (cloudName) {
    return getCloudinaryUrl("artfulcolorworks-ai-generated-9159114");
  }
  return "";
}

async function getFeaturedArtist() {
  try {
    const rows = await db
      .select({
        userId: profiles.userId,
        slug: profiles.slug,
        rating: profiles.rating,
        reviewCount: profiles.reviewCount,
        price: profiles.price,
        specialties: profiles.specialties,
        image: users.image,
        name: users.name,
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(
        and(
          eq(profiles.role, "artist"),
          eq(profiles.featured, true),
          eq(profiles.status, "active"),
        ),
      )
      .orderBy(desc(profiles.rating))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      slug: r.slug || r.userId,
      name: r.name || "Featured Artist",
      image: r.image || "",
      rating: r.rating ? Number(r.rating) : 0,
      reviewCount: r.reviewCount || 0,
      price: r.price ? Number(r.price) : 0,
      specialties: (r.specialties as string[] | null)?.slice(0, 2) || [],
    };
  } catch {
    return null;
  }
}

export interface HeroStats {
  value: string;
  label: string;
}

export async function HeroSection({ stats }: { stats?: HeroStats[] }) {
  const [heroBg, featuredArtist] = await Promise.all([getHeroBgImage(), getFeaturedArtist()]);

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
{heroBg && (
  <Image
    src={heroBg}
    alt=""
    fill
    className="w-full h-full object-cover animate-ken-burns"
    aria-hidden="true"
    priority
  />
)}
{/* Dark gradient overlay */}
<div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30 dark:from-black/90 dark:via-black/60 dark:to-black/40" />
{/* Bottom fade */}
<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
</div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
        {/* Left Content - Glassmorphism Card */}
        <div className="glass-dark rounded-3xl p-8 sm:p-10 backdrop-blur-xl bg-white/10 dark:bg-black/30 border border-white/20 dark:border-white/10 animate-slide-in-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-semibold rounded-full mb-6 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Book Beauty. Anywhere.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight">
            Your Beauty,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-300 to-rose-400">
              Perfected.
            </span>
          </h1>

          <p className="mt-6 text-lg text-white/70 leading-relaxed max-w-xl">
            Discover top-rated makeup artists and studios, check real-time availability,
            and book in minutes.
          </p>

          {/* Trust Bar */}
          <div className="flex items-center gap-3 mt-6 text-sm text-white/60">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-medium text-white/80">4.9</span>
            <span>from 500+ reviews</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              href="/artists"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-2xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-xl shadow-rose-500/30 hover:scale-105 active:scale-100 text-base"
            >
              Find &amp; Book Artists <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/studios"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-base"
            >
              Explore Studios
            </Link>
          </div>

          {/* Stats */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="text-center animate-fade-in-up"
                  style={{ animationDelay: `${300 + i * 100}ms` }}
                >
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right - Featured Artist Peek Card */}
        <div className="hidden lg:flex flex-col items-end gap-4 animate-slide-in-right">
          {/* Floating "Next Available" card */}
          <div className="glass-dark rounded-2xl p-4 backdrop-blur-xl bg-white/10 border border-white/15 w-64 animate-float">
            <div className="flex items-center gap-2 text-white/60 text-xs mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Next Available</span>
            </div>
            <p className="text-white font-semibold text-sm">Tomorrow, 10:00 AM</p>
            <p className="text-white/50 text-xs mt-1">Bridal Makeup</p>
          </div>

          {/* Featured Artist Card */}
          {featuredArtist && (
            <Link
              href={`/artists/${featuredArtist.slug}`}
              className="group glass-dark rounded-2xl p-5 backdrop-blur-xl bg-white/10 border border-white/15 w-72 hover:bg-white/15 transition-all animate-float"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 ring-2 ring-rose-400/50">
                  {featuredArtist.image ? (
                    <Image
                      src={featuredArtist.image}
                      alt={featuredArtist.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                      {featuredArtist.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-semibold text-sm truncate">{featuredArtist.name}</p>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-500/80 text-white rounded-full">
                      PRO
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-white/80 text-xs font-medium">{featuredArtist.rating}</span>
                    <span className="text-white/40 text-xs">({featuredArtist.reviewCount})</span>
                  </div>
                </div>
              </div>
              {featuredArtist.specialties.length > 0 && (
                <div className="flex gap-1.5 mt-3">
                  {featuredArtist.specialties.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 text-[10px] font-medium bg-white/10 text-white/70 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <span className="text-white/50 text-xs">Starting from</span>
                <span className="text-white font-bold text-sm">
                  {featuredArtist.price > 0 ? `RM ${featuredArtist.price}` : "Contact"}
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
