import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 49: globalSetup และค่าตั้งค่าจาก .env
// ฝึก: globalSetup/globalTeardown, process.env, .env, loadEnvFile
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// รันด้วย: pnpm test --config lessons/49-global-setup-env/playwright.config.ts
// ================================================

// แนวคิด: ก่อน test ทั้งหมด global-setup.ts login ผ่าน API แล้วเก็บสถานะไว้ให้ทุก test ใช้
// ส่วนอีเมลและรหัสผ่านมาจาก process.env ซึ่ง playwright.config.ts โหลดจากไฟล์ .env (ถ้ามี) หรือใช้ค่า fallback
// ในไฟล์ test นี้ไม่มีโค้ด login เลย


// ------------------------------------------------
// ตัวอย่างที่ 1: login ค้างอยู่แล้วตั้งแต่เริ่ม และอีเมลตรงกับค่าใน env
// ------------------------------------------------
test("หน้าบัญชีแสดงอีเมลจาก process.env", async ({ page }) => {
  await page.goto("/account");

  // ถ้าไม่ได้ login จะถูกส่งไป /login?next=%2Faccount แต่ test นี้อยู่ที่ /account
  await expect(page).toHaveURL("/account");
  await expect(page.getByText(`อีเมล: ${process.env.DN_USER_EMAIL}`)).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: ตะกร้าเริ่มว่างทุก test (global-setup ตัด dn_sid ทิ้งก่อนบันทึก)
// ------------------------------------------------
test("login แล้วแต่ตะกร้าว่าง", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("cart-count")).toHaveText("0");
  await expect(page.getByRole("link", { name: "บัญชีของฉัน" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: login ผ่านหน้าเว็บด้วยค่าจาก env
// แนวทาง: ใช้ test.use({ storageState: { cookies: [], origins: [] } }) ในกลุ่มของตัวเอง เพื่อเริ่มโดยยังไม่ login
//        goto("/login") กรอก label "อีเมล" ด้วย process.env.DN_USER_EMAIL และ "รหัสผ่าน" ด้วย process.env.DN_USER_PASSWORD
//        (ค่าเป็น string | undefined จึงใส่ ?? "" ให้ fill) กดปุ่ม "เข้าสู่ระบบ" แล้วตรวจว่า URL เป็น /account
// ------------------------------------------------
test.describe("login ด้วยค่าจาก env", () => {
  // 👉 ใส่ test.use({ storageState: ... }) ที่นี่

  test.fixme("เข้าสู่ระบบด้วยบัญชีใน env", async ({ page }) => {
    // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });
});


// ------------------------------------------------
// ข้อ 2: รหัสผ่านผิด (ต่อท้ายค่าใน env ด้วยตัวอักษรเพิ่ม)
// แนวทาง: เริ่มโดยยังไม่ login เหมือนข้อ 1 กรอก label "รหัสผ่าน" ด้วย `${process.env.DN_USER_PASSWORD}x`
//        กดปุ่ม "เข้าสู่ระบบ" แล้วตรวจ page.getByRole("alert").filter({ hasText: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" })
//        (ใช้ filter เพราะ Next.js มี role="alert" ว่างๆ อยู่ทุกหน้า บทก่อนๆ อธิบายไว้แล้ว)
// ------------------------------------------------
test.describe("login ผิดด้วยค่าจาก env", () => {
  // 👉 ใส่ test.use({ storageState: ... }) ที่นี่

  test.fixme("รหัสผ่านผิดแล้วเห็นข้อความแจ้ง", async ({ page }) => {
    // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });
});


// ------------------------------------------------
// ข้อ 3: อ่านไฟล์สถานะที่ global-setup เขียน
// แนวทาง: เพิ่ม import fs และ path จาก "node:fs" และ "node:path" ที่ด้านบนของไฟล์
//        ต่อ path ด้วย path.join(import.meta.dirname, ".auth", "user.json") แล้วอ่านด้วย fs.readFileSync(ไฟล์, "utf8")
//        JSON.parse ได้ object ที่มี cookies ตรวจว่ามี cookie ชื่อ dn_auth (ใช้ .map((c) => c.name) กับ toContain)
//        และไม่มี dn_sid (not.toContain) ข้อนี้ไม่ใช้ page เลย
// ------------------------------------------------
test.fixme("ไฟล์สถานะมี dn_auth และไม่มี dn_sid", async () => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
