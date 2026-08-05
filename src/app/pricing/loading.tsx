export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-32 bg-gray-200 dark:bg-neutral-800 rounded-full animate-pulse mb-6" />
          <div className="h-10 w-3/4 mx-auto bg-gray-200 dark:bg-neutral-800 rounded animate-pulse mb-4" />
          <div className="h-4 w-1/2 mx-auto bg-gray-200 dark:bg-neutral-800 rounded animate-pulse mb-12" />
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-8 space-y-4"
              >
                <div className="h-6 w-24 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="h-4 w-40 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="h-12 w-1/3 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div
                      key={j}
                      className="h-4 w-full bg-gray-200 dark:bg-neutral-800 rounded animate-pulse"
                    />
                  ))}
                </div>
                <div className="h-10 w-full bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}