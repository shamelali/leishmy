"use client";

import { useState, useEffect } from "react";
import { Save, Clock, Calendar, Zap, ArrowLeft } from "lucide-react";

interface PricingRules {
  weekendSurcharge?: number;
  holidaySurcharge?: number;
  lastMinuteSurcharge?: number;
  earlyBirdDiscount?: number;
  peakMonths?: number[];
}

export default function PricingRulesTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [defaultDepositPercent, setDefaultDepositPercent] = useState(30);
  const [rules, setRules] = useState<PricingRules>({});

  useEffect(() => {
    fetch("/api/user/pricing-rules")
      .then((r) => r.json())
      .then((data) => {
        if (data?.profile) {
          setDefaultDepositPercent(data.profile.defaultDepositPercent ?? 30);
          setRules(data.profile.pricingRules ?? {});
        }
      })
      .catch(() => setError("Failed to load pricing rules"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/user/pricing-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultDepositPercent,
          pricingRules: rules,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Pricing rules saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save pricing rules");
    } finally {
      setSaving(false);
    }
  };

  const handleRuleChange = (key: keyof PricingRules, value: number | number[] | undefined) => {
    setRules((prev) => ({ ...prev, [key]: value }));
  };

  const MONTHS = [
    { num: 0, label: "Jan" },
    { num: 1, label: "Feb" },
    { num: 2, label: "Mar" },
    { num: 3, label: "Apr" },
    { num: 4, label: "May" },
    { num: 5, label: "Jun" },
    { num: 6, label: "Jul" },
    { num: 7, label: "Aug" },
    { num: 8, label: "Sep" },
    { num: 9, label: "Oct" },
    { num: 10, label: "Nov" },
    { num: 11, label: "Dec" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Default Deposit */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Default Deposit Percentage</h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="10"
            max="100"
            value={defaultDepositPercent}
            onChange={(e) => setDefaultDepositPercent(Number(e.target.value))}
            className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-center"
          />
          <span className="text-sm text-gray-500">% of total price</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Customers will be asked to pay this percentage as a deposit when booking.</p>
      </div>

      {/* Weekend Surcharge */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Weekend Surcharge
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={rules.weekendSurcharge ?? ""}
            onChange={(e) => handleRuleChange("weekendSurcharge", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
            className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-center"
          />
          <span className="text-sm text-gray-500">% surcharge on Fri/Sat/Sun bookings</span>
        </div>
      </div>

      {/* Holiday Surcharge */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Holiday / Peak Season Surcharge
        </h3>
        <div className="flex items-center gap-3 mb-2">
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={rules.holidaySurcharge ?? ""}
            onChange={(e) => handleRuleChange("holidaySurcharge", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
            className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-center"
          />
          <span className="text-sm text-gray-500">% surcharge on peak months</span>
        </div>
        <p className="text-xs text-gray-400 mb-2">Select months to apply this surcharge:</p>
        <div className="flex flex-wrap gap-2">
          {MONTHS.map((m) => {
            const current = rules.peakMonths ?? [];
            const isSelected = current.includes(m.num);
            return (
              <label
                key={m.num}
                className={`px-2 py-1 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
                  isSelected
                    ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                    : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    if (isSelected) {
                      handleRuleChange("peakMonths", current.filter((n) => n !== m.num));
                    } else {
                      handleRuleChange("peakMonths", [...current, m.num]);
                    }
                  }}
                  className="hidden"
                />
                {m.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* Last Minute Surcharge */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Last-Minute Booking Surcharge
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={rules.lastMinuteSurcharge ?? ""}
            onChange={(e) => handleRuleChange("lastMinuteSurcharge", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
            className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-center"
          />
          <span className="text-sm text-gray-500">% surcharge for bookings within 7 days</span>
        </div>
      </div>

      {/* Early Bird Discount */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Early Bird Discount
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="50"
            step="0.01"
            value={rules.earlyBirdDiscount ?? ""}
            onChange={(e) => handleRuleChange("earlyBirdDiscount", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
            className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-center"
          />
          <span className="text-sm text-gray-500">% discount for bookings made 30+ days in advance</span>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 disabled:opacity-50"
      >
        <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Pricing Rules"}
      </button>
    </div>
  );
}