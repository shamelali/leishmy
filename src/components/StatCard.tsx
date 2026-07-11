import { TrendingUp } from "lucide-react";

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  sub?: string;
  change?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: { card: "p-5", icon: "w-5 h-5", value: "text-xl" },
  md: { card: "p-4 sm:p-6", icon: "w-5 h-5", value: "text-xl sm:text-2xl" },
  lg: { card: "p-6", icon: "w-5 h-5", value: "text-2xl" },
};

export default function StatCard({ icon: Icon, label, value, color, bg, sub, change, size = "md" }: StatCardProps) {
  const s = sizeClasses[size];

  return (
    <div className={`${s.card} ${bg} rounded-2xl border border-gray-100 dark:border-neutral-800`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`${s.icon} ${color}`} />
        </div>
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className={`${s.value} font-bold text-gray-900 dark:text-white`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {change && (
        <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
          <TrendingUp className="w-3 h-3" /> {change}
        </p>
      )}
    </div>
  );
}
