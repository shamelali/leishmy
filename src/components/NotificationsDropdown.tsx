"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Trash2, Calendar, Star, UserPlus, Info, X } from "lucide-react";
import { useNotifications } from "@/context/NotificationsContext";

const iconMap: Record<string, typeof Bell> = {
  booking_confirmed: Calendar,
  booking_cancelled: X,
  booking_reminder: Calendar,
  review_request: Star,
  new_artist: UserPlus,
  welcome: Info,
};

const colorMap: Record<string, string> = {
  booking_confirmed:
    "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
  booking_cancelled:
    "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400",
  booking_reminder:
    "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",
  review_request:
    "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
  new_artist:
    "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
  welcome: "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400",
};

export default function NotificationsDropdown() {
  const { notifications, unread, markRead, markAllRead, clearAll } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (dateStr: string) => {
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-scale-in">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 z-50 animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-medium text-rose-500 hover:text-rose-600 transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-200 dark:text-neutral-700 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = iconMap[notif.type] || Bell;
                const color =
                  colorMap[notif.type] ||
                  "bg-gray-100 dark:bg-neutral-800 text-gray-500";
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer ${!notif.read ? "bg-rose-50/30 dark:bg-rose-950/10" : ""}`}
                    onClick={() => {
                      markRead(notif.id);
                      if (notif.link) setOpen(false);
                    }}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {notif.link ? (
                        <Link
                          href={notif.link}
                          className="block"
                          onClick={() => setOpen(false)}
                        >
                          <p
                            className={`text-sm ${!notif.read ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                          >
                            {notif.title}
                          </p>
                        </Link>
                      ) : (
                        <p
                          className={`text-sm ${!notif.read ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                        >
                          {notif.title}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                        {formatTime(notif.date)}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-neutral-800 text-center">
              <button className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
