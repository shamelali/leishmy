import { SkeletonGrid } from "@/components/Skeleton";

export default function ArtistsLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="h-10 skeleton w-64 mb-4 rounded-lg" />
        <div className="h-5 skeleton w-96 mb-8 rounded-lg" />
        <div className="h-12 skeleton w-full mb-8 rounded-xl" />
        <SkeletonGrid count={6} />
      </div>
    </div>
  );
}
