import { db } from "@/db";
import { auditLogs } from "@/db/schema";

interface AuditEntry {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}

export async function logAudit(tx: any, entry: AuditEntry): Promise<void> {
  try {
    await tx.insert(auditLogs).values({
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId || null,
      meta: entry.meta as any,
      ip: entry.ip || null,
    });
  } catch (err) {
    console.error("[audit] failed to write audit log:", err);
  }
}
