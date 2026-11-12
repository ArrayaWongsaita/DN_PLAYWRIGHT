import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 41: login ครั้งเดียว ใช้ซ้ำทุก test (storageState)
// ฝึก: project setup + dependencies, storageState, test.use ทับค่า
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// รันด้วย: pnpm test --config lessons/41-auth-storage-state/playwright.config.ts
// ================================================

// แนวคิด: ไม่ต้อง login ในทุก test อีกแล้ว ไฟล์ auth.setup.ts login ครั้งเดียวแล้วบันทึกลง .auth/user.json
// ส่วน config ของ project chromium บอกให้ทุก test เริ่มด้วยไฟล์นั้น จึงเป็นผู้ใช้ที่ login แล้วตั้งแต่ต้น
// ในไฟล์ test นี้จะไม่มีโค้ด login เลย


// ------------------------------------------------
// ตัวอย่างที่ 1: เข้าหน้าที่ต้อง login ได้เลย
// ------------------------------------------------
test("เปิด /account ได้ทันทีโดยไม่ต้อง login ใน test", async ({ page }) => {
  await page.goto("/account");

  // ถ้ายังไม่ login จะถูกส่งไป /login?next=%2Faccount แต่ test นี้อยู่ที่ /account เลย
  await expect(page).toHaveURL("/account");
  await expect(page.getByRole("heading", { name: "บัญชีของฉัน" })).toBeVisible();
  await expect(page.getByText("ชื่อ: สมชาย ใจดี")).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: login ค้างอยู่ แต่ตะกร้าเริ่มว่างทุก test (เพราะลบ dn_sid ไว้ใน setup)
// ------------------------------------------------
test("login แล้วแต่ตะกร้าเริ่มว่างเสมอ", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("cart-count")).toHaveText("0");

  // เพิ่มของด้วย API (page.request ใช้ cookie เดียวกับหน้าเว็บ บท 37) แล้วดูว่ายอดในหัวเว็บเปลี่ยน
  const add = await page.request.post("/api/cart", { data: { productId: "p01", quantity: 2 } });
  expect(add.status()).toBe(201);
  await page.goto("/");
  await expect(page.getByTestId("cart-count")).toHaveText("2");
});


// ------------------------------------------------
// ข้อ 1: เมนูหัวเว็บของคนที่ login แล้ว
// ------------------------------------------------
test("หัวเว็บแสดง บัญชีของฉัน และ ออกจากระบบ", async ({ page }) => {
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "เมนูหลัก" });
  // สถานะ login มาจาก cookie dn_auth ในไฟล์ storageState จึงเห็นเมนูของคนที่ login แล้วตั้งแต่โหลดหน้าแรก
  await expect(nav.getByRole("link", { name: "บัญชีของฉัน" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ออกจากระบบ" })).toBeVisible();
  // toHaveCount(0) รอจนกว่าจะไม่มีลิงก์นี้เหลือ ใช้ยืนยันว่า "ไม่มี" ได้ตรงกว่า expect(...).not.toBeVisible()
  await expect(nav.getByRole("link", { name: "เข้าสู่ระบบ" })).toHaveCount(0);
});


// ------------------------------------------------
// ข้อ 2: ฟอร์ม checkout เติมชื่อให้คนที่ login แล้ว
// ------------------------------------------------
test("checkout เติมชื่อผู้รับให้อัตโนมัติ", async ({ page }) => {
  // checkout ต้องมีของในตะกร้า (ตะกร้าว่างจะ redirect ไป /cart) เตรียมด้วย API ไม่ต้องคลิกบนหน้า products
  const add = await page.request.post("/api/cart", { data: { productId: "p01", quantity: 1 } });
  expect(add.status()).toBe(201);

  await page.goto("/checkout");
  // ชื่อนี้มาจากบัญชีที่ login ใน auth.setup.ts ไม่ได้พิมพ์เอง
  await expect(page.getByLabel("ชื่อ-นามสกุล")).toHaveValue("สมชาย ใจดี");
});


// ------------------------------------------------
// ข้อ 3: ทับ storageState เป็นคนที่ยังไม่ login
// ------------------------------------------------
test.describe("ยังไม่ login", () => {
  // สถานะว่าง (ไม่มี cookie ไม่มี localStorage) ทับ storageState ของ project ให้ทุก test ในกลุ่มนี้
  test.use({ storageState: { cookies: [], origins: [] } });

  test("เปิด /account แล้วถูกส่งไปหน้า login", async ({ page }) => {
    await page.goto("/account");

    // ?next=%2Faccount คือ "/account" ที่ผ่านการ encode หน้า login จะพากลับมาหลัง login สำเร็จ
    await expect(page).toHaveURL("/login?next=%2Faccount");
    await expect(page.getByRole("heading", { name: "เข้าสู่ระบบ" })).toBeVisible();
  });
});
