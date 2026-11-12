import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 23: playwright.config.ts
// ฝึก: expect.timeout, retries, use.viewport (แก้ที่ playwright.config.ts ในโฟลเดอร์นี้)
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// รันด้วย: pnpm test --config lessons/23-config/playwright.config.ts
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: อ่านค่า config จากภายใน test ผ่าน testInfo.project
// ------------------------------------------------
test("page ใช้ viewport ตามที่ config กำหนด", async ({ page }, testInfo) => {
  await page.goto("/");
  // testInfo.project.use คือค่า use ของ project ที่ test นี้รันอยู่ (รวมค่าจาก devices ที่ spread ไว้)
  // ตรวจให้ตรงกับที่ตั้งใน config จึงผ่านไม่ว่าจะแก้ viewport เป็นอะไร
  expect(page.viewportSize()).toEqual(testInfo.project.use.viewport);
});


// ------------------------------------------------
// ตัวอย่างที่ 2: baseURL จาก config ทำให้ goto ใช้ path สั้นได้ และ timeout จาก config
// ------------------------------------------------
test("goto path สั้นได้เพราะมี baseURL และ timeout มาจาก config", async ({ page, baseURL }, testInfo) => {
  expect(baseURL).toBe("http://localhost:3100");
  await page.goto("/products");
  await expect(page).toHaveURL(`${baseURL}/products`);
  // testInfo.timeout คือ timeout ของ test นี้ (ตั้งจาก config ค่า timeout)
  expect(testInfo.timeout).toBe(30_000);
});


// ------------------------------------------------
// ข้อ 1: ตั้ง expect.timeout ใน config ให้ test ที่โหลดช้า (7 วินาที) ผ่าน
// แนวทาง: แก้ expect: { timeout } ใน playwright.config.ts เป็น 10_000 (ห้ามใส่ timeout ในตัว expect)
//        แล้วเปลี่ยน test.fixme ด้านล่างเป็น test ต้องผ่านเมื่อ expect.timeout มากกว่า 7 วินาที
//        ตัว test: goto("/playground/slow?delay=7000") กดปุ่ม "โหลดข้อมูล" แล้วตรวจ
//        page.getByRole("status").filter({ hasText: "โหลดข้อมูลเสร็จแล้ว" }) ว่า toBeVisible()
// ------------------------------------------------
test.fixme("โหลดข้อมูลช้า 7 วินาที ต้องรอจนเสร็จ (ต้องแก้ expect.timeout)", async ({ page }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: ตั้ง retries ใน config ให้ test ที่ fail รอบแรกผ่านในรอบที่สอง
// แนวทาง: ตั้ง retries: 1 ใน config แล้วเปลี่ยน test.fixme ด้านล่างเป็น test
//        ตัว test: รับ ({ page }, testInfo) goto("/") แล้ว expect(testInfo.retry).toBeGreaterThan(0)
//        (testInfo.retry เป็น 0 ในรอบแรก และ 1 ในรอบ retry) ผลจะขึ้นว่า flaky แต่ exit code 0
// ------------------------------------------------
test.fixme("ผ่านเฉพาะรอบ retry (ต้องแก้ retries)", async ({ page }, testInfo) => {
  // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: ตั้ง use.viewport ของ project ให้เป็นมือถือ แล้วหน้าแรกต้องแสดงปุ่ม "เปิดเมนู"
// แนวทาง: ใน projects[0].use ต่อท้าย ...devices["Desktop Chrome"] ด้วย viewport: { width: 390, height: 844 }
//        (ใส่ที่ top-level use ไม่ได้ผล เพราะ devices ของ project ทับไว้ README อธิบาย)
//        ตัว test: goto("/") ตรวจปุ่ม "เปิดเมนู" toBeVisible() และ nav "เมนูหลัก" ตรวจลิงก์ "หน้าแรก" toBeHidden()
// ------------------------------------------------
test.fixme("จอแคบเห็นปุ่มเปิดเมนู (ต้องแก้ viewport)", async ({ page }) => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
