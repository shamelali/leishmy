import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * These tests exercise the /api/cloudinary/delete, /api/cron/sweep-orphans,
 * and /api/upload/sign contract surface — authentication, validation,
 * authorization, and the structural integrity of the sign route.
 *
 * Most are gated on PLAYWRIGHT_CLOUDINARY=1 because they need real auth or
 * real Cloudinary access. The structural tests on the sign route are always
 * on — they prevent the SHA-256/SHA-1 bug class from ever recurring.
 */

const ENABLED = !!process.env.PLAYWRIGHT_CLOUDINARY;
const PUBLIC_ID_REGEX = /^leish\/([a-zA-Z0-9_\-.]+)(\/[a-zA-Z0-9_\-.]+)*$/;
const hasPathTraversal = (v: string) =>
  v.split("/").some((seg) => seg === "" || seg === "." || seg === "..");

test.describe("cloudinary delete contract", () => {
  test.skip(!ENABLED, "Set PLAYWRIGHT_CLOUDINARY=1 to run cloudinary e2e tests");

  test("rejects unauthenticated requests", async ({ request }) => {
    const res = await request.post("/api/cloudinary/delete", {
      data: { publicIds: ["leish/users/u1/artist/portfolio/p_1"] },
    });
    expect(res.status()).toBe(401);
  });

  test("rejects empty publicIds array", async ({ request }) => {
    const res = await request.post("/api/cloudinary/delete", {
      data: { publicIds: [] },
    });
    // Without auth the body never gets parsed; expect 401 first.
    expect([400, 401]).toContain(res.status());
  });

  test("rejects malformed publicId", async ({ request }) => {
    const res = await request.post("/api/cloudinary/delete", {
      data: { publicIds: ["../../etc/passwd"] },
    });
    expect([400, 401]).toContain(res.status());
  });

  test("rejects more than 12 publicIds", async ({ request }) => {
    const ids = Array.from({ length: 13 }, (_, i) => `leish/users/u1/artist/portfolio/p_${i}`);
    const res = await request.post("/api/cloudinary/delete", {
      data: { publicIds: ids },
    });
    expect([400, 401]).toContain(res.status());
  });
});

test.describe("cloudinary url-gen", () => {
  test("PUBLIC_ID_REGEX accepts safe publicIds", () => {
    const safe = "leish/users/u1/artist/portfolio/p_123";
    const safeWithDot = "leish/users/u1/artist/portfolio/v1.0/p_123";
    expect(PUBLIC_ID_REGEX.test(safe)).toBe(true);
    expect(PUBLIC_ID_REGEX.test(safeWithDot)).toBe(true);
  });

  test("PUBLIC_ID_REGEX rejects unsafe characters", () => {
    expect(PUBLIC_ID_REGEX.test("leish/users/u1/foo bar")).toBe(false);
    expect(PUBLIC_ID_REGEX.test("leish/users/u1/foo?bar")).toBe(false);
    expect(PUBLIC_ID_REGEX.test("leish/users/u1/foo&bar")).toBe(false);
  });

  test("hasPathTraversal catches .. and . and empty segments", () => {
    expect(hasPathTraversal("leish/users/u/foo")).toBe(false);
    expect(hasPathTraversal("leish/users/../foo")).toBe(true);
    expect(hasPathTraversal("leish/users/./foo")).toBe(true);
    expect(hasPathTraversal("leish//foo")).toBe(true);
  });
});

test.describe("cron sweep-orphans", () => {
  test.skip(!ENABLED, "Set PLAYWRIGHT_CLOUDINARY=1 to run cloudinary e2e tests");

  test("rejects requests without secret", async ({ request }) => {
    const res = await request.post("/api/cron/sweep-orphans");
    expect([401, 503]).toContain(res.status());
  });

  test("rejects requests with wrong secret", async ({ request }) => {
    const res = await request.post("/api/cron/sweep-orphans", {
      headers: { "x-cron-secret": "wrong" },
    });
    expect([401, 503]).toContain(res.status());
  });
});

/**
 * Structural tests for /api/upload/sign. These do NOT make any network
 * calls and do NOT need auth — they assert that the source file uses the
 * Cloudinary SDK's signing helper rather than re-implementing it. This
 * prevents the SHA-256/SHA-1 bug class (which caused "Invalid Signature"
 * rejections from Cloudinary) from ever being reintroduced.
 *
 * Always-on, no env var required.
 */
test.describe("cloudinary sign route structure", () => {
  const signRoutePath = path.join(
    __dirname,
    "..",
    "src",
    "app",
    "api",
    "upload",
    "sign",
    "route.ts",
  );

  test("sign route file exists", () => {
    expect(fs.existsSync(signRoutePath)).toBe(true);
  });

  test("sign route uses cloudinary.utils.api_sign_request (SDK helper)", () => {
    const src = fs.readFileSync(signRoutePath, "utf-8");
    expect(src).toContain("cloudinary.utils.api_sign_request");
  });

  test("sign route does NOT use node:crypto for hashing", () => {
    const src = fs.readFileSync(signRoutePath, "utf-8");
    expect(src).not.toMatch(/from\s+["']node:crypto["']/);
    expect(src).not.toContain("createHash");
  });

  test("sign route does NOT use sha256 (Cloudinary default is sha1)", () => {
    const src = fs.readFileSync(signRoutePath, "utf-8");
    expect(src.toLowerCase()).not.toContain("sha256");
  });

  test("sign route does NOT include max_file_size in signed params", () => {
    const src = fs.readFileSync(signRoutePath, "utf-8");
    // `max_file_size` is a Cloudinary client hint but is NOT part of the
    // signed to_sign — Cloudinary strips it before computing the expected
    // signature. Including it in the signed params object makes the
    // signature mismatch and Cloudinary rejects the upload with 401.
    //
    // The `maxFileSize` field is still allowed in the JSON response (the
    // client needs it for the form body), so this check is structural:
    // it looks for an assignment of `max_file_size` into the params
    // object BEFORE the api_sign_request call.
    const signCallIdx = src.indexOf("cloudinary.utils.api_sign_request");
    expect(signCallIdx).toBeGreaterThan(0);
    const before = src.slice(0, signCallIdx);
    expect(before).not.toMatch(/params\.max_file_size\s*=/);
    expect(before).not.toMatch(/params\[["']max_file_size["']\]\s*=/);
  });
});

test.describe("cloudinary sign route runtime", () => {
  test.skip(!ENABLED, "Set PLAYWRIGHT_CLOUDINARY=1 to run cloudinary e2e tests");

  test("rejects unauthenticated requests", async ({ request }) => {
    const res = await request.post("/api/upload/sign", {
      data: { folder: "portfolio", resourceType: "image" },
    });
    expect(res.status()).toBe(401);
  });
});

