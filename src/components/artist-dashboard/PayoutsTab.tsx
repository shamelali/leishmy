"use client";

import { useState } from "react";
import {
  Wallet,
  Clock,
  Banknote,
  Plus,
  Loader2,
} from "lucide-react";

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

interface PayoutsTabProps {
  payouts: Payout[];
  bankAccounts: BankAccount[];
  pendingBalance: number;
  userId: string;
  onRefresh: () => void;
}

export default function PayoutsTab({
  payouts,
  bankAccounts,
  pendingBalance,
  userId,
  onRefresh,
}: PayoutsTabProps) {
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName: "", bankCode: "", accountNumber: "", accountHolder: "" });
  const [saving, setSaving] = useState(false);

  const totalEarned = payouts
    .filter((p) => p.status === "released")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  async function handleRegisterBank(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/payments?action=register-bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...bankForm }),
    });
    setBankForm({ bankName: "", bankCode: "", accountNumber: "", accountHolder: "" });
    setShowBankForm(false);
    setSaving(false);
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payouts</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track your earnings and manage payouts
        </p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            MYR {pendingBalance.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-2xl border border-green-100 dark:border-green-900/50">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Paid Out</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            MYR {totalEarned.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Bank Account</span>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {bankAccounts.length > 0 && bankAccounts[0].bankName
              ? `${bankAccounts[0].bankName} •••• ${bankAccounts[0].accountNumber.slice(-4)}`
              : "Not registered"}
          </p>
        </div>
      </div>

      {/* Bank account */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Bank Account</h2>
          {bankAccounts.length === 0 && (
            <button
              onClick={() => setShowBankForm(!showBankForm)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Register
            </button>
          )}
        </div>

        {bankAccounts.length > 0 ? (
          <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{bankAccounts[0].bankName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {bankAccounts[0].accountHolder} •••• {bankAccounts[0].accountNumber.slice(-4)}
            </p>
          </div>
        ) : showBankForm ? (
          <form onSubmit={handleRegisterBank} className="space-y-3">
            <input
              placeholder="Bank Name (e.g. Maybank, CIMB)"
              value={bankForm.bankName}
              onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              required
            />
            <input
              placeholder="Bank Code / SWIFT (e.g. MBBEMYKL, CIBBMYKL) — optional"
              value={bankForm.bankCode}
              onChange={(e) => setBankForm({ ...bankForm, bankCode: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
            />
            <input
              placeholder="Account Number"
              value={bankForm.accountNumber}
              onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              required
            />
            <input
              placeholder="Account Holder Name"
              value={bankForm.accountHolder}
              onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowBankForm(false)}
                className="px-4 py-2.5 border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            Register a bank account to receive payouts
          </p>
        )}
      </div>

      {/* Payout history */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Payout History</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No payouts yet</p>
        ) : (
          <div className="space-y-2">
            {payouts.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    MYR {Number(p.amount).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === "released"
                      ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                      : p.status === "pending"
                        ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                        : "bg-gray-100 text-gray-600 dark:bg-neutral-700"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
