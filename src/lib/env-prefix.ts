export function readPrefixedEnv(prefix: string, key: string): string | undefined {
  return process.env[`${prefix}${key}`];
}

export function readRequiredPrefixedEnv(prefix: string, key: string): string {
  const value = readPrefixedEnv(prefix, key);
  if (!value) throw new Error(`Missing required env var: ${prefix}${key}`);
  return value;
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
