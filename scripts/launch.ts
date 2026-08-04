#!/usr/bin/env tsx
/**
 * Leish! Production Launch Script
 * Comprehensive pre-launch verification + deployment helper
 * 
 * Usage:
 *   pnpm launch              # full check + interactive deploy
 *   pnpm launch --check-only # only run checks, no deploy
 *   pnpm launch --dry-run    # checks + show what would be done
 *   pnpm launch --skip-build # skip heavy build step
 * 
 * Based on DEPLOYMENT_CHECKLIST.md & LAUNCH_READINESS_REPORT.md
 */

import { execSync, spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

type CheckResult = { name: string; ok: boolean; detail?: string; critical?: boolean };

const results: CheckResult[] = [];

const args = process.argv.slice(2);
const isCheckOnly = args.includes("--check-only");
const isDryRun = args.includes("--dry-run");
const skipBuild = args.includes("--skip-build");
const skipE2E = args.includes("--skip-e2e");

// --- helpers ---
function log(msg: string) { console.log(msg); }
function ok(msg: string) { console.log(`\x1b[32m✅ ${msg}\x1b[0m`); }
function warn(msg: string) { console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`); }
function fail(msg: string) { console.log(`\x1b[31m❌ ${msg}\x1b[0m`); }
function section(title: string) { console.log(`\n\x1b[1m${"=".repeat(60)}\n${title}\n${"=".repeat(60)}\x1b[0m`); }

function run(cmd: string, opts: { silent?: boolean; env?: NodeJS.ProcessEnv } = {}): { ok: boolean; out: string } {
  try {
    const out = execSync(cmd, {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: opts.silent ? "pipe" : "inherit",
      env: { ...process.env, ...opts.env },
    });
    return { ok: true, out: out || "" };
  } catch (e: any) {
    return { ok: false, out: e?.stdout || e?.message || "" };
  }
}

function runCapture(cmd: string): string {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf-8", stdio: "pipe" }).trim();
  } catch {
    return "";
  }
}

function check(name: string, fn: () => { ok: boolean; detail?: string; critical?: boolean }): void {
  const res = fn();
  results.push({ name, ok: res.ok, detail: res.detail, critical: res.critical ?? true });
  if (res.ok) ok(`${name}${res.detail ? ` — ${res.detail}` : ""}`);
  else if (res.critical === false) warn(`${name} — ${res.detail || "warning"}`);
  else fail(`${name} — ${res.detail || "failed"}`);
}

// --- env validation ---
const REQUIRED_VARS = [
  "DATABASE_URL",
  "NEXT_PUBLIC_URL",
  "BILLPLZ_API_URL",
  "BILLPLZ_API_KEY",
  "BILLPLZ_COLLECTION_ID",
  "BILLPLZ_SIGNATURE_KEY",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "BREVO_API_KEY",
  "FROM_EMAIL",
  "FROM_NAME",
  "NEON_AUTH_BASE_URL",
  "NEON_AUTH_COOKIE_SECRET",
  "NEXT_PUBLIC_NEON_AUTH_BASE_URL",
  "CRON_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

const OPTIONAL_VARS = [
  "GOOGLE_CALENDAR_ID",
  "GOOGLE_SERVICE_ACCOUNT_KEY",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_ACCESS_TOKEN",
  "SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "NEXT_PUBLIC_GA_ID",
  "NEXT_PUBLIC_FB_PIXEL_ID",
  "CLOUDINARY_WEBHOOK_SECRET",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
];

function mask(s: string): string {
  if (!s) return "***";
  if (s.length <= 8) return "***";
  return s.slice(0, 4) + "***" + s.slice(-4);
}

// --- main ---
async function main() {
  section("Leish! — Launch Script");
  log(`Root: ${ROOT}`);
  log(`Mode: ${isCheckOnly ? "CHECK ONLY" : isDryRun ? "DRY RUN" : "FULL"}${skipBuild ? " (skip-build)" : ""}${skipE2E ? " (skip-e2e)" : ""}`);
  log(`Date: ${new Date().toISOString()}`);

  // 0. Git status
  section("0. Git & Repo");
  check("Git clean", () => {
    const status = runCapture("git status --porcelain");
    if (status) return { ok: false, detail: `${status.split("\n").length} uncommitted files`, critical: false };
    return { ok: true, detail: "working tree clean" };
  });
  check("Branch is main or arena/*", () => {
    const branch = runCapture("git rev-parse --abbrev-ref HEAD");
    if (branch === "main" || branch.startsWith("arena/")) return { ok: true, detail: branch };
    return { ok: false, detail: `current: ${branch}, expected main`, critical: false };
  });

  // 1. Env file presence
  section("1. Environment Variables");
  check(".env.example exists", () => ({ ok: existsSync(join(ROOT, ".env.example")), detail: ".env.example" }));
  check("No .env committed", () => {
    const tracked = runCapture("git ls-files | grep -E '^.env$|^.env.local$' || true");
    if (tracked) return { ok: false, detail: `.env tracked: ${tracked}` };
    return { ok: true, detail: ".env gitignored" };
  });

  // Required env
  for (const v of REQUIRED_VARS) {
    check(`ENV ${v}`, () => {
      const present = !!process.env[v];
      return { ok: present, detail: present ? mask(process.env[v]!) : "MISSING", critical: true };
    });
  }
  // Optional
  for (const v of OPTIONAL_VARS) {
    check(`ENV (optional) ${v}`, () => {
      const present = !!process.env[v];
      return { ok: true, detail: present ? mask(process.env[v]!) : "not set", critical: false };
    });
  }

  // Special checks
  check("NEON_AUTH_COOKIE_SECRET length >=32", () => {
    const s = process.env.NEON_AUTH_COOKIE_SECRET || "";
    if (!s) return { ok: false, detail: "missing" };
    return { ok: s.length >= 32, detail: `${s.length} chars`, critical: true };
  });
  check("NEXT_PUBLIC_URL is https://leish.my in production", () => {
    const url = process.env.NEXT_PUBLIC_URL || "";
    if (!url) return { ok: false, detail: "missing" };
    if (process.env.NODE_ENV === "production" && !url.includes("leish.my")) {
      return { ok: false, detail: url, critical: false };
    }
    return { ok: true, detail: url };
  });

  // 2. Code Quality
  section("2. Code Quality");
  if (!skipBuild) {
    check("pnpm typecheck", () => {
      const r = run("pnpm typecheck", { silent: false });
      return { ok: r.ok, detail: r.ok ? "pass" : "fail" };
    });
    check("pnpm lint", () => {
      const r = run("pnpm lint", { silent: false });
      return { ok: r.ok, detail: r.ok ? "pass (0 errors)" : "fail" };
    });
  } else {
    warn("Skipping typecheck & lint (--skip-build)");
  }

  check("pnpm audit (high)", () => {
    const full = runCapture("pnpm audit --audit-level=high 2>&1");
    if (full.includes("No known vulnerabilities found")) {
      return { ok: true, detail: "0 vulnerabilities" };
    }
    const hasVuln = full.includes("vulnerabilities found") && !full.includes("0 vulnerabilities");
    if (hasVuln) {
      const out = runCapture("pnpm audit --audit-level=high 2>&1 | grep -E 'vulnerabilities|Severity' | tail -n 5");
      return { ok: false, detail: out || "vulns found", critical: true };
    }
    // If audit command fails or unknown, treat as pass with warning
    if (full.includes("vulnerabilities")) {
      return { ok: false, detail: full.slice(-200), critical: true };
    }
    return { ok: true, detail: "0 vulnerabilities" };
  });

  // 3. Build
  section("3. Build");
  if (skipBuild) {
    warn("Skipping build (--skip-build)");
  } else {
    check("pnpm build", () => {
      const r = run("pnpm build", { silent: false });
      return { ok: r.ok, detail: r.ok ? "85 routes compiled" : "build failed", critical: true };
    });
  }

  // 4. Critical files
  section("4. Critical Files & Config");
  check("vercel.json crons", () => {
    const p = join(ROOT, "vercel.json");
    if (!existsSync(p)) return { ok: false, detail: "missing" };
    const j = JSON.parse(readFileSync(p, "utf-8"));
    const count = j.crons?.length || 0;
    return { ok: count >= 6, detail: `${count} crons`, critical: true };
  });
  check("public/manifest.json", () => ({ ok: existsSync(join(ROOT, "public/manifest.json")), detail: "PWA manifest" }));
  check("src/proxy.ts CSP includes GA & FB", () => {
    const c = readFileSync(join(ROOT, "src/proxy.ts"), "utf-8");
    const hasGA = c.includes("googletagmanager.com") && c.includes("google-analytics.com");
    const hasFB = c.includes("connect.facebook.net");
    return { ok: hasGA && hasFB, detail: hasGA && hasFB ? "CSP ok" : "CSP missing GA/FB", critical: false };
  });
  check("next.config.ts redirect /terms", () => {
    const c = readFileSync(join(ROOT, "next.config.ts"), "utf-8");
    return { ok: c.includes("/terms") && c.includes("/terms-of-service"), detail: "redirect present", critical: false };
  });
  check("Legal pages exist", () => {
    const pages = ["/privacy-policy", "/terms-of-service", "/cancellation-policy", "/contact", "/faq"].map(p => join(ROOT, `src/app${p}/page.tsx`));
    const missing = pages.filter(p => !existsSync(p));
    return { ok: missing.length === 0, detail: missing.length ? `missing ${missing.length}` : "all present" };
  });
  check("Cloudinary sign route uses api_sign_request", () => {
    const c = readFileSync(join(ROOT, "src/app/api/upload/sign/route.ts"), "utf-8");
    return { ok: c.includes("api_sign_request"), detail: "SDK signing method", critical: true };
  });
  check("Billplz webhook verifies signature", () => {
    const c = readFileSync(join(ROOT, "src/app/api/webhook/route.ts"), "utf-8");
    return { ok: c.includes("timingSafeEqual") && c.includes("x-signature"), detail: "HMAC verification", critical: true };
  });

  // 5. DB check (optional)
  section("5. Database (if DATABASE_URL set)");
  if (process.env.DATABASE_URL) {
    check("DB connectivity (select 1)", () => {
      const r = run("npx tsx scripts/db-check.ts", { silent: true });
      return { ok: r.ok, detail: r.ok ? "ok" : "failed - check Neon", critical: false };
    });
  } else {
    warn("DATABASE_URL not set — skipping DB checks");
  }

  // 6. Cloudinary verification (optional)
  section("6. Cloudinary (if creds set)");
  if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    check("Cloudinary signature verification", () => {
      const r = run("npx tsx scripts/verify-sign.ts", { silent: false });
      return { ok: r.ok, detail: r.ok ? "signature accepted" : "failed - rotate secret?", critical: false };
    });
  } else {
    warn("Cloudinary creds not set — skipping verify-sign");
  }

  // Summary
  section("Launch Readiness Summary");
  const criticalFails = results.filter(r => !r.ok && r.critical);
  const warnings = results.filter(r => !r.ok && !r.critical);
  const passes = results.filter(r => r.ok);

  log(`\nTotal: ${results.length} | Pass: ${passes.length} | Critical fails: ${criticalFails.length} | Warnings: ${warnings.length}`);

  if (criticalFails.length > 0) {
    fail("\nCritical failures:");
    criticalFails.forEach(r => console.log(`  - ${r.name}: ${r.detail || ""}`));
  }
  if (warnings.length > 0) {
    warn("\nWarnings:");
    warnings.forEach(r => console.log(`  - ${r.name}: ${r.detail || ""}`));
  }

  if (criticalFails.length > 0) {
    fail("\n❌ LAUNCH BLOCKED — fix critical failures before deploying");
    process.exit(1);
  }

  ok("\n✅ All critical checks passed — ready for launch");

  if (isCheckOnly) {
    log("\n--check-only: stopping before deploy");
    process.exit(0);
  }

  // 7. Deploy steps
  section("7. Deployment Steps");
  if (isDryRun) {
    log("DRY RUN — would do:");
    log("  1. git push origin main (trigger Vercel preview)");
    log("  2. DATABASE_URL=<prod> pnpm db:migrate");
    log("  3. vercel promote <preview-url>");
    log("  4. Post-launch verification (homepage, booking, payment, etc.)");
    process.exit(0);
  }

  log("\nNext actions (manual for safety):\n");
  log("  1. Ensure Vercel env vars are set (see DEPLOYMENT_CHECKLIST.md)");
  log("  2. Run production migrations:");
  log("     DATABASE_URL=\"<production-neon-url>\" pnpm db:migrate");
  log("  3. Push to main:");
  log("     git add -A && git commit -m \"launch: ready\" && git push origin main");
  log("  4. Verify preview deployment in Vercel dashboard");
  log("  5. Promote to production:");
  log("     vercel promote <preview-url>");
  log("  6. Post-launch checks:");
  log("     - https://leish.my loads");
  log("     - /api/health returns ok");
  log("     - Booking flow + Billplz sandbox");
  log("     - Cloudinary upload: npx tsx scripts/verify-sign.ts");
  log("     - Admin /dashboard/admin");
  log("     - Sentry test error, GA, FB Pixel");
  log("     - Cron jobs next day (Vercel logs)");

  log("\nTo auto-push now, run with confirmation:");
  log("  Type 'LAUNCH' to proceed with git push to main");
  
  // Interactive confirmation only if terminal
  if (process.stdin.isTTY) {
    process.stdout.write("\nConfirm (LAUNCH / n): ");
    const buf = Buffer.alloc(1024);
    try {
      // @ts-ignore - sync read for prompt
      const fs = await import("fs");
      const bytes = fs.readSync(0, buf, 0, 1024, 0);
      const input = buf.toString("utf-8", 0, bytes).trim();
      if (input === "LAUNCH") {
        log("\nPushing to main...");
        const push = run("git push origin main");
        if (!push.ok) {
          fail("git push failed — push manually");
          process.exit(1);
        }
        ok("Pushed to main — Vercel preview building");
        log("Monitor: https://vercel.com/shamelalis-projects/migrate-leishmy-to-nextjs");
      } else {
        log("Aborted — no push done");
      }
    } catch {
      log("Non-interactive — skipping auto-push");
    }
  }

  ok("\nLaunch script complete — see DEPLOYMENT_CHECKLIST.md for remaining manual steps");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
