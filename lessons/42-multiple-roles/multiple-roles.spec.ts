import path from "node:path";
import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 42: หลายบทบาท (user กับ admin)
// ฝึก: storageState หลายไฟล์, test.use ต่อกลุ่ม, browser.newContext({ storageState }) สองบทบาทใน test เดียว
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// รันด้วย: pnpm test --config lessons/42-multiple-roles/playwright.config.ts
// ================================================

// แนวคิด: user.setup.ts บันทึก .auth/user.json, admin.setup.ts บันทึก .auth/admin.json
// ในไฟล์ test เลือกบทบาทด้วย test.use({ storageState }) ต่อกลุ่ม (test.describe)
// หรือสร้าง browser context เองสองอันใน test เดียวเมื่อต้องการสองบทบาทพร้อมกัน
const userFile = path.join(import.meta.dirname, ".auth", "user.json");
const adminFile = path.join(import.meta.dirname, ".auth", "admin.json");


// ------------------------------------------------
// ตัวอย่างที่ 1: กลุ่ม test ของผู้ใช้ทั่วไป
// ------------------------------------------------
test.describe("ผู้ใช้ทั่วไป", () => {
  // test.use ในกลุ่มนี้มีผลกับทุก test ภายใน describe นี้เท่านั้น
  test.use({ storageState: userFile });

  test("หน้า /account แสดงสิทธิ์ผู้ใช้ทั่วไป", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByText("อีเมล: user@dnshop.test")).toBeVisible();
    await expect(page.getByText("สิทธิ์: ผู้ใช้ทั่วไป")).toBeVisible();
  });
});


// ------------------------------------------------
// ตัวอย่างที่ 2: สองบทบาทใน test เดียว (สอง context แยกกัน)
// ------------------------------------------------
test("admin เพิ่มสินค้า แต่ user ไม่เห็นในหน้าของตัวเอง", async ({ browser }) => {
  // browser.newContext({ storageState }) สร้างหน้าต่าง browser ใหม่ที่ login เป็นคนละคน
  // fixture page / context ของ test ใช้ไม่ได้กับกรณีนี้ เพราะมีได้แค่บทบาทเดียว
  const adminContext = await browser.newContext({ storageState: adminFile });
  const userContext = await browser.newContext({ storageState: userFile });
  const adminPage = await adminContext.newPage();
  const userPage = await userContext.newPage();

  // admin เพิ่มสินค้าใหม่ (ชื่อไม่ซ้ำกับสินค้าเดิม)
  await adminPage.goto("/admin/products");
  await adminPage.getByLabel("ชื่อสินค้า").fill("สินค้าทดสอบสองบทบาท");
  await adminPage.getByLabel("ราคา").fill("99");
  await adminPage.getByLabel("จำนวนคงเหลือ").fill("5");
  await adminPage.getByRole("button", { name: "เพิ่มสินค้า" }).click();
  await expect(adminPage.getByRole("status").filter({ hasText: "เพิ่มสินค้าแล้ว" })).toBeVisible();
  await expect(adminPage.getByRole("table", { name: "ตารางสินค้า" }).getByRole("row", { name: /สินค้าทดสอบสองบทบาท/ })).toBeVisible();

  // ฝั่ง user: ข้อมูลของแอปนี้แยกตาม session (cookie dn_sid) และสอง context นี้ได้ session ของใครของมัน
  // user จึงเห็นแค่สินค้าเดิมของตัวเอง ไม่เห็นสินค้าที่ admin เพิ่ม
  await userPage.goto("/products");
  await expect(userPage.getByText("พบสินค้า 10 รายการ")).toBeVisible();
  await expect(userPage.getByRole("link", { name: "สินค้าทดสอบสองบทบาท" })).toHaveCount(0);

  // context ที่สร้างเองต้องปิดเอง (fixture page/context ปิดให้อัตโนมัติ แต่ context ที่เราสร้างไม่ปิดให้)
  await adminContext.close();
  await userContext.close();
});


// ------------------------------------------------
// ข้อ 1: ผู้ใช้ทั่วไปเข้าหน้าจัดการสินค้าไม่ได้
// แนวทาง: ในกลุ่ม describe ที่ใช้ test.use({ storageState: userFile }) (ใส่เอง)
//        goto("/admin/products") แล้วตรวจ h1 "คุณไม่มีสิทธิ์เข้าหน้านี้" และตาราง "ตารางสินค้า" ไม่มี (toHaveCount(0))
// ------------------------------------------------
test.describe("ข้อ 1: ผู้ใช้ทั่วไปกับหน้า admin", () => {
  // 👉 ใส่ test.use({ storageState: ... }) ที่นี่

  test.fixme("เข้า /admin/products แล้วเห็นว่าไม่มีสิทธิ์", async ({ page }) => {
    // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });
});


// ------------------------------------------------
// ข้อ 2: ผู้ดูแลระบบเห็นหน้าจัดการสินค้า
// แนวทาง: เหมือนข้อ 1 แต่ใช้ adminFile goto("/admin/products") ตรวจ h1 "จัดการสินค้า" และ
//        ตรวจ nav "เมนูหลัก" ว่ามีลิงก์ "จัดการสินค้า"
// ------------------------------------------------
test.describe("ข้อ 2: ผู้ดูแลระบบกับหน้า admin", () => {
  // 👉 ใส่ test.use({ storageState: ... }) ที่นี่

  test.fixme("เข้า /admin/products ได้และเห็นลิงก์จัดการสินค้า", async ({ page }) => {
    // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });
});


// ------------------------------------------------
// ข้อ 3: สองบทบาทพร้อมกัน ตะกร้าแยกกัน
// แนวทาง: สร้างสอง context จาก userFile และ adminFile (เหมือนตัวอย่างที่ 2) ให้ user เพิ่มหูฟัง p01 ด้วย
//        userPage.request.post("/api/cart", { data: { productId: "p01", quantity: 1 } }) (ตรวจ 201)
//        แล้วตรวจว่า goto("/") ในฝั่ง user มี cart-count "1" ส่วนฝั่ง admin เป็น "0"
//        อย่าลืมปิดทั้งสอง context ตอนท้าย
// ------------------------------------------------
test.fixme("ตะกร้าของ user กับ admin แยกกัน", async ({ browser }) => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
