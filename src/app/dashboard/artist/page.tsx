"use client";

import { useState, useEffect, useCallback } from "react";
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
	Clock,
	BarChart3,
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

type TabId =
	| "profile"
	| "portfolio"
	| "bookings"
	| "quotes"
	| "prices"
	| "packages"
	| "pricing"
	| "payouts"
	| "availability"
	| "analytics"
	| "account";

interface Payout {
	id: string;
	amount: number;
	status: string;
}

export default function DashboardArtist() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [bookings, setBookings] = useState<any[]>([]);
	const [activeTab, setActiveTab] = useState<TabId>("bookings");

	useEffect(() => {
		let cancelled = false;

		async function fetchData() {
			try {
				const [bookingsRes, profileRes] = await Promise.all([
					fetch("/api/bookings?type=artist"),
					fetch("/api/profile/artist"),
				]);

				if (!bookingsRes.ok || !profileRes.ok) {
					throw new Error("Failed to fetch dashboard data");
				}

				const bookingsData = await bookingsRes.json();
				const profileData = await profileRes.json();

				if (!cancelled) {
					setBookings(bookingsData?.data?.bookings ?? []);
				}
			} catch (err) {
				if (!cancelled) {
					console.error("Artist dashboard load error:", err);
					setError("Failed to load dashboard data");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		fetchData();

		return () => {
			cancelled = true;
		};
	}, []);

	const handleAcceptQuote = useCallback(async (quoteId: string) => {
		if (!user?.id) return;
		await fetch(`/api/quotes/${quoteId}/accept`, {
			method: "POST",
		});
	}, [user?.id]);

	const handleRejectQuote = useCallback(async (quoteId: string) => {
		if (!user?.id) return;
		await fetch(`/api/quotes/${quoteId}/reject`, {
			method: "POST",
		});
	}, [user?.id]);

	const handleConfirm = useCallback(async (bookingId: string) => {
		if (!user?.id) return;
		// Direct accept at fixed price
		await fetch(`/api/bookings/${bookingId}/accept`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ bookingId: Number(bookingId) }),
		});
		setBookings((prev) =>
			prev.map((b) => (b.id === bookingId ? { ...b, status: "pending" } : b)),
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

	const handleStartService = useCallback(async (bookingId: string) => {
		await fetch("/api/bookings", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: Number(bookingId), status: "active" }),
		});
		setBookings((prev) =>
			prev.map((b) => (b.id === bookingId ? { ...b, status: "active" } : b)),
		);
	}, []);

	const handleCompleteService = useCallback(async (bookingId: string) => {
		await fetch("/api/bookings", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: Number(bookingId), status: "completed" }),
		});
		setBookings((prev) =>
			prev.map((b) =>
				b.id === bookingId ? { ...b, status: "completed" } : b,
			),
		);
	}, []);

	const handleReleasePayment = useCallback(async (bookingId: string) => {
		await fetch("/api/bookings", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: Number(bookingId), status: "paid" }),
		});
		setBookings((prev) =>
			prev.map((b) => (b.id === bookingId ? { ...b, status: "paid" } : b)),
		);
	}, []);

	const handleUpdateService = useCallback(
		async (serviceId: string, data: Record<string, unknown>) => {
			const res = await fetch(`/api/services/${serviceId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			if (!res.ok) throw new Error("Failed to update service");
		},
		[],
	);

	const handleUpdatePrice = useCallback(
		async (priceId: string, data: Record<string, unknown>) => {
			const res = await fetch(`/api/services/prices/${priceId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			if (!res.ok) throw new Error("Failed to update price");
		},
		[],
	);

	const renderContent = () => {
		if (loading) {
			return (
				<div className="p-6 space-y-4">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-64 w-full" />
				</div>
			);
		}

		if (error) {
			return (
				<div className="p-6">
					<p className="text-red-400">{error}</p>
				</div>
			);
		}

		switch (activeTab) {
			case "profile":
				return (
					<ProfileTab
						profile={null}
						onUpdateProfile={async () => {}}
					/>
				);
			case "portfolio":
				return (
					<PortfolioTab
						portfolioItems={[]}
						onAdd={async () => {}}
						onUpdate={async () => {}}
						onDelete={async () => {}}
					/>
				);
			case "bookings":
				return (
					<BookingsTab
						bookings={bookings}
						loading={false}
						onConfirm={handleConfirm}
						onReject={handleReject}
						onStart={handleStartService}
						onComplete={handleCompleteService}
						onRelease={handleReleasePayment}
					/>
				);
			case "quotes":
				return (
					<QuotesTab
						items={[]}
						loading={false}
						onAccept={handleAcceptQuote}
						onReject={handleRejectQuote}
					/>
				);
			case "prices":
				return (
					<PricesTab
						prices={[]}
						loading={false}
						onUpdatePrice={handleUpdatePrice}
					/>
				);
			case "packages":
				return (
					<PackagesTab
						packages={[]}
						loading={false}
						onUpdatePackage={async () => {}}
					/>
				);
			case "pricing":
				return (
					<PricingRulesTab
						rules={[]}
						loading={false}
						onUpdateRule={async () => {}}
					/>
				);
			case "payouts":
				return <PayoutsTab payouts={[]} loading={false} />;
			case "availability":
				return (
					<AvailabilityTab
						availability={null}
						loading={false}
						onUpdateAvailability={async () => {}}
					/>
				);
			case "analytics":
				return (
					<AnalyticsTab
						artistId={user?.id}
						loading={false}
					/>
				);
			case "account":
				return <ChangePassword />;
			default:
				return null;
		}
	};

	return (
		<div className="min-h-screen bg-neutral-950">
			<DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
			<main className="lg:ml-64 p-6">{renderContent()}</main>
		</div>
	);
}
