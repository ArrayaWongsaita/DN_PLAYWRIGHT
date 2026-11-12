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
// ------------------------------------------------
test.describe("ข้อ 1: ผู้ใช้ทั่วไปกับหน้า admin", () => {
  test.use({ storageState: userFile });

  test("เข้า /admin/products แล้วเห็นว่าไม่มีสิทธิ์", async ({ page }) => {
    await page.goto("/admin/products");

    // แอปตอบหน้านี้ด้วย HTTP 200 พร้อมหัวข้อ "คุณไม่มีสิทธิ์เข้าหน้านี้" (ไม่ใช่ 403) จึงตรวจจากข้อความบนหน้า
    await expect(page.getByRole("heading", { name: "คุณไม่มีสิทธิ์เข้าหน้านี้" })).toBeVisible();
    await expect(page.getByRole("table", { name: "ตารางสินค้า" })).toHaveCount(0);
  });
});


// ------------------------------------------------
// ข้อ 2: ผู้ดูแลระบบเห็นหน้าจัดการสินค้า
// ------------------------------------------------
test.describe("ข้อ 2: ผู้ดูแลระบบกับหน้า admin", () => {
  test.use({ storageState: adminFile });

  test("เข้า /admin/products ได้และเห็นลิงก์จัดการสินค้า", async ({ page }) => {
    await page.goto("/admin/products");

    await expect(page.getByRole("heading", { name: "จัดการสินค้า" })).toBeVisible();
    // ลิงก์ "จัดการสินค้า" ใน nav มีเฉพาะ admin (หัวข้อ h1 ชื่อเดียวกัน แต่ scope ที่ nav จึงไม่ชนกัน)
    await expect(page.getByRole("navigation", { name: "เมนูหลัก" }).getByRole("link", { name: "จัดการสินค้า" })).toBeVisible();
  });
});


// ------------------------------------------------
// ข้อ 3: สองบทบาทพร้อมกัน ตะกร้าแยกกัน
// ------------------------------------------------
test("ตะกร้าของ user กับ admin แยกกัน", async ({ browser }) => {
  const userContext = await browser.newContext({ storageState: userFile });
  const adminContext = await browser.newContext({ storageState: adminFile });
  const userPage = await userContext.newPage();
  const adminPage = await adminContext.newPage();

  // userPage.request ใช้ cookie ของ userContext ตะกร้าจึงเป็นของ user เท่านั้น
  const add = await userPage.request.post("/api/cart", { data: { productId: "p01", quantity: 1 } });
  expect(add.status()).toBe(201);

  await userPage.goto("/");
  await adminPage.goto("/");
  await expect(userPage.getByTestId("cart-count")).toHaveText("1");
  // แต่ละ context ได้ session (dn_sid) ของตัวเอง ตะกร้าของ admin จึงยังว่าง
  await expect(adminPage.getByTestId("cart-count")).toHaveText("0");

  await userContext.close();
  await adminContext.close();
});
