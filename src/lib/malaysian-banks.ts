export interface MalaysianBank {
  name: string;
  code: string;
}

export const MALAYSIAN_BANKS: MalaysianBank[] = [
  { name: "Affin Bank", code: "PHBMMYKL" },
  { name: "Al-Rajhi Bank", code: "RJHIMYKL" },
  { name: "Alliance Bank", code: "ABMBMYKL" },
  { name: "AmBank", code: "ARBKMYKL" },
  { name: "Bank Islam", code: "BIMBMYKL" },
  { name: "Bank Muamalat", code: "BMMBMYKL" },
  { name: "Bank Rakyat", code: "BKRMMYKL" },
  { name: "Bank Simpanan Nasional (BSN)", code: "BJBBMYKL" },
  { name: "CIMB Bank", code: "CIBBMYKL" },
  { name: "Hong Leong Bank", code: "HLBBMYKL" },
  { name: "HSBC Bank Malaysia", code: "HMBMYKL" },
  { name: "Maybank", code: "MBBEMYKL" },
  { name: "OCBC Bank", code: "OCBCMYKL" },
  { name: "Public Bank Berhad", code: "PBBEMYKL" },
  { name: "RHB Bank", code: "RHBAMYKL" },
  { name: "Standard Chartered Bank", code: "SCBLMYKX" },
  { name: "UOB Malaysia", code: "UOVBMYKL" },
  { name: "GXBank", code: "GXSPMYKL" },
  { name: "AEON Bank", code: "ACDBMYK2" },
];

export const BANK_CODE_BY_NAME: Record<string, string> = Object.fromEntries(
  MALAYSIAN_BANKS.map((b) => [b.name.toLowerCase(), b.code]),
);

export function bankCodeForName(name: string): string | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  return BANK_CODE_BY_NAME[key] ?? null;
}