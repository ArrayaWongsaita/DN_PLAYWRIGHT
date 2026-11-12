import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 51: รัน test บน GitHub Actions (CI) และ sharding
// ฝึก: เติมไฟล์ playwright.yml, รัน --shard=1/2 และ --shard=2/2
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// รันด้วย: pnpm test --config lessons/51-ci-github-actions/playwright.config.ts
// ================================================

// บทนี้ไม่มีแบบฝึกหัดที่เป็น test (ไม่มี test.fixme) งานของคุณคือไฟล์ playwright.yml กับคำสั่ง --shard ใน README
// test 4 ข้อด้านล่างเล็กและไม่เกี่ยวกันเลย ไว้ให้เห็นว่า sharding แบ่งงานอย่างไร

test("หน้าแรกมี h1 DN Shop", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "DN Shop", level: 1 })).toBeVisible();
});

test("หน้าสินค้ามี h1 สินค้าทั้งหมด", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "สินค้าทั้งหมด", level: 1 })).toBeVisible();
});

test("หน้าสาขามี h1 สาขาของเรา", async ({ page }) => {
  await page.goto("/stores");
  await expect(page.getByRole("heading", { name: "สาขาของเรา", level: 1 })).toBeVisible();
});

test("หน้าคู่มือมี h1 คู่มือการสั่งซื้อ", async ({ page }) => {
  await page.goto("/help/ordering");
  await expect(page.getByRole("heading", { name: "คู่มือการสั่งซื้อ", level: 1 })).toBeVisible();
});
