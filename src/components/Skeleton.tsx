export default function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className || ""}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800">
      <div className="aspect-[4/5] skeleton" />
      <div className="p-5 space-y-3">
        <div className="h-4 skeleton w-3/4" />
        <div className="h-3 skeleton w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 w-16 skeleton rounded-full" />
          <div className="h-6 w-16 skeleton rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 w-20 skeleton" />
          <div className="h-4 w-12 skeleton" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5">
      <div className="flex gap-4">
        <div className="w-24 h-24 skeleton rounded-xl shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 skeleton w-1/3" />
          <div className="h-3 skeleton w-1/4" />
          <div className="h-3 skeleton w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonArtistDetail() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="h-96 skeleton" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-32 skeleton rounded-2xl" />
            <div className="h-64 skeleton rounded-2xl" />
            <div className="h-48 skeleton rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="h-96 skeleton rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
