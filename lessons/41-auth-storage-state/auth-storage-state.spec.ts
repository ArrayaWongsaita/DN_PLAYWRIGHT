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
// แนวทาง: goto("/") แล้วตรวจใน nav "เมนูหลัก" ว่ามีลิงก์ "บัญชีของฉัน" และปุ่ม "ออกจากระบบ" เห็นอยู่
//        และไม่มีลิงก์ "เข้าสู่ระบบ" (toHaveCount(0))
// ------------------------------------------------
test.fixme("หัวเว็บแสดง บัญชีของฉัน และ ออกจากระบบ", async ({ page }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: ฟอร์ม checkout เติมชื่อให้คนที่ login แล้ว
// แนวทาง: เพิ่มหูฟัง p01 จำนวน 1 ด้วย page.request.post("/api/cart", ...) (ตรวจ status 201)
//        goto("/checkout") แล้วตรวจว่าช่อง label "ชื่อ-นามสกุล" มีค่า "สมชาย ใจดี" (toHaveValue)
// ------------------------------------------------
test.fixme("checkout เติมชื่อผู้รับให้อัตโนมัติ", async ({ page }) => {
  // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: ทับ storageState เป็นคนที่ยังไม่ login
// แนวทาง: ใน test.describe ใส่ test.use({ storageState: { cookies: [], origins: [] } }) (สถานะว่าง = ไม่มี cookie)
//        แล้ว goto("/account") ตรวจว่า URL เป็น /login?next=%2Faccount (ใช้ toHaveURL แบบ string ตรงตัว)
//        และเห็น h1 "เข้าสู่ระบบ"
// ------------------------------------------------
test.describe("ยังไม่ login", () => {
  // 👉 ใส่ test.use({ storageState: ... }) ที่นี่

  test.fixme("เปิด /account แล้วถูกส่งไปหน้า login", async ({ page }) => {
    // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });
});
