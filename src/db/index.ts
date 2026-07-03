import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

const globalForDb = globalThis as typeof globalThis & {
  __db?: { pool: Pool; drizzle: NodePgDatabase };
};

function getConnection() {
  if (!globalForDb.__db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is required");
    const pool = new Pool({ connectionString: url });
    globalForDb.__db = { pool, drizzle: drizzle(pool) };
  }
  return globalForDb.__db;
}

export const db = new Proxy({} as NodePgDatabase, {
  get(_, prop) {
    const conn = getConnection();
    const val = (conn.drizzle as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? (val as Function).bind(conn.drizzle) : val;
  },
});

export const pool = new Proxy({} as Pool, {
  get(_, prop) {
    const conn = getConnection();
    const val = (conn.pool as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? (val as Function).bind(conn.pool) : val;
  },
});
