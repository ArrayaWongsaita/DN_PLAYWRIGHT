import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 15: Debug test ทีละขั้น
// ฝึก: --debug (Playwright Inspector), page.pause(), VS Code extension (breakpoint, Pick locator)
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================
//
// รูปแบบของบทนี้ไม่เหมือนบทอื่น:
//   - ตัวอย่างที่ 1 เป็น test ที่ผ่าน ไว้ฝึกใช้เครื่องมือ debug กับ test ที่ไม่มีอะไรพัง
//   - ข้อ 1–3 บน main เป็น test ที่ "ตั้งใจให้พัง" อยู่ใน test.fixme ให้ผู้เรียนเดินดูด้วย --debug หรือ VS Code
//     ไฟล์นี้ (branch solutions) คือฉบับที่แก้แล้ว ทุกข้อมีคอมเมนต์ "สาเหตุ" ที่จะเห็นเมื่อเดินทีละขั้น และ "วิธีแก้"


// ------------------------------------------------
// ตัวอย่างที่ 1: test ที่ผ่าน ไว้ฝึกเดินทีละขั้นด้วย Inspector
// (รัน: pnpm test 15-debugging -g "ตัวอย่างที่ 1" --debug)
// ------------------------------------------------
test("ตัวอย่างที่ 1: เข้าสู่ระบบแล้วไปหน้าบัญชีของฉัน", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("user@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("password123");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByRole("heading", { name: "บัญชีของฉัน" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1 (เฉลย): ใช้โค้ด DN10 กับหูฟัง 1 ชิ้นแล้วยอดสุทธิต้องเป็น 1,161 บาท
// ------------------------------------------------
// สาเหตุ: เดินทีละขั้นแล้วหน้าตะกร้าตอนใช้โค้ดคือ "ตะกร้าของคุณยังว่างอยู่" (test เดิมไม่เคยเพิ่มสินค้า)
//        เพราะแต่ละ test เริ่มด้วยตะกร้าว่าง ยอดสุทธิจึงเป็น 0 บาท (Received: "0 บาท")
// วิธีแก้: ก่อนเปิดหน้า /cart ต้องใส่หูฟังลงตะกร้าก่อน และรอข้อความยืนยันให้เซิร์ฟเวอร์รับของแล้วจริง
test("ข้อ 1: ใช้โค้ด DN10 กับหูฟัง 1 ชิ้นแล้วยอดสุทธิต้องเป็น 1,161 บาท", async ({ page }) => {
  await page.goto("/products/p01");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" })).toBeVisible();

  await page.goto("/cart");
  await page.getByLabel("โค้ดส่วนลด").fill("DN10");
  await page.getByRole("button", { name: "ใช้โค้ด" }).click();
  // 1,290 - 10% (129) = 1,161
  await expect(page.getByTestId("total")).toHaveText("1,161 บาท");
});


// ------------------------------------------------
// ข้อ 2 (เฉลย): หน้า /register กรอกอีเมลในช่องอีเมล
// ------------------------------------------------
// สาเหตุ: เมื่อ test หยุดที่บรรทัด fill ใน Inspector (หรือดู error) จะเห็นว่า getByLabel("อีเมล") ตรงกับ 2 element:
//        ช่องกรอกอีเมล และ checkbox "รับข่าวสารทางอีเมล" (ชื่อมีคำว่า "อีเมล" อยู่ด้วย) เกิด strict mode violation
//        Pick locator ชี้ที่ช่องอีเมลแล้วได้ getByRole('textbox', { name: 'อีเมล' }) ซึ่งตรงกับช่องเดียว
// วิธีแก้: ใช้ role textbox แทน getByLabel (หรือจะใช้ getByLabel("อีเมล", { exact: true }) ก็ได้)
test("ข้อ 2: หน้า /register กรอกอีเมลในช่องอีเมล", async ({ page }) => {
  await page.goto("/register");
  const email = page.getByRole("textbox", { name: "อีเมล" });
  await email.fill("somchai@example.com");
  await expect(email).toHaveValue("somchai@example.com");
});


// ------------------------------------------------
// ข้อ 3 (เฉลย): เข้าสู่ระบบแล้วต้องไปหน้า /account
// ------------------------------------------------
// สาเหตุ: ตอนหยุดที่ page.pause() หน้ายังเป็น /login และมีข้อความ "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
//        เพราะรหัสผ่านใน test พิมพ์ผิด (password12 ขาดเลข 3 ตัวท้าย) ที่ถูกคือ password123
// วิธีแก้: แก้รหัสผ่าน และลบ page.pause() ออก (ห้ามทิ้งไว้ใน test ที่ส่งเข้า repo)
test("ข้อ 3: เข้าสู่ระบบแล้วต้องไปหน้า /account", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("user@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("password123");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL("/account");
});
