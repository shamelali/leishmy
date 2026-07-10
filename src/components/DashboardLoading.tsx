import { Loader2 } from "lucide-react";

export function DashboardLoading({ fullPage = false }: { fullPage?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${fullPage ? "min-h-[60vh]" : "py-16"}`}>
      <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
    </div>
  );
}
