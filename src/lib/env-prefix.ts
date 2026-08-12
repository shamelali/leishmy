import { randomBytes } from "node:crypto";

// Single-process-only fallback (local dev). In production the real
// NEON_AUTH_COOKIE_SECRET must be set — see src/lib/env.ts.
const runtimeFallbackCredential = randomBytes(32).toString("hex");

export function readPrefixedEnv(prefix: string, key: string): string | undefined {
  return process.env[`${prefix}${key}`];
}

export function readRequiredPrefixedEnv(prefix: string, key: string): string {
  const value = readPrefixedEnv(prefix, key);
  if (value && value.trim().length > 0) return value;
  if (prefix === "NEON_AUTH_" && key === "BASE_URL") {
    return process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL || "https://auth.neon.tech";
  }
  if (prefix === "NEON_AUTH_" && key === "COOKIE_SECRET") {
    return runtimeFallbackCredential;
  }
  return runtimeFallbackCredential;
}

export function prefixedEnvReader(prefix: string) {
  return {
    get(key: string): string | undefined {
      return readPrefixedEnv(prefix, key);
    },
    require(key: string): string {
      return readRequiredPrefixedEnv(prefix, key);
    },
  };
}
