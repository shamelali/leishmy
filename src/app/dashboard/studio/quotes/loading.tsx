export default function StudioQuotesLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-4 skeleton w-32 rounded mb-6" />
      <div className="h-8 skeleton w-48 rounded-lg mb-2" />
      <div className="h-4 skeleton w-80 rounded mb-6" />
      <div className="h-10 skeleton w-64 rounded-lg mb-6" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 skeleton rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
