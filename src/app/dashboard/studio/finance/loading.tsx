export default function FinanceLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="h-8 skeleton w-48 rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-28 skeleton rounded-2xl" />
        ))}
      </div>
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );
}
