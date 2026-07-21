export default function PaymentsLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-4">
          <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid grid-cols-4 gap-4">
            <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}