import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 50: reporter (list, line, dot, html, json, junit)
// ฝึก: ตั้ง reporter ใน config, เลือกตาม process.env.CI, test.step, tag, attach
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// รันด้วย: pnpm test --config lessons/50-reporters/playwright.config.ts
// ================================================

// แนวคิด: reporter คือส่วนที่แสดง "ผลการรัน" ในรูปแบบต่างๆ ใช้หลายตัวพร้อมกันได้
// บทนี้ test ธรรมดา ของที่ต้องดูคือผลลัพธ์ที่ reporter สร้าง ให้ลองรันด้วย reporter ต่างๆ ตาม README


// ------------------------------------------------
// ตัวอย่างที่ 1: test ธรรมดา ผลไปอยู่ในทุก reporter
// ------------------------------------------------
test("หน้าแรกมีหัวข้อ DN Shop", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "DN Shop", level: 1 })).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: test.step แบ่งขั้นตอนให้รายงานอ่านง่าย (เห็นในรายงาน html และ json)
// ------------------------------------------------
test("เพิ่มสินค้าแล้วตะกร้าเป็น 1", async ({ page }) => {
  await test.step("เปิดหน้าสินค้า", async () => {
    await page.goto("/products");
  });

  await test.step("กดเพิ่มลงตะกร้า", async () => {
    await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
    await expect(page.getByRole("status").filter({ hasText: "ลงตะกร้าแล้ว" })).toBeVisible();
  });

  await test.step("ตรวจยอดในหัวเว็บ", async () => {
    await expect(page.getByTestId("cart-count")).toHaveText("1");
  });
});


// ------------------------------------------------
// ข้อ 1: test ที่มีสอง step
// แนวทาง: step "เปิดหน้าสาขา" goto("/stores") แล้ว step "ตรวจหัวข้อ" ตรวจ h1 "สาขาของเรา"
//        รันแล้วเปิดรายงาน html ดูว่า step แสดงเป็นลำดับ
// ------------------------------------------------
test("หน้าสาขาแบ่งเป็น step", async ({ page }) => {
  // ทำไมใช้ step: ชื่อ step ไปโผล่ในรายงาน html และ json ทำให้อ่านออกว่า test ทำถึงขั้นไหนแล้วล้ม
  await test.step("เปิดหน้าสาขา", async () => {
    await page.goto("/stores");
  });

  await test.step("ตรวจหัวข้อ", async () => {
    await expect(page.getByRole("heading", { name: "สาขาของเรา", level: 1 })).toBeVisible();
  });
});


// ------------------------------------------------
// ข้อ 2: ติด tag แล้วเลือกรันเฉพาะ tag
// แนวทาง: ใส่ { tag: "@smoke" } เป็นอาร์กิวเมนต์ที่สองของ test (ก่อนฟังก์ชัน) ให้ test goto("/help/ordering")
//        ตรวจ h1 "คู่มือการสั่งซื้อ" แล้วรันด้วย --grep @smoke --reporter=line ดูว่ารันกี่ test
// ------------------------------------------------
test("คู่มือการสั่งซื้อ (smoke)", { tag: "@smoke" }, async ({ page }) => {
  // ทำไมใส่ tag: ให้เลือกรันเฉพาะชุดสั้นๆ ด้วย --grep @smoke (tag นี้ถูกรวมในชื่อ test ที่ reporter แสดง)
  await page.goto("/help/ordering");
  await expect(page.getByRole("heading", { name: "คู่มือการสั่งซื้อ", level: 1 })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 3: แนบข้อมูลเข้ารายงาน
// แนวทาง: ใช้ fixture testInfo ({ page }, testInfo) แล้วเรียก
//        await testInfo.attach("ข้อความหัวเว็บ", { body: ข้อความที่อ่านจาก h1, contentType: "text/plain" })
//        ข้อความอ่านจาก page.getByRole("heading", { level: 1 }).textContent() ของหน้า /stores
//        รันแล้วเปิดรายงาน html ที่ test นี้จะเห็นไฟล์แนบ
// ------------------------------------------------
test("แนบข้อความหัวเว็บเข้ารายงาน", async ({ page }, testInfo) => {
  await page.goto("/stores");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText("สาขาของเรา");

  // ทำไมใช้ attach: ไฟล์แนบถูกเก็บไว้กับ test นี้ในรายงาน (เช่นเก็บข้อมูลที่ช่วยไล่หาสาเหตุตอน test ล้ม)
  // textContent() อาจเป็น null จึงใส่ ?? "" ให้เป็น string
  await testInfo.attach("ข้อความหัวเว็บ", { body: (await heading.textContent()) ?? "", contentType: "text/plain" });
});
