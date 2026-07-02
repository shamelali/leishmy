export default function DashboardAdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 skeleton w-48 rounded-lg" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 skeleton w-24 rounded-lg" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
