const store = new Map<string, { count: number; reset: number }>();

export function rateLimit({
  interval = 60 * 1000,
  max = 30,
}: {
  interval?: number;
  max?: number;
} = {}) {
  return {
    check: (key: string): { success: boolean; remaining: number; reset: number } => {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.reset) {
        store.set(key, { count: 1, reset: now + interval });
        return { success: true, remaining: max - 1, reset: now + interval };
      }

      entry.count += 1;
      const remaining = Math.max(0, max - entry.count);

      if (entry.count > max) {
        return { success: false, remaining: 0, reset: entry.reset };
      }

      return { success: true, remaining, reset: entry.reset };
    },
  };
}
