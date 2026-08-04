"use client";

import { type ReactNode } from "react";
import {
  User,
  Image,
  Calendar,
  Tag,
  Wallet,
  Package,
  Percent,
  FileText,
  Lock,
} from "lucide-react";

export type TabId = "profile" | "portfolio" | "bookings" | "quotes" | "prices" | "packages" | "pricing" | "payouts" | "account";

interface Tab {
  id: TabId;
  label: string;
  icon: typeof User;
}

export const tabs: Tab[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "portfolio", label: "Portfolio", icon: Image },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "quotes", label: "Quotes", icon: FileText },
  { id: "prices", label: "Prices", icon: Tag },
  { id: "packages", label: "Packages", icon: Package },
  { id: "pricing", label: "Pricing Rules", icon: Percent },
  { id: "payouts", label: "Payouts", icon: Wallet },
  { id: "account", label: "Account", icon: Lock },
];

interface ArtistDashboardTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
  pendingBookings?: number;
  pendingQuotes?: number;
}

export default function ArtistDashboardTabs({
  activeTab,
  onTabChange,
  children,
  pendingBookings,
  pendingQuotes,
}: ArtistDashboardTabsProps) {
  return (
    <div className="min-h-[80vh]">
      {/* Desktop sidebar + content */}
      <div className="hidden md:flex gap-6">
        <nav className="w-56 shrink-0">
          <div className="sticky top-24 space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id
                    ? "bg-rose-500 text-white shadow-md shadow-rose-200/50 dark:shadow-rose-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
                {id === "bookings" && pendingBookings !== undefined && pendingBookings > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                    {pendingBookings}
                  </span>
                )}
                {id === "quotes" && pendingQuotes !== undefined && pendingQuotes > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                    {pendingQuotes}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 px-2 pb-safe">
        <div className="flex items-center justify-around py-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors ${
                activeTab === id
                  ? "text-rose-500"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
              {id === "bookings" && pendingBookings !== undefined && pendingBookings > 0 && (
                <span className="absolute -top-0.5 right-0 w-4 h-4 flex items-center justify-center text-[8px] font-bold bg-amber-500 text-white rounded-full">
                  {pendingBookings > 9 ? "9+" : pendingBookings}
                </span>
              )}
              {id === "quotes" && pendingQuotes !== undefined && pendingQuotes > 0 && (
                <span className="absolute -top-0.5 right-0 w-4 h-4 flex items-center justify-center text-[8px] font-bold bg-amber-500 text-white rounded-full">
                  {pendingQuotes > 9 ? "9+" : pendingQuotes}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile content (scrollable above tab bar) */}
      <main className="md:hidden pb-20">{children}</main>
    </div>
  );
}
