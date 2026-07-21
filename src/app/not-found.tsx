import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-9xl font-bold text-gray-200 mb-4">404</div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-600 mb-8 max-w-md">The page you are looking for does not exist or has been moved.</p>
      <div className="flex gap-3">
        <Link href="/" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Go Home</Link>
        <Link href="/bookings" className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">My Bookings</Link>
      </div>
    </div>
  );
}
