import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/server";
import { getArtistProfileForEdit } from "../actions";
import {
  listArtistServices,
  listCategories,
  listSelectedCategoryIds,
} from "../queries";
import { WizardStepper, type StepKey } from "../components/WizardStepper";
import { StepBasics } from "../components/StepBasics";
import { StepProfessional } from "../components/StepProfessional";
import { StepPortfolio } from "../components/StepPortfolio";
import { StepServices } from "../components/StepServices";
import { StepReview } from "../components/StepReview";
import { extractPublicId, isCloudinaryUrl } from "@/lib/cloudinary-client";

export const dynamic = "force-dynamic";

const STEP_PATHS: Record<number, StepKey> = {
  1: "basics",
  2: "professional",
  3: "portfolio",
  4: "services",
  5: "review",
};

const STEP_TO_INDEX: Record<StepKey, number> = {
  basics: 1,
  professional: 2,
  portfolio: 3,
  services: 4,
  review: 5,
};

function safeStep(step: string | undefined): StepKey {
  const n = Number(step);
  if (n >= 1 && n <= 5) return STEP_PATHS[n];
  return "basics";
}

export default async function WizardCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login?next=/artist-onboarding/create");
  }

  const params = await searchParams;
  const requested = safeStep(params.step);
  const profile = await getArtistProfileForEdit();

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-neutral-950 dark:to-neutral-900 px-4 py-10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your profile&hellip;</p>
        </div>
      </main>
    );
  }

  const furthestReached = Math.min(profile.onboardingStep ?? 0, 4);
  const currentIdx = STEP_TO_INDEX[requested] - 1;

  if (currentIdx > furthestReached) {
    redirect(`/artist-onboarding/create?step=${furthestReached + 1}`);
  }

  const status = profile.status;
  const isReadOnly = status === "pending_verification" || status === "verified";

  let categories: { id: number; name: string; slug: string; icon: string | null }[] = [];
  let selectedCategoryIds: string[] = [];
  let artistServices: Awaited<ReturnType<typeof listArtistServices>> = [];
  let portfolioItems: { url: string; publicId: string; alt?: string }[] = [];

  if (requested === "professional" || requested === "review") {
    [categories, selectedCategoryIds] = await Promise.all([
      listCategories(),
      listSelectedCategoryIds(profile.id),
    ]);
  }
  if (requested === "services" || requested === "review") {
    artistServices = await listArtistServices(profile.id);
  }
  if (requested === "portfolio" || requested === "review") {
    portfolioItems = (profile.portfolio ?? []).map((url, i) => {
      const publicId = isCloudinaryUrl(url) ? extractPublicId(url) : null;
      return {
        url,
        publicId: publicId ?? `existing-${i}`,
        alt: "",
      };
    });
  }

  const stepHref = (n: number) => `/artist-onboarding/create?step=${n}`;
  const prevHref = currentIdx > 0 ? stepHref(currentIdx) : null;
  const nextHref = stepHref(currentIdx + 2);

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-neutral-950 dark:to-neutral-900 px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <a
            href="/dashboard/artist"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors mb-4"
          >
            ← Back to dashboard
          </a>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Create Your Artist Profile
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Set up your professional presence in five guided steps.</p>
        </div>

        {status === "rejected" && profile.rejectionReason && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
          >
            <strong className="font-semibold">Profile needs changes</strong>
            <p className="mt-1">{profile.rejectionReason}</p>
          </div>
        )}

        {isReadOnly && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            Your profile is currently under review or already published. Some fields are locked.
          </div>
        )}

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-4 sm:p-6 mb-6 shadow-sm">
          <WizardStepper
            current={requested}
            furthestReached={furthestReached}
            status={status as "draft" | "verified" | "pending_verification" | "rejected" | "suspended"}
          />
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-5 sm:p-8 shadow-sm">
          {requested === "basics" && (
            <StepBasics
              initial={{
                name: profile.name ?? undefined,
                email: profile.email ?? undefined,
                phone: profile.phone ?? undefined,
                image: profile.image ?? undefined,
                location: profile.location ?? undefined,
                area: profile.area ?? undefined,
                district: profile.district ?? undefined,
              }}
              nextHref={nextHref}
              prevHref={prevHref}
            />
          )}
          {requested === "professional" && (
            <StepProfessional
              initial={{
                bio: profile.bio ?? undefined,
                experience: profile.experience ?? undefined,
                languages: profile.languages ?? undefined,
                specialties: profile.specialties ?? undefined,
                instagramUrl: profile.instagramUrl ?? undefined,
                tiktokUrl: profile.tiktokUrl ?? undefined,
                willingToTravel: profile.willingToTravel ?? undefined,
                travelCoverage: profile.travelCoverage ?? undefined,
                operatingDays: profile.operatingDays ?? undefined,
                responseTime: profile.responseTime ?? undefined,
              }}
              nextHref={nextHref}
              prevHref={prevHref ?? ""}
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
            />
          )}
          {requested === "portfolio" && (
            <StepPortfolio
              initial={portfolioItems}
              nextHref={nextHref}
              prevHref={prevHref ?? ""}
            />
          )}
          {requested === "services" && (
            <StepServices
              initialServices={artistServices.map((s) => ({
                name: s.name,
                description: s.description ?? "",
                duration: s.duration ?? "",
                price: s.price,
                popular: s.popular,
              }))}
              initialPrice={profile.price}
              nextHref={nextHref}
              prevHref={prevHref ?? ""}
            />
          )}
          {requested === "review" && (
            <StepReview
              summary={{
                name: profile.name,
                email: profile.email,
                location: profile.location,
                bio: profile.bio,
                experience: profile.experience,
                portfolioCount: portfolioItems.length,
                serviceCount: artistServices.length,
              }}
              prevHref={prevHref ?? ""}
              status={status as "draft" | "pending_verification" | "verified" | "rejected" | "suspended"}
            />
          )}
        </div>
      </div>
    </main>
  );
}
