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
  criticalValue?: string;
  criticalLabel?: string;
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

interface Alarm {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  action?: string;
  actionUrl?: string;
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
        criticalValue: process.env.SENTRY_DSN ? "Monitoring" : "Offline",
        criticalLabel: "Error Tracking",
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
        criticalValue: process.env.NEXT_PUBLIC_GA_ID ? "Active" : "No Data",
        criticalLabel: "Web Analytics",
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
        criticalValue: process.env.NEXT_PUBLIC_FB_PIXEL_ID ? "Tracking" : "No Tracking",
        criticalLabel: "Conversion Tracking",
      },
      {
        name: "Brevo Email",
        configured: !!process.env.BREVO_API_KEY,
        status: process.env.BREVO_API_KEY ? "ok" : "error",
        detail: process.env.BREVO_API_KEY
          ? `From: ${process.env.FROM_EMAIL || "hello@leish.my"}`
          : "BREVO_API_KEY is required for transactional email",
        dashboardUrl: "https://app.brevo.com/",
        criticalValue: process.env.BREVO_API_KEY ? "Sending" : "Blocked",
        criticalLabel: "Transactional Email",
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
        criticalValue: process.env.CLOUDINARY_API_KEY ? "Uploads OK" : "Degraded",
        criticalLabel: "Image Uploads",
      },
      {
        name: "Cloudinary Webhook",
        configured: !!process.env.CLOUDINARY_WEBHOOK_SECRET,
        status: process.env.CLOUDINARY_WEBHOOK_SECRET ? "ok" : "error",
        detail: process.env.CLOUDINARY_WEBHOOK_SECRET
          ? "Signature verification active"
          : "CLOUDINARY_WEBHOOK_SECRET not set — delete/upload events are silently dropped",
        criticalValue: process.env.CLOUDINARY_WEBHOOK_SECRET ? "Receiving" : "No-Op",
        criticalLabel: "Webhook Events",
      },
      {
        name: "Upstash Redis",
        configured: !!process.env.UPSTASH_REDIS_REST_URL,
        status: process.env.UPSTASH_REDIS_REST_URL ? "ok" : "warning",
        detail: process.env.UPSTASH_REDIS_REST_URL
          ? "Connected — rate limiting active"
          : "Set UPSTASH_REDIS_REST_URL for rate limiting & cron locks",
        dashboardUrl: "https://console.upstash.com/",
        criticalValue: process.env.UPSTASH_REDIS_REST_URL ? "Connected" : "No Cache",
        criticalLabel: "Rate Limiting",
      },
      {
        name: "Billplz Payments",
        configured: !!process.env.BILLPLZ_API_KEY,
        status: process.env.BILLPLZ_API_KEY ? "ok" : "error",
        detail: process.env.BILLPLZ_API_KEY
          ? `API: ${process.env.BILLPLZ_API_URL || "https://www.billplz.com/api/v3"}`
          : "BILLPLZ_API_KEY is required for payments",
        dashboardUrl: "https://www.billplz.com/",
        criticalValue: process.env.BILLPLZ_API_KEY ? "Processing" : "Payments Down",
        criticalLabel: "Payment Gateway",
      },
      {
        name: "Cron Jobs",
        configured: !!process.env.CRON_SECRET,
        status: process.env.CRON_SECRET ? "ok" : "warning",
        detail: process.env.CRON_SECRET
          ? "CRON_SECRET configured — 6 jobs scheduled"
          : "Set CRON_SECRET to enable scheduled tasks",
        criticalValue: process.env.CRON_SECRET ? "6 Jobs" : "Disabled",
        criticalLabel: "Scheduled Tasks",
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

    // --- Alarms ---
    const alarms: Alarm[] = [];

    // Critical: Database down
    if (dbStatus === "error") {
      alarms.push({
        id: "db-down",
        severity: "critical",
        title: "Database Connection Failed",
        message: "Cannot connect to PostgreSQL database. All data operations are failing.",
        action: "Check DATABASE_URL and Neon status",
        actionUrl: "https://console.neon.tech/",
      });
    }

    // Critical: Payment gateway down
    if (!process.env.BILLPLZ_API_KEY) {
      alarms.push({
        id: "payment-down",
        severity: "critical",
        title: "Payment Gateway Offline",
        message: "BILLPLZ_API_KEY is not configured. Users cannot make payments.",
        action: "Configure BILLPLZ_API_KEY",
      });
    }

    // Critical: Email service down
    if (!process.env.BREVO_API_KEY) {
      alarms.push({
        id: "email-down",
        severity: "critical",
        title: "Email Service Blocked",
        message: "BREVO_API_KEY is not configured. Transactional emails are not being sent.",
        action: "Configure BREVO_API_KEY",
        actionUrl: "https://app.brevo.com/",
      });
    }

    // Critical: Cloudinary webhook not configured
    if (!process.env.CLOUDINARY_WEBHOOK_SECRET) {
      alarms.push({
        id: "cloudinary-webhook-disabled",
        severity: "critical",
        title: "Cloudinary Webhook Not Configured",
        message:
          "CLOUDINARY_WEBHOOK_SECRET is not set. Portfolio image delete/upload events from Cloudinary are silently ignored — orphaned DB rows may accumulate.",
        action: "Set CLOUDINARY_WEBHOOK_SECRET env var and configure the webhook in Cloudinary Dashboard",
        actionUrl: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
          ? `https://console.cloudinary.com/console/media_library/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/webhooks`
          : undefined,
      });
    }

    // Warning: Error monitoring disabled
    if (!process.env.SENTRY_DSN) {
      alarms.push({
        id: "sentry-disabled",
        severity: "warning",
        title: "Error Monitoring Disabled",
        message: "Sentry is not configured. Production errors are not being tracked.",
        action: "Set SENTRY_DSN env var",
      });
    }

    // Warning: Cron jobs not configured
    if (!process.env.CRON_SECRET) {
      alarms.push({
        id: "cron-disabled",
        severity: "warning",
        title: "Scheduled Tasks Disabled",
        message: "CRON_SECRET is not configured. Automated jobs (payment release, reminders) are not running.",
        action: "Set CRON_SECRET env var",
      });
    }

    // Warning: Rate limiting disabled
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      alarms.push({
        id: "redis-disabled",
        severity: "warning",
        title: "Rate Limiting Disabled",
        message: "Upstash Redis is not configured. API rate limiting and cron locks are inactive.",
        action: "Set UPSTASH_REDIS_REST_URL env var",
      });
    }

    // Warning: Cron job failures
    for (const job of cronJobs) {
      if (job.lastStatus === "error") {
        alarms.push({
          id: `cron-fail-${job.path}`,
          severity: "critical",
          title: `Cron Job Failed: ${job.name}`,
          message: `Last execution failed. Check logs for /api/cron/${job.path.split("/").pop()}`,
          action: "View cron endpoint",
          actionUrl: job.path,
        });
      }
    }

    // Warning: High memory usage
    if (health.memoryUsageMB > 400) {
      alarms.push({
        id: "high-memory",
        severity: "warning",
        title: "High Memory Usage",
        message: `Server heap is at ${health.memoryUsageMB}MB. Consider investigating memory leaks.`,
      });
    }

    // Warning: Meta Pixel not configured
    if (!process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      alarms.push({
        id: "fb-pixel-disabled",
        severity: "info",
        title: "Conversion Tracking Not Active",
        message: "Meta Pixel is not configured. Facebook/Instagram ad conversions are not being tracked.",
        action: "Set NEXT_PUBLIC_FB_PIXEL_ID",
      });
    }

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
      alarms,
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
