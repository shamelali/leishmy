export default function CalendarLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="h-8 skeleton w-48 rounded-lg" />
      <div className="h-96 skeleton rounded-2xl" />
    </div>
  );
}
