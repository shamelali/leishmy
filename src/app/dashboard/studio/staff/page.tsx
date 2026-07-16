"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, ArrowLeft, BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardLoading } from "@/components/DashboardLoading";
import { useAuth } from "@/context/AuthContext";

export default function StudioStaff() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const profileRes = await fetch(`/api/user/studio-profile`);
        const profile = await profileRes.json();
        if (!profile?.studio?.id) return;
        const res = await fetch(`/api/user/studio-staff?studioId=${profile.studio.id}`);
        const data = await res.json();
        if (data?.staff) setStaff(data.staff);
      } catch { console.error("Failed to load staff"); }
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/studio" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('backToDashboard')}
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('staff.title')}</h1>
        </div>

        {loading ? (
          <DashboardLoading />
        ) : staff.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">{t('staff.noStaff')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map((s: any) => (
              <div key={s.id} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/30"><Users className="w-5 h-5 text-violet-500" /></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                      {s.name} {s.verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                    </p>
                    <p className="text-xs text-gray-400">{s.location || t('staff.noLocation')}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                      {s.email && <span>{s.email}</span>}
                      {s.phone && <span>{s.phone}</span>}
                      {s.rating !== "0" && <span>★ {s.rating}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
