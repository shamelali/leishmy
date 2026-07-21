export default function LeishPlusLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      <div className="text-center space-y-4">
        <div className="h-10 w-64 mx-auto bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-96 mx-auto bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-8 border rounded-2xl space-y-4">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}