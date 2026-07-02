"use client";

import Link from "next/link";
import { Package, Plus, ArrowLeft, Edit2, Trash2 } from "lucide-react";

const inventory = [
  { id: 1, name: "Foundation - Various Shades", qty: 12, category: "Makeup" },
  { id: 2, name: "Brushes Set (Professional)", qty: 8, category: "Tools" },
  { id: 3, name: "Setting Spray", qty: 5, category: "Makeup" },
  { id: 4, name: "Disposable Applicators", qty: 50, category: "Supplies" },
];

export default function StudioInventory() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/studio" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Item</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 rounded-full">{item.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${item.qty <= 5 ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>{item.qty}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-400"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
