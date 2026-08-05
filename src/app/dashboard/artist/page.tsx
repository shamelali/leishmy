"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User, Image, Calendar, Tag, Wallet, Package, Percent, FileText, Lock, Clock, BarChart3,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/context/AuthContext";
import type { ArtistProfileEditValues } from "@/components/ArtistProfileEditForm";
import {
  ProfileTab,
  PortfolioTab,
  BookingsTab,
  QuotesTab,
  PricesTab,
  PackagesTab,
  PricingRulesTab,
  PayoutsTab,
  AvailabilityTab,
  AnalyticsTab,
} from "@/components/artist-dashboard";
import ChangePassword from "@/components/ChangePassword";

type TabId = "profile" | "portfolio" | "bookings" | "quotes" | "prices" | "packages" | "pricing" | "payouts" | "availability" | "analytics" | "account";

interface Payout {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface Booking {
  id: string;
  artistId?: string;
  artistName?: string;
  client?: string;
  userName?: string;
  clientEmail?: string;
  clientPhone?: string;
  service?: string;
  date?: string;
  time?: string;
  price?: number;
  amount?: number;
  location?: string;
  status: string;
  createdAt?: string;
}

const defaultProfile: ArtistProfileEditValues = {
  name: "",
  email: "",
  phone: "",
  image: "",
  location: "",
  area: "",
  district: "",
  bio: "",
  experience: 0,
  languages: [],
  specialties: [],
  portfolio: [],
  responseTime: "",
  price: 0,
  showPrices: false,
  certifications: "",
  availability: "",
  availabilityNotes: "",
  socialProfiles: "",
};

export default function DashboardArtist() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [profile, setProfile] = useState<ArtistProfileEditValues>(defaultProfile);
  const [available, setAvailable] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [services, setServices] = useState<Service[]>([]);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [payoutRes, bookingsRes, profileRes] = await Promise.all([
        fetch(`/api/payments?action=payouts&userId=${user.id}`),
        fetch(`/api/user/bookings`),
        fetch(`/api/user/artist-profile`),
      ]);

      if (payoutRes.ok) {
        const payoutData = await payoutRes.json();
        setPayouts(payoutData.payouts || []);
        setBankAccounts(payoutData.bankAccounts || []);
        setPendingBalance(payoutData.pendingBalance || 0);
      }

      if (bookingsRes.ok) {
        const bookingData = await bookingsRes.json();
        setBookings(bookingData.bookings || []);
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const a = profileData.artist;
        if (a) {
          const social = [a.instagramUrl || "", a.tiktokUrl || ""]
            .filter(Boolean)
            .join("\n");

          setProfile({
            name: a.name || user.name || "",
            email: a.email || user.email || "",
            phone: a.phone || "",
            image: a.image || "",
            location: a.location || "",
            area: a.area || "",
            district: a.district || "",
            bio: a.bio || "",
            experience: a.experience || 0,
            languages: a.languages || [],
            specialties: a.specialties || [],
            portfolio: a.portfolio || [],
            responseTime: a.responseTime || "",
            price: a.price || 0,
            showPrices: a.showPrices || false,
            certifications: a.certifications || "",
            availability: a.availability || "",
            availabilityNotes: a.availability || "",
            socialProfiles: social,
          });
          setAvailable(a.available !== false);
          setServices(a.services || []);
        }
      }
    } catch {
      // silent
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleProfileUpdate = useCallback((field: string, value: unknown) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleConfirm = useCallback(async (bookingId: string) => {
    if (!user?.id) return;
    await fetch("/api/user/confirm-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, userId: user.id }),
    });
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "confirmed" } : b)),
    );
  }, [user?.id]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleReject = useCallback(async (bookingId: string) => {
    if (!user?.id) return;
    await fetch("/api/user/reject-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, userId: user.id }),
    });
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b)),
    );
  }, [user?.id]);

  const pendingBookings = bookings.filter(
    (b) => b.status === "pending" || b.status === "quote_pending",
  ).length;

  const pendingQuotes = bookings.filter(
    (b) => b.status === "quote_pending",
  ).length;

  const artistItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "portfolio", label: "Portfolio", icon: Image },
    { id: "bookings", label: "Bookings", icon: Calendar, badge: pendingBookings },
    { id: "quotes", label: "Quotes", icon: FileText, badge: pendingQuotes },
    { id: "prices", label: "Prices", icon: Tag },
    { id: "packages", label: "Packages", icon: Package },
    { id: "pricing", label: "Pricing Rules", icon: Percent },
    { id: "payouts", label: "Payouts", icon: Wallet },
    { id: "availability", label: "Availability", icon: Clock },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "account", label: "Account", icon: Lock },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <DashboardSidebar
        items={artistItems}
        activeId={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      >
        {activeTab === "profile" && (
          <ProfileTab
            profile={profile}
            available={available}
            onUpdate={handleProfileUpdate}
            userId={user?.id || ""}
          />
        )}

        {activeTab === "portfolio" && (
          <PortfolioTab
            portfolio={profile.portfolio}
            userId={user?.id || ""}
            onUpdate={(portfolio) => setProfile((prev) => ({ ...prev, portfolio }))}
          />
        )}

        {activeTab === "bookings" && (
          <BookingsTab
            bookings={bookings}
            onConfirm={handleConfirm}
            onReject={handleReject}
          />
        )}

        {activeTab === "quotes" && <QuotesTab />}

        {activeTab === "prices" && (
          <PricesTab
            services={services}
            showPrices={profile.showPrices}
            userId={user?.id || ""}
            onUpdate={setServices}
            onToggleShowPrices={(show) => setProfile((prev) => ({ ...prev, showPrices: show }))}
          />
        )}

        {activeTab === "packages" && (
          <PackagesTab
            artistId={user?.id || ""}
            services={services}
          />
        )}

        {activeTab === "pricing" && <PricingRulesTab />}

        {activeTab === "payouts" && (
          <PayoutsTab
            payouts={payouts}
            bankAccounts={bankAccounts}
            pendingBalance={pendingBalance}
            userId={user?.id || ""}
            onRefresh={fetchData}
          />
        )}

        {activeTab === "availability" && <AvailabilityTab />}

        {activeTab === "analytics" && <AnalyticsTab />}

        {activeTab === "account" && (
          <div className="space-y-6">
            <ChangePassword />
          </div>
        )}
      </DashboardSidebar>
    </div>
  );
}
