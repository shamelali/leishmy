import { db } from "@/db";
import { sql } from "drizzle-orm";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const SERIALIZATION_FAILURE = "40001";
const DEADLOCK_DETECTED = "40P01";
const UNIQUE_VIOLATION = "23505";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function getPgErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as { code?: string; cause?: { code?: string } };
  return e.code ?? e.cause?.code;
}

export function isRetryableTxError(err: unknown): boolean {
  const code = getPgErrorCode(err);
  if (code === SERIALIZATION_FAILURE || code === DEADLOCK_DETECTED) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /could not serialize|deadlock detected|serialization failure/i.test(msg);
}

export function isUniqueViolation(err: unknown): boolean {
  return getPgErrorCode(err) === UNIQUE_VIOLATION;
}

/** Capped exponential backoff with jitter, in milliseconds. */
export function txBackoffMs(attempt: number): number {
  const base = Math.min(100 * 2 ** attempt, 800);
  return base + Math.random() * 50;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
  correlationId?: string,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => {
          console.warn("[notify] timeout", { label, ms, correlationId });
          resolve(null);
        }, ms);
      }),
    ]);
  } catch (err) {
    console.error("[notify] failed", { label, correlationId, err });
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function logCaught(
  scope: string,
  err: unknown,
  extra: Record<string, unknown> = {},
): void {
  console.error(`[${scope}]`, {
    ...extra,
    err: err instanceof Error ? { message: err.message, stack: err.stack } : err,
  });
}

/** READ COMMITTED (Postgres default) — non-critical multi-statement paths. */
export async function withTransaction<T>(fn: (tx: DbTransaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => fn(tx));
}

/**
 * SERIALIZABLE isolation with automatic retry on serialization failures
 * and deadlocks. Prevents dirty reads, non-repeatable reads, phantom
 * reads, and write skew on booking mutations.
 */
export async function withSerializableTransaction<T>(
  fn: (tx: DbTransaction) => Promise<T>,
  options: { maxRetries?: number; correlationId?: string } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
        return fn(tx);
      });
    } catch (err) {
      lastError = err;
      if (!isRetryableTxError(err) || attempt === maxRetries) {
        throw err;
      }
      const backoff = txBackoffMs(attempt);
      console.warn("[db] serializable transaction retry", {
        attempt: attempt + 1,
        maxRetries,
        backoffMs: Math.round(backoff),
        correlationId: options.correlationId,
        code: getPgErrorCode(err),
      });
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  throw lastError;
}

export function correlationIdFrom(request: { headers: { get(name: string): string | null } }): string {
  return request.headers.get("x-correlation-id")?.trim() || crypto.randomUUID();
}
