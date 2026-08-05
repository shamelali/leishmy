"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { type ForwardRefExoticComponent, type RefAttributes, type SVGProps } from "react";

type LucideIcon = ForwardRefExoticComponent<SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>>;

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  badge?: number;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  activeId: string;
  onTabChange?: (id: string) => void;
  children: ReactNode;
}

export default function DashboardSidebar({ items, activeId, onTabChange, children }: DashboardSidebarProps) {
  const handleItemClick = (id: string, href?: string) => {
    if (href) return;
    onTabChange?.(id);
  };

  return (
    <div className="min-h-[80vh]">
      <div className="hidden md:flex gap-6">
        <nav className="w-56 shrink-0">
          <div className="sticky top-24 space-y-1">
            {items.map(({ id, label, icon: Icon, href, badge }) => {
              const isActive = activeId === id;
              const content = (
                <>
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                      {badge}
                    </span>
                  )}
                </>
              );
              if (href) {
                return (
                  <Link
                    key={id}
                    href={href}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-rose-500 text-white shadow-md shadow-rose-200/50 dark:shadow-rose-900/30"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {content}
                  </Link>
                );
              }
              return (
                <button
                  key={id}
                  onClick={() => onTabChange?.(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-rose-500 text-white shadow-md shadow-rose-200/50 dark:shadow-rose-900/30"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </nav>
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 px-2 pb-safe">
        <div className="flex items-center justify-around py-1">
          {items.map(({ id, label, icon: Icon, href, badge }) => {
            const isActive = activeId === id;
            if (href) {
              return (
                <Link
                  key={id}
                  href={href}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors ${
                    isActive ? "text-rose-500" : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-0.5 right-0 w-4 h-4 flex items-center justify-center text-[8px] font-bold bg-amber-500 text-white rounded-full">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </Link>
              );
            }
            return (
              <button
                key={id}
                onClick={() => onTabChange?.(id)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? "text-rose-500" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-0.5 right-0 w-4 h-4 flex items-center justify-center text-[8px] font-bold bg-amber-500 text-white rounded-full">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="md:hidden pb-20">{children}</main>
    </div>
  );
}