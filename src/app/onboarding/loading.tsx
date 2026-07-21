export default function OnboardingLoading() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-xl space-y-3">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-12 w-32 bg-gray-200 rounded-lg animate-pulse" />
    </div>
  );
}