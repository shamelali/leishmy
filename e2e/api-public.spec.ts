import { test, expect } from "@playwright/test";

test("GET /api/artists returns array", async ({ request }) => {
  const res = await request.get("/api/artists");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body.artists ?? body)).toBe(true);
});

test("GET /api/studios returns array", async ({ request }) => {
  const res = await request.get("/api/studios");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body.studios ?? body)).toBe(true);
});

test("GET /api/services returns array when artistId is provided", async ({ request }) => {
  const res = await request.get("/api/services?artistId=7f06fdbd-804e-46b6-8e74-c5d221638385");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body.services)).toBe(true);
});
