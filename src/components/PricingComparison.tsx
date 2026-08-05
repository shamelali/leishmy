import { Check, X } from "lucide-react";

const features = [
  { label: "Basic Profile Listing", free: true, pro: true, business: true },
  { label: "Standard Booking Queue", free: true, pro: true, business: true },
  { label: "Up to 5 Services", free: true, pro: false, business: false },
  { label: "Unlimited Services & Packages", free: false, pro: true, business: true },
  { label: "Basic Analytics", free: true, pro: true, business: true },
  { label: "Advanced Analytics", free: false, pro: false, business: true },
  { label: "Featured Profile Placement", free: false, pro: true, business: true },
  { label: "Priority Booking Queue", free: false, pro: true, business: true },
  { label: "Customer Chat Inquiries", free: true, pro: true, business: true },
  { label: "Dedicated Support Chat", free: false, pro: true, business: true },
  { label: "Dedicated Account Manager", free: false, pro: false, business: true },
  { label: "API Access", free: false, pro: false, business: true },
  { label: "Multi-Studio Management", free: false, pro: false, business: true },
  { label: "Custom Branding", free: false, pro: false, business: true },
  { label: "Commission Rate", free: "12%", pro: "8%", business: "5%" },
  { label: "Price", free: "Free", pro: "RM99/mo", business: "RM299/mo" },
];

export function PricingComparison() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-neutral-800">
            <th className="text-left py-4 px-6 text-gray-500 dark:text-gray-400 font-medium">
              Feature
            </th>
            <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-bold">
              Free
            </th>
            <th className="text-center py-4 px-4 text-amber-600 dark:text-amber-400 font-bold">
              Pro
            </th>
            <th className="text-center py-4 px-4 text-blue-600 dark:text-blue-400 font-bold">
              Business
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
          {features.map((row) => (
            <tr key={row.label}>
              <td className="py-3.5 px-6 text-gray-900 dark:text-white font-medium">
                {row.label}
              </td>
              <td className="text-center py-3.5 px-4">
                {typeof row.free === "boolean" ? (
                  row.free ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                  )
                ) : (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {row.free}
                  </span>
                )}
              </td>
              <td className="text-center py-3.5 px-4">
                {typeof row.pro === "boolean" ? (
                  row.pro ? (
                    <Check className="w-5 h-5 text-amber-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                  )
                ) : (
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                    {row.pro}
                  </span>
                )}
              </td>
              <td className="text-center py-3.5 px-4">
                {typeof row.business === "boolean" ? (
                  row.business ? (
                    <Check className="w-5 h-5 text-blue-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                  )
                ) : (
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                    {row.business}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}