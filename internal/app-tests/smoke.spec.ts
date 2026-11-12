import { test, expect } from "@playwright/test";

test("GET /api/health ตอบ app dn-shop", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: "ok", app: "dn-shop" });
});

test("หน้าแรกมี title และ h1", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("หน้าแรก | DN Shop");
  await expect(page.getByRole("heading", { level: 1, name: "DN Shop" })).toBeVisible();
});
