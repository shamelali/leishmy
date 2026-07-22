"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, ArrowLeft, Download, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";

function pct(num: number, denom: number): string {
  if (denom <= 0) return num > 0 ? "+100%" : "0%";
  const v = Math.round(((num - denom) / denom) * 100);
  return v >= 0 ? `+${v}%` : `${v}%`;
}

export default function AdminReports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailView, setDetailView] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin?action=overview")
      .then((r) => r.json())
      .then((json) => { if (json?.totalUsers !== undefined) setData(json); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchDetail = async (type: string) => {
    if (detailView === type) { setDetailView(null); return; }
    setDetailView(type);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetch(`/api/admin?action=${type}&page=1&pageSize=100`);
      if (res.ok) setDetailData(await res.json());
    } catch (e) { console.error(e); }
    setDetailLoading(false);
  };

  if (loading) {
    return <DashboardLoading fullPage />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-500">No data available.</p>
      </div>
    );
  }

  const growthItems = [
    { label: "New Users", value: `+${data.newUsersThisMonth}`, change: pct(data.newUsersThisMonth, data.newUsersLastMonth), color: "text-blue-500", type: "users" },
    { label: "New Artists", value: `+${data.newArtistsThisMonth}`, change: pct(data.newArtistsThisMonth, data.newArtistsLastMonth), color: "text-violet-500", type: "artists" },
    { label: "New Bookings", value: `+${data.newBookingsThisMonth}`, change: pct(data.newBookingsThisMonth, data.newBookingsLastMonth), color: "text-green-500", type: "bookings" },
  ];

  const commission = Math.round(data.revenueThisMonth * data.commissionRate);

  const revenueItems = [
    { label: "This Month", value: `MYR ${data.revenueThisMonth?.toLocaleString() || 0}` },
    { label: "Last Month", value: `MYR ${data.revenueLastMonth?.toLocaleString() || 0}` },
    { label: "Commission Earned", value: `MYR ${commission.toLocaleString()}` },
    { label: "Pending Payouts", value: `MYR ${data.pendingPayouts?.toLocaleString() || 0}` },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" /> Export All
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Platform Growth</h3>
            <div className="space-y-3">
              {growthItems.map(({ label, value, change, color, type }) => (
                <button key={label} onClick={() => fetchDetail(type)} className="w-full flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-left">
                  <span className="text-sm text-gray-500">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${color}`}>{value}</span>
                    <span className="text-[10px] text-green-500 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />{change}</span>
                    <Eye className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Revenue Summary</h3>
            <div className="space-y-3">
              {revenueItems.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => fetchDetail("payments")} className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">
              <Eye className="w-3.5 h-3.5" /> View All Payments
            </button>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Totals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Total Users", value: String(data.totalUsers), color: "text-blue-500", bg: "bg-blue-50", type: "users" },
              { icon: BarChart3, label: "Total Artists", value: String(data.totalArtists), color: "text-violet-500", bg: "bg-violet-50", type: "artists" },
              { icon: Calendar, label: "Total Bookings", value: String(data.totalBookings), color: "text-green-500", bg: "bg-green-50", type: "bookings" },
              { icon: DollarSign, label: "Total Revenue", value: `MYR ${data.totalRevenue?.toLocaleString() || 0}`, color: "text-amber-500", bg: "bg-amber-50", type: "payments" },
            ].map(({ icon: Icon, label, value, color, bg, type }) => (
              <button key={label} onClick={() => fetchDetail(type)} className={`p-4 ${bg} dark:bg-neutral-800 rounded-xl text-left hover:scale-[1.02] active:scale-[0.98] transition-transform`}>
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
              </button>
            ))}
          </div>
        </div>

        {detailView && (
          <div className="mt-6 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {detailView === "payments" ? "All Payments" : `All ${detailView}`}
              </h2>
              <button onClick={() => setDetailView(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
            {detailLoading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : !detailData ? (
              <div className="p-8 text-center text-gray-400">No data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-neutral-800">
                    <tr>
                      {detailView === "users" && (
                        <>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Email</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Role</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Joined</th>
                        </>
                      )}
                      {detailView === "artists" && (
                        <>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Email</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Location</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Rating</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Verified</th>
                        </>
                      )}
                      {detailView === "bookings" && (
                        <>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Customer</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Artist</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                          <th className="text-right p-3 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                        </>
                      )}
                      {detailView === "payments" && (
                        <>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Method</th>
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                    {detailView === "users" && detailData.users?.map((u: any) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{u.name || "—"}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-rose-50 text-rose-600" : u.role === "artist" ? "bg-violet-50 text-violet-600" : u.role === "studio" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                        </td>
                        <td className="p-3 text-gray-400 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                    {detailView === "artists" && detailData.artists?.map((a: any) => (
                      <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{a.name || "—"}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{a.email}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{a.location || "—"}</td>
                        <td className="p-3 text-amber-500">{a.rating || "0"}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${a.verified ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                            {a.verified ? "Verified" : "Unverified"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {detailView === "bookings" && detailData.bookings?.map((b: any) => (
                      <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{b.userName || "—"}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{b.artistName || "—"}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{b.date}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${b.status === "confirmed" ? "bg-green-50 text-green-600" : b.status === "pending" ? "bg-amber-50 text-amber-600" : b.status === "completed" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"}`}>{b.status}</span>
                        </td>
                        <td className="p-3 text-right font-medium text-gray-900 dark:text-white">MYR {b.totalAmount}</td>
                      </tr>
                    ))}
                    {detailView === "payments" && detailData.payments?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                        <td className="p-3 font-mono text-xs text-gray-500">{(p.id || "").slice(0, 8)}</td>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{p.userName || "—"}</td>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">MYR {p.amount}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${p.status === "paid" || p.status === "released" ? "bg-green-50 text-green-600" : p.status === "held" ? "bg-blue-50 text-blue-600" : p.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-600"}`}>{p.status}</span>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300 capitalize">{p.paymentMethod || "—"}</td>
                        <td className="p-3 text-xs text-gray-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 mt-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Download Reports</h2>
          <div className="space-y-2">
            {["User Report", "Artist Report", "Booking Report", "Payment Report", "Revenue Report"].map((r) => (
              <div key={r} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500 text-white hover:bg-rose-600">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
