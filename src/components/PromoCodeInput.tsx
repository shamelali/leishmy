"use client";

import { useState } from "react";
import { Tag, Check, X, Percent } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface PromoCodeProps {
  onApply: (code: string, discount: number) => void;
  price: number;
}

const VALID_CODES: Record<
  string,
  { discount: number; label: string; type: "percent" | "fixed" }
> = {
  LEISH10: {
    discount: 10,
    label: "10% off your first booking",
    type: "percent",
  },
  WELCOME50: { discount: 50, label: "RM 50 off", type: "fixed" },
  BEAUTY20: { discount: 20, label: "20% off all bookings", type: "percent" },
  NEWYEAR: { discount: 15, label: "15% New Year discount", type: "percent" },
  FIRSTBOOK: { discount: 30, label: "RM 30 off first booking", type: "fixed" },
};

export default function PromoCodeInput({ onApply, price }: PromoCodeProps) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState("");
  const toast = useToast();

  const handleApply = () => {
    const upper = code.trim().toUpperCase();
    if (!upper) return;

    const promo = VALID_CODES[upper];
    if (promo) {
      const discountAmount =
        promo.type === "percent"
          ? Math.round((price * promo.discount) / 100)
          : promo.discount;
      setApplied(upper);
      setDiscount(discountAmount);
      setError("");
      onApply(upper, discountAmount);
      toast.success(`Promo applied! You save RM ${discountAmount}`);
    } else {
      setError("Invalid promo code");
      toast.error("Invalid promo code. Try LEISH10 or WELCOME50!");
    }
  };

  const handleRemove = () => {
    setApplied(null);
    setDiscount(0);
    setCode("");
    onApply("", 0);
    toast.info("Promo code removed");
  };

  if (applied) {
    const promo = VALID_CODES[applied];
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              {applied}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500">
              {promo?.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-green-700 dark:text-green-400">
            -RM {discount}
          </span>
          <button
            onClick={handleRemove}
            className="p-1 text-green-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-rose-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Have a promo code?
        </span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder="Enter promo code"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all uppercase"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!code.trim()}
          className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors border border-rose-200 dark:border-rose-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] text-gray-400">Try:</span>
        {Object.keys(VALID_CODES)
          .slice(0, 3)
          .map((c) => (
            <button
              key={c}
              onClick={() => {
                setCode(c);
                setError("");
              }}
              className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
            >
              {c}
            </button>
          ))}
      </div>
    </div>
  );
}

export { VALID_CODES };
