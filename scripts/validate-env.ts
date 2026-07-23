#!/usr/bin/env tsx
/**
 * Production Environment Validation Script
 * Validates all required environment variables are set before deployment
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envExamplePath = join(__dirname, "..", ".env.example");
const envExample = readFileSync(envExamplePath, "utf-8");

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
];

function parseEnvExample(content: string): string[] {
  const vars: string[] = [];
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z_]+)=/);
    if (match) {
      vars.push(match[1]);
    }
  }
  return vars;
}

function validateEnv() {
  const allVarsInExample = parseEnvExample(envExample);
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const present: string[] = [];

  for (const varName of REQUIRED_VARS) {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missingRequired.push(varName);
    }
  }

  for (const varName of OPTIONAL_VARS) {
    if (!process.env[varName]) {
      missingOptional.push(varName);
    } else {
      present.push(varName);
    }
  }

  // Check for vars in .env.example but not in our lists
  const uncategorized = allVarsInExample.filter(
    (v) => !REQUIRED_VARS.includes(v) && !OPTIONAL_VARS.includes(v)
  );

  console.log("=".repeat(60));
  console.log("PRODUCTION ENVIRONMENT VALIDATION");
  console.log("=".repeat(60));

  console.log(`\n✅ Present (${present.length}):`);
  for (const v of present) {
    const val = process.env[v];
    const masked = val && val.length > 8 ? val.slice(0, 4) + "***" + val.slice(-4) : "***";
    console.log(`  ${v}=${masked}`);
  }

  if (missingRequired.length > 0) {
    console.log(`\n❌ MISSING REQUIRED (${missingRequired.length}):`);
    for (const v of missingRequired) {
      console.log(`  ${v}`);
    }
  } else {
    console.log("\n✅ All required variables are set!");
  }

  if (missingOptional.length > 0) {
    console.log(`\n⚠️  Missing optional (${missingOptional.length}):`);
    for (const v of missingOptional) {
      console.log(`  ${v}`);
    }
  }

  if (uncategorized.length > 0) {
    console.log(`\n❓ Uncategorized in .env.example (${uncategorized.length}):`);
    for (const v of uncategorized) {
      console.log(`  ${v}`);
    }
  }

  console.log("\n" + "=".repeat(60));

  if (missingRequired.length > 0) {
    console.log("❌ VALIDATION FAILED - Missing required variables");
    process.exit(1);
  }

  console.log("✅ VALIDATION PASSED - Ready for deployment");
  process.exit(0);
}

validateEnv();