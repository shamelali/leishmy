export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="h-10 w-48 bg-gray-200 dark:bg-neutral-800 rounded mb-3 animate-pulse mx-auto" />
      <div className="h-4 w-96 max-w-full bg-gray-200 dark:bg-neutral-800 rounded mb-10 mx-auto animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <div className="aspect-video bg-gray-200 dark:bg-neutral-800 animate-pulse" />
            <div className="p-5 space-y-2">
              <div className="h-5 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
