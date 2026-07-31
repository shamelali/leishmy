import { hasAdminAccess } from "@/lib/auth/admin";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { getAllCronRuns } from "@/lib/cron-tracking";

export const dynamic = "force-dynamic";

interface ServiceStatus {
  name: string;
  configured: boolean;
  status: "ok" | "warning" | "error" | "disabled";
  detail: string;
  dashboardUrl?: string;
}

interface CronJobStatus {
  name: string;
  path: string;
  configured: boolean;
  schedule: string;
  lastRun: string | null;
  lastStatus: "success" | "error" | "unknown" | null;
}

interface HealthCheck {
  database: "ok" | "error";
  uptime: string;
  responseTimeMs: number;
  memoryUsageMB: number;
  nodeVersion: string;
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const start = Date.now();

    // --- Health Check ---
    let dbStatus: "ok" | "error" = "ok";
    try {
      await db.execute(sql`select 1`);
    } catch {
      dbStatus = "error";
    }

    const mem = process.memoryUsage();
    const health: HealthCheck = {
      database: dbStatus,
      uptime: formatUptime(process.uptime()),
      responseTimeMs: Date.now() - start,
      memoryUsageMB: Math.round(mem.heapUsed / 1024 / 1024),
      nodeVersion: process.version,
    };

    // --- External Services ---
    const services: ServiceStatus[] = [
      {
        name: "Sentry",
        configured: !!process.env.SENTRY_DSN,
        status: process.env.SENTRY_DSN ? "ok" : "disabled",
        detail: process.env.SENTRY_DSN
          ? `Org: ${process.env.SENTRY_ORG || "—"}, Project: ${process.env.SENTRY_PROJECT || "—"}`
          : "Set SENTRY_DSN to enable error monitoring",
        dashboardUrl: process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
          ? `https://sentry.io/organizations/${process.env.SENTRY_ORG}/projects/${process.env.SENTRY_PROJECT}/`
          : undefined,
      },
      {
        name: "Google Analytics",
        configured: !!process.env.NEXT_PUBLIC_GA_ID,
        status: process.env.NEXT_PUBLIC_GA_ID ? "ok" : "disabled",
        detail: process.env.NEXT_PUBLIC_GA_ID
          ? `Tracking ID: ${process.env.NEXT_PUBLIC_GA_ID}`
          : "Set NEXT_PUBLIC_GA_ID to enable analytics",
        dashboardUrl: process.env.NEXT_PUBLIC_GA_ID
          ? "https://analytics.google.com/"
          : undefined,
      },
      {
        name: "Meta Pixel",
        configured: !!process.env.NEXT_PUBLIC_FB_PIXEL_ID,
        status: process.env.NEXT_PUBLIC_FB_PIXEL_ID ? "ok" : "disabled",
        detail: process.env.NEXT_PUBLIC_FB_PIXEL_ID
          ? `Pixel ID: ${process.env.NEXT_PUBLIC_FB_PIXEL_ID}`
          : "Set NEXT_PUBLIC_FB_PIXEL_ID to enable conversion tracking",
        dashboardUrl: process.env.NEXT_PUBLIC_FB_PIXEL_ID
          ? `https://business.facebook.com/events_manager/pixel/${process.env.NEXT_PUBLIC_FB_PIXEL_ID}/overview`
          : undefined,
      },
      {
        name: "Brevo Email",
        configured: !!process.env.BREVO_API_KEY,
        status: process.env.BREVO_API_KEY ? "ok" : "error",
        detail: process.env.BREVO_API_KEY
          ? `From: ${process.env.FROM_EMAIL || "hello@leish.my"}`
          : "BREVO_API_KEY is required for transactional email",
        dashboardUrl: "https://app.brevo.com/",
      },
      {
        name: "Cloudinary",
        configured: !!process.env.CLOUDINARY_API_KEY,
        status: process.env.CLOUDINARY_API_KEY ? "ok" : "warning",
        detail: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
          ? `Cloud: ${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}`
          : "Set CLOUDINARY_API_KEY for image uploads",
        dashboardUrl: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
          ? `https://console.cloudinary.com/console/media_library/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}`
          : undefined,
      },
      {
        name: "Upstash Redis",
        configured: !!process.env.UPSTASH_REDIS_REST_URL,
        status: process.env.UPSTASH_REDIS_REST_URL ? "ok" : "warning",
        detail: process.env.UPSTASH_REDIS_REST_URL
          ? "Connected — rate limiting active"
          : "Set UPSTASH_REDIS_REST_URL for rate limiting & cron locks",
        dashboardUrl: "https://console.upstash.com/",
      },
      {
        name: "Billplz Payments",
        configured: !!process.env.BILLPLZ_API_KEY,
        status: process.env.BILLPLZ_API_KEY ? "ok" : "error",
        detail: process.env.BILLPLZ_API_KEY
          ? `API: ${process.env.BILLPLZ_API_URL || "https://www.billplz.com/api/v3"}`
          : "BILLPLZ_API_KEY is required for payments",
        dashboardUrl: "https://www.billplz.com/",
      },
      {
        name: "Cron Jobs",
        configured: !!process.env.CRON_SECRET,
        status: process.env.CRON_SECRET ? "ok" : "warning",
        detail: process.env.CRON_SECRET
          ? "CRON_SECRET configured — 6 jobs scheduled"
          : "Set CRON_SECRET to enable scheduled tasks",
      },
    ];

    // --- Cron Jobs ---
    const cronRuns = await getAllCronRuns();
    const cronJobs: CronJobStatus[] = [
      {
        name: "Auto-Release Payments",
        path: "/api/cron/auto-release-payments",
        configured: !!process.env.CRON_SECRET,
        schedule: "Daily",
        lastRun: cronRuns["auto-release-payments"]?.timestamp || null,
        lastStatus: cronRuns["auto-release-payments"]?.status || null,
      },
      {
        name: "Booking Reminders",
        path: "/api/cron/booking-reminders",
        configured: !!process.env.CRON_SECRET,
        schedule: "Daily",
        lastRun: cronRuns["booking-reminders"]?.timestamp || null,
        lastStatus: cronRuns["booking-reminders"]?.status || null,
      },
      {
        name: "Reconcile Payments",
        path: "/api/cron/reconcile-payments",
        configured: !!process.env.CRON_SECRET,
        schedule: "Every 6 hours",
        lastRun: cronRuns["reconcile-payments"]?.timestamp || null,
        lastStatus: cronRuns["reconcile-payments"]?.status || null,
      },
      {
        name: "Send Second Payments",
        path: "/api/cron/send-second-payments",
        configured: !!process.env.CRON_SECRET,
        schedule: "Daily",
        lastRun: cronRuns["send-second-payments"]?.timestamp || null,
        lastStatus: cronRuns["send-second-payments"]?.status || null,
      },
      {
        name: "Sweep Orphans",
        path: "/api/cron/sweep-orphans",
        configured: !!process.env.CRON_SECRET,
        schedule: "Daily",
        lastRun: cronRuns["sweep-orphans"]?.timestamp || null,
        lastStatus: cronRuns["sweep-orphans"]?.status || null,
      },
      {
        name: "Sync Auth Users",
        path: "/api/cron/sync-auth-users",
        configured: !!process.env.CRON_SECRET,
        schedule: "Daily",
        lastRun: cronRuns["sync-auth-users"]?.timestamp || null,
        lastStatus: cronRuns["sync-auth-users"]?.status || null,
      },
    ];

    // --- Database Stats ---
    let dbStats = { totalTables: 0, totalRows: 0 };
    try {
      const tableResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      const tableCount = tableResult.rows?.[0];
      dbStats.totalTables = Number(tableCount?.count) || 0;

      const rowResult = await db.execute(sql`
        SELECT SUM(n_live_tup) as total 
        FROM pg_stat_user_tables
      `);
      const rowCount = rowResult.rows?.[0];
      dbStats.totalRows = Number(rowCount?.total) || 0;
    } catch {
      // silently handle
    }

    return NextResponse.json({
      health,
      services,
      cronJobs,
      dbStats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[monitoring] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch monitoring data" },
      { status: 500 },
    );
  }
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
