import "server-only";
import crypto from "crypto";
import { prefixedEnvReader } from "@/lib/env-prefix";
import { bankCodeForName } from "@/lib/malaysian-banks";

const billplz = prefixedEnvReader("BILLPLZ_");

function v5BaseUrl(): string {
  const url = billplz.get("API_URL") || "https://www.billplz.com/api/v3";
  return url.replace(/\/api\/v\d+\/?$/, "/api/v5");
}

function billplzAuth(): Record<string, string> {
  return {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${Buffer.from(billplz.require("API_KEY") + ":").toString("base64")}`,
  };
}

function makeChecksum(values: string[]): string {
  return crypto
    .createHmac("sha512", billplz.require("SIGNATURE_KEY"))
    .update(values.join(""))
    .digest("hex");
}

export interface CreatePayoutOrderInput {
  referenceId: string;
  bankCode: string;
  bankAccountNumber: string;
  accountName: string;
  description?: string;
  total: number;
  email?: string;
}

export interface PayoutOrderResult {
  id: string;
  status: string;
  total: string;
  referenceId: string | null;
}

const SWIFT_BY_NAME: Record<string, string> = {
  "malayan banking": "MBBEMYKL",
  "cimb bank": "CIBBMYKL",
  "public bank": "PBBEMYKL",
  pbb: "PBBEMYKL",
  "am bank": "ARBKMYKL",
  "standard chartered": "SCBLMYKX",
};

/**
 * Returns the V5 `bank_code` for an artist/studio. Prefers an explicit
 * `bank_code` value; if only free-text `bankName` is known, falls back to
 * the name lookup so existing profiles keep working.
 */
export function resolveBankCode(
  bankCode: string | null | undefined,
  bankName: string | null | undefined,
): string | null {
  if (bankCode) {
    const normalized = bankCode.trim().toUpperCase();
    if (normalized && SWIFT_BY_NAME[normalized.toLowerCase()]) {
      return SWIFT_BY_NAME[normalized.toLowerCase()];
    }
    if (normalized && /^[A-Z0-9]{8,11}$/.test(normalized)) {
      return normalized;
    }
  }
  if (bankName) {
    const resolved = bankCodeForName(bankName);
    if (resolved) return resolved;
    const name = bankName.trim().toLowerCase();
    for (const [key, code] of Object.entries(SWIFT_BY_NAME)) {
      if (name.includes(key)) return code;
    }
  }
  return null;
}

/**
 * Create a real Billplz V5 Payment Order (money disbursement to a
 * Malaysian bank account). Returns the Billplz order id + lifecycle status.
 *
 * Uses `reference_id` = our payout id, which Billplz deduplicates per
 * Payment Order Collection, giving us cross-system idempotency.
 */
export async function createPayoutOrder(
  input: CreatePayoutOrderInput,
): Promise<PayoutOrderResult> {
  const collectionId = billplz.require("PAYMENT_ORDER_COLLECTION_ID");
  const epoch = Math.floor(Date.now() / 1000);

  // Checksum args for "Create a Payment Order":
  // [ payment_order_collection_id, bank_account_number, total, epoch ]
  const checksum = makeChecksum([
    collectionId,
    input.bankAccountNumber,
    String(input.total),
    String(epoch),
  ]);

  const data = new URLSearchParams({
    payment_order_collection_id: collectionId,
    bank_code: input.bankCode,
    bank_account_number: input.bankAccountNumber,
    name: input.accountName,
    description: input.description ? input.description.substring(0, 200) : "Payout",
    total: String(input.total),
    epoch: String(epoch),
    checksum,
    reference_id: input.referenceId,
  });
  if (input.email) data.set("email", input.email);

  const res = await fetch(`${v5BaseUrl()}/payment_orders`, {
    method: "POST",
    headers: billplzAuth(),
    body: data,
  });

  const parsed = (await res.json().catch(() => null)) as
    | {
        id?: string;
        status?: string;
        total?: string;
        reference_id?: string | null;
        error?: { message?: string | string[] } | string;
      }
    | null;

  if (!res.ok) {
    const msg = typeof parsed?.error === "string"
      ? parsed.error
      : Array.isArray(parsed?.error?.message)
        ? parsed.error.message.join(", ")
        : parsed?.error?.message ?? JSON.stringify(parsed);
    throw new Error(`Billplz createPaymentOrder failed: ${msg}`);
  }

  return {
    id: parsed?.id ?? "",
    status: parsed?.status ?? "enquiring",
    total: parsed?.total ?? String(input.total),
    referenceId: parsed?.reference_id ?? null,
  };
}