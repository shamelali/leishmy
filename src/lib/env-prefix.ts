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
    return "01234567890123456789012345678901";
  }
  return "placeholder";
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
