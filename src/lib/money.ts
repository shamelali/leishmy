/**
 * Integer-cent money helpers.
 *
 * Booking columns store MYR decimals (numeric/decimal). Payments store
 * integer sen. All arithmetic happens in cents to avoid IEEE-754 drift
 * (e.g. 10.10 - 3.03).
 */

export function toCents(amount: number | string | null | undefined): number {
  if (amount == null || amount === "") return 0;
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromCents(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  return Math.round(cents) / 100;
}

export function myrString(cents: number): string {
  return fromCents(cents).toFixed(2);
}

export function clampDepositPercent(percent: number | null | undefined): number {
  const n = Number(percent);
  if (!Number.isFinite(n)) return 30;
  return Math.min(100, Math.max(10, Math.round(n)));
}

export function depositCentsFromTotal(totalCents: number, percent: number): number {
  return Math.round(totalCents * (clampDepositPercent(percent) / 100));
}

export function remainingCents(
  amountMyr: number | string | null | undefined,
  depositMyr: number | string | null | undefined,
): number {
  return Math.max(0, toCents(amountMyr) - toCents(depositMyr));
}

export function remainingMyr(
  amountMyr: number | string | null | undefined,
  depositMyr: number | string | null | undefined,
): number {
  return fromCents(remainingCents(amountMyr, depositMyr));
}
