"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, User, Calendar, LogOut, Sparkles, LayoutDashboard, Heart, ImageIcon, Award, Droplets } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import SearchModal from "./SearchModal";
import NotificationsDropdown from "./NotificationsDropdown";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/artists", label: "Artists" },
  { href: "/studios", label: "Studios" },
  { href: "/community/apply", label: "Community" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
          >
            <Image src="/leishlogo.png" alt="Leish!" width={40} height={40} className="h-10 w-auto group-hover:scale-105 transition-transform" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/community/apply"
              className="text-sm font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-4 py-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
            >
              Join as Artist
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <SearchModal />
            <ThemeToggle />
            {user && <NotificationsDropdown />}

            {user ? (
              /* User Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-rose-50 dark:bg-neutral-800 border border-rose-200/60 dark:border-neutral-700 hover:border-rose-400 transition-colors"
                >
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name || "User"}
                      width={24}
                      height={24}
                      unoptimized
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                      {(user.name || "U").charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 max-w-[100px] truncate">
                    {(user.name || "User").split(" ")[0]}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-2xl p-2 animate-scale-in origin-top-right">
                    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-neutral-800 mb-1">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                      <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-rose-500" /> My Profile
                    </Link>

                    <Link
                      href="/bookings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 text-rose-500" /> My Bookings
                    </Link>

                    <Link
                      href="/favorites"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500" /> Favorites
                    </Link>

                    <Link
                      href="/beauty-profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      <Droplets className="w-3.5 h-3.5 text-rose-500" /> Beauty Profile
                    </Link>

                    <Link
                      href="/inspiration"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-rose-500" /> Inspiration
                    </Link>

                    <Link
                      href="/rewards"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      <Award className="w-3.5 h-3.5 text-rose-500" /> Rewards
                    </Link>

                    {(user.role === "artist" || user.role === "studio") && (
                      <Link
                        href={user.role === "artist" ? "/dashboard/artist" : "/dashboard/studio"}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-rose-500" /> Dashboard
                      </Link>
                    )}

                    <div className="border-t border-gray-100 dark:border-neutral-800 my-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Auth Buttons when not signed in */
              <div className="hidden sm:flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-xl hover:bg-gray-100/60 dark:hover:bg-neutral-800/60"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 hover:scale-105 active:scale-100 text-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Sign Up Free
                </Link>
              </div>
            )}

            {/* Mobile menu btn */}
            <button
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-neutral-800"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-gray-200/50 dark:border-neutral-700/50 animate-fade-in">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <div className="border-t border-gray-200 dark:border-neutral-800 pt-3 mt-2 flex flex-col gap-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.name || "User"} width={32} height={32} unoptimized className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                      {(user.name || "U").charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name || "User"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-rose-500" /> My Profile
                </Link>
                <Link
                  href="/bookings"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-rose-500" /> My Bookings
                </Link>
                <Link
                  href="/favorites"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                  <Heart className="w-4 h-4 text-rose-500" /> Favorites
                </Link>
                <Link
                  href="/beauty-profile"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                  <Droplets className="w-4 h-4 text-rose-500" /> Beauty Profile
                </Link>
                <Link
                  href="/inspiration"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4 text-rose-500" /> Inspiration
                </Link>
                <Link
                  href="/rewards"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-rose-500" /> Rewards
                </Link>
                {(user.role === "artist" || user.role === "studio") && (
                  <Link
                    href={user.role === "artist" ? "/dashboard/artist" : "/dashboard/studio"}
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-rose-500" /> Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 text-left"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-200 dark:border-neutral-800 pt-3 mt-2 grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center py-3 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-semibold rounded-xl text-sm"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl text-sm"
                >
                  <Sparkles className="w-4 h-4" /> Sign Up Free
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
