export default function InspirationLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-6">
      <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="break-inside-avoid">
            <div className={`bg-gray-200 rounded-xl animate-pulse ${i % 3 === 0 ? "h-64" : "h-48"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}