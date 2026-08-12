"use client";

import { useState, useEffect, useMemo } from "react";
import { X, DollarSign, Package, Tag, Plus, Trash2, Loader2, ChevronDown } from "lucide-react";

interface ServicePackage {
  id: string;
  name: string;
  description?: string;
  price: number;
  includes: string[];
  duration?: string;
  popular: boolean;
}

interface ExtraItem {
  name: string;
  price: number;
}

interface QuoteModalProps {
  bookingId: string;
  serviceName: string;
  clientName: string;
  serviceId?: number;
  bookingDate?: string;
  defaultDepositPercent?: number;
  pricingRules?: {
    weekendSurcharge?: number;
    holidaySurcharge?: number;
    lastMinuteSurcharge?: number;
    earlyBirdDiscount?: number;
    peakMonths?: number[];
  };
  onClose: () => void;
  onSuccess: () => void;
  initialLocation?: string;  // From booking, displayed read-only
  initialPlaceId?: string;   // From Google Places, stored for reference
}

const DISCOUNT_REASONS = [
  "Returning customer",
  "Referral discount",
  "Promotional offer",
  "Bulk booking",
  "Loyalty reward",
  "Custom",
];

export function QuoteModal({
  bookingId,
  serviceName,
  clientName,
  serviceId,
  bookingDate,
  defaultDepositPercent = 30,
  pricingRules,
  onClose,
  onSuccess,
}: QuoteModalProps) {
  const [servicePrice, setServicePrice] = useState("");
  const [accommodationFee, setAccommodationFee] = useState("");
  const [travelFee, setTravelFee] = useState("");
  const [travelSurcharge, setTravelSurcharge] = useState("");  // NEW: artist-editable, 0-50% max
  const [initialLocation, setInitialLocation] = useState("");  // NEW: from booking, read-only
  const [initialPlaceId, setInitialPlaceId] = useState("");   // NEW: Google Places reference
  const [discount, setDiscount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [extras, setExtras] = useState<ExtraItem[]>([]);
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [depositPercent, setDepositPercent] = useState(String(defaultDepositPercent));
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [packagesLoaded, setPackagesLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch packages for this service
  useEffect(() => {
    if (!serviceId) return;
    fetch(`/api/services/packages?serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((data) => setPackages(data.packages || []))
      .catch(() => {})
      .finally(() => setPackagesLoaded(true));
  }, [serviceId]);

  // Apply pricing rules
  const pricingAdjustments = useMemo(() => {
    if (!bookingDate || !pricingRules) return [];

    const bookingDateObj = new Date(bookingDate);
    const today = new Date();
    const daysUntil = Math.ceil((bookingDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dayOfWeek = bookingDateObj.getDay();
    const month = bookingDateObj.getMonth();

    const adjustments: Array<{ name: string; percent: number }> = [];

    if ([5, 6, 0].includes(dayOfWeek) && pricingRules.weekendSurcharge) {
      adjustments.push({ name: "Weekend surcharge", percent: pricingRules.weekendSurcharge });
    }
    if (pricingRules.peakMonths?.includes(month) && pricingRules.holidaySurcharge) {
      adjustments.push({ name: "Peak season", percent: pricingRules.holidaySurcharge });
    }
    if (daysUntil < 7 && pricingRules.lastMinuteSurcharge) {
      adjustments.push({ name: "Last-minute booking", percent: pricingRules.lastMinuteSurcharge });
    }
    if (daysUntil > 30 && pricingRules.earlyBirdDiscount) {
      adjustments.push({ name: "Early bird discount", percent: -pricingRules.earlyBirdDiscount });
    }

    if (adjustments.length > 0) {
      const highest = adjustments.reduce((max, a) =>
        Math.abs(a.percent) > Math.abs(max.percent) ? a : max
      );
      const priceNum = parseFloat(servicePrice) || 0;
      return [{ ...highest, amount: priceNum * (highest.percent / 100) }];
    }
    return [];
  }, [bookingDate, servicePrice, pricingRules]);

  // Handle package selection
  const handlePackageSelect = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    const pkg = packages.find((p) => p.id === pkgId);
    if (pkg) {
      setServicePrice(String(pkg.price));
    }
  };

  // Handle adding extra
  const handleAddExtra = () => {
    if (!newExtraName.trim() || !newExtraPrice) return;
    setExtras([...extras, { name: newExtraName.trim(), price: Number(newExtraPrice) }]);
    setNewExtraName("");
    setNewExtraPrice("");
  };

  // Handle removing extra
  const handleRemoveExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  // Calculate totals
  const servicePriceNum = parseFloat(servicePrice) || 0;
  const accommodationFeeNum = parseFloat(accommodationFee) || 0;
  const travelFeeNum = parseFloat(travelFee) || 0;
  const travelSurchargeNum = parseFloat(travelSurcharge) || 0;  // NEW
  const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
  const adjustmentsTotal = pricingAdjustments.reduce((sum, a) => sum + a.amount, 0);
  const subtotal = servicePriceNum + accommodationFeeNum + travelFeeNum + travelSurchargeNum + extrasTotal + adjustmentsTotal;  // INCLUDE travelSurcharge
  const discountAmount = Math.min(parseFloat(discount) || 0, subtotal * 0.5); // Max 50%
  const total = Math.max(0, subtotal - discountAmount);
  const depositPercentNum = Math.min(100, Math.max(10, parseFloat(depositPercent) || 30));
  const deposit = Math.round(total * (depositPercentNum / 100) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicePriceNum || servicePriceNum <= 0) {
      setError("Service price is required and must be greater than 0");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}/quote`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: Number(bookingId),
          servicePrice: servicePriceNum,
          accommodationFee: accommodationFeeNum,
          travelFee: travelFeeNum,
          travelSurcharge: travelSurchargeNum,  // NEW
          discount: discountAmount,
          discountReason: discountReason || undefined,
          extras: extras.length > 0 ? extras : undefined,
          packageId: selectedPackageId ? Number(selectedPackageId) : undefined,
          depositPercent: depositPercentNum,
          notes: notes || undefined,
          location: initialLocation || undefined,  // NEW: from booking, read-only
          placeId: initialPlaceId || undefined,   // NEW: Google Places reference
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send quote");

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send quote");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Send Quote</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {clientName} &middot; {serviceName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Package Selection */}
          {packages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Package className="w-4 h-4 inline mr-1" />
                Select Package (optional)
              </label>
              {!packagesLoaded ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading packages...
                </div>
              ) : (
                <div className="space-y-2">
                  {packages.map((pkg) => (
                    <label
                      key={pkg.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedPackageId === pkg.id
                          ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30"
                          : "border-gray-200 dark:border-neutral-700 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="package"
                        value={pkg.id}
                        checked={selectedPackageId === pkg.id}
                        onChange={() => handlePackageSelect(pkg.id)}
                        className="w-4 h-4 text-rose-500 border-gray-300 focus:ring-rose-500 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{pkg.name}</span>
                          {pkg.popular && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full">
                              Popular
                            </span>
                          )}
                          <span className="font-bold text-gray-900 dark:text-white text-sm ml-auto">RM {pkg.price}</span>
                        </div>
                        {pkg.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pkg.description}</p>
                        )}
                        {pkg.includes && pkg.includes.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {pkg.includes.map((item, i) => (
                              <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-rose-500" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Service Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Service Price (MYR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Travel Fee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Travel Fee (MYR)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={travelFee}
                onChange={(e) => setTravelFee(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Accommodation Fee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Accommodation Fee (MYR)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={accommodationFee}
                onChange={(e) => setAccommodationFee(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Extras */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Additional Services (Extras)
            </label>
            <div className="space-y-2">
              {extras.map((extra, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                  <span className="flex-1 text-sm text-gray-900 dark:text-white">{extra.name}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">RM {extra.price}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExtra(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExtraName}
                  onChange={(e) => setNewExtraName(e.target.value)}
                  placeholder="Extra name"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                />
                <div className="relative w-24">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newExtraPrice}
                    onChange={(e) => setNewExtraPrice(e.target.value)}
                    placeholder="0"
                    className="w-full pl-6 pr-2 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddExtra}
                  disabled={!newExtraName.trim() || !newExtraPrice}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Discount */}
          <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Discount (Max 50%)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max={subtotal * 0.5}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                />
              </div>
              <select
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white"
              >
                <option value="">Reason (optional)</option>
                {DISCOUNT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deposit Percent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Deposit Percentage (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                max="100"
                value={depositPercent}
                onChange={(e) => setDepositPercent(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Any additional details for the customer..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Pricing Adjustments Display */}
          {pricingAdjustments.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Pricing Adjustments</p>
              {pricingAdjustments.map((adj, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-blue-600 dark:text-blue-400">{adj.name} ({adj.percent > 0 ? '+' : ''}{adj.percent}%)</span>
                  <span className={adj.amount >= 0 ? "text-red-500" : "text-green-500"}>
                    {adj.amount >= 0 ? '+' : ''}MYR {adj.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Total Summary */}
          {total > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-4 border border-rose-200 dark:border-rose-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Service Price</span>
                <span className="text-gray-900 dark:text-white">MYR {servicePriceNum.toFixed(2)}</span>
              </div>
              {travelFeeNum > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Travel Fee</span>
                  <span className="text-gray-900 dark:text-white">+ MYR {travelFeeNum.toFixed(2)}</span>
                </div>
              )}
              {accommodationFeeNum > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Accommodation</span>
                  <span className="text-gray-900 dark:text-white">+ MYR {accommodationFeeNum.toFixed(2)}</span>
                </div>
              )}
              {extrasTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Extras</span>
                  <span className="text-gray-900 dark:text-white">+ MYR {extrasTotal.toFixed(2)}</span>
                </div>
              )}
              {pricingAdjustments.length > 0 && adjustmentsTotal !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{pricingAdjustments[0].name}</span>
                  <span className={adjustmentsTotal >= 0 ? "text-red-500" : "text-green-500"}>
                    {adjustmentsTotal >= 0 ? '+' : ''}MYR {adjustmentsTotal.toFixed(2)}
                  </span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 dark:text-green-400">
                    Discount {discountReason && `(${discountReason})`}
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">- MYR {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-rose-200 dark:border-rose-800">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-rose-600 dark:text-rose-400">MYR {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{depositPercentNum}% Deposit</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">MYR {deposit.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || servicePriceNum <= 0}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                "Send Quote"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
