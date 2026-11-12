import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { CartPage } from "./pages/CartPage";

// ================================================
// บทที่ 38: Page Object Model (เขียน class แทนหน้าเว็บ)
// ฝึก: class ที่เก็บ locator และ action ของหน้า, constructor รับ page, readonly locator, ใช้ซ้ำหลาย test
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// แนวคิด: ถ้า test หลายตัวต้อง login ทุกตัวเขียน getByLabel("อีเมล").fill(...) ซ้ำกัน
// พอหน้า login เปลี่ยน (เช่น เปลี่ยน label) ต้องไล่แก้ทุก test
// Page Object คือ class ที่รวม locator และ action ของ "หนึ่งหน้า" ไว้ที่เดียว (ดูไฟล์ pages/LoginPage.ts)
// test เหลือแค่บอกว่า "ทำอะไร" และ "ตรวจอะไร" ส่วน "ทำอย่างไร" อยู่ใน class
// หมายเหตุ: Page Object ไม่ใส่ expect ตรวจผลของ test (ยกเว้นเงื่อนไขรอให้พร้อมใช้งาน) การตัดสินว่าผ่านหรือไม่เป็นหน้าที่ของ test


// ------------------------------------------------
// ตัวอย่างที่ 1: login สำเร็จด้วย LoginPage
// ------------------------------------------------
test("login ด้วย LoginPage แล้วไปหน้าบัญชีของฉัน", async ({ page }) => {
  // สร้าง Page Object โดยส่ง page ของ test นี้เข้าไป (หนึ่ง test หนึ่งตัว)
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("user@dnshop.test", "password123");

  // ตรวจผลอยู่ใน test เอง ไม่ได้ซ่อนไว้ใน class
  await expect(page).toHaveURL("/account");
  await expect(page.getByRole("heading", { name: "บัญชีของฉัน" })).toBeVisible();
  await expect(page.getByText("ชื่อ: สมชาย ใจดี")).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: login ผิด ใช้ locator ที่ class เตรียมไว้
// ------------------------------------------------
test("login ด้วยรหัสผ่านผิดแล้วเห็นข้อความ error", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("user@dnshop.test", "wrong-password");

  // errorMessage() คืน locator ของ alert ที่มีข้อความนี้ (Next.js มี alert ว่างๆ อยู่ทุกหน้า จึงต้อง filter ด้วยข้อความ)
  await expect(loginPage.errorMessage("อีเมลหรือรหัสผ่านไม่ถูกต้อง")).toBeVisible();
  // ยังอยู่ที่หน้า login
  await expect(page).toHaveURL(/\/login/);
});


// ------------------------------------------------
// ข้อ 1: login เป็นผู้ดูแลระบบด้วย LoginPage
// แนวทาง: เหมือนตัวอย่างที่ 1 แต่ใช้ admin@dnshop.test / admin123
//        ตรวจว่า URL เป็น /account และ "สิทธิ์: ผู้ดูแลระบบ" ขึ้นบนหน้า
// ------------------------------------------------
test.fixme("login เป็นผู้ดูแลระบบด้วย LoginPage", async ({ page }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: เขียน method goto() ของ CartPage แล้วใช้ใน test
// แนวทาง: เปิด pages/CartPage.ts แก้ method goto() ให้เปิดหน้า "/cart" (เหมือน goto() ของ LoginPage)
//        ใน test: เตรียมตะกร้าด้วย page.request.post("/api/cart", { data: { productId: "p01", quantity: 2 } }) (บท 37)
//        แล้ว cartPage.goto() ตรวจ cartPage.items มี 1 รายการ และ cartPage.subtotal เป็น "2,580 บาท"
// ------------------------------------------------
test.fixme("CartPage.goto() เปิดตะกร้าที่เตรียมด้วย API", async ({ page }) => {
  // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: เขียน method applyCoupon(code) ของ CartPage
// แนวทาง: ใน CartPage.ts กรอก this.couponInput ด้วย code แล้วกด this.applyCouponButton
//        ใน test: เตรียมตะกร้าหูฟัง p01 จำนวน 1 ด้วย API, goto(), applyCoupon("DN10")
//        ตรวจ cartPage.discount เป็น "129 บาท" และ cartPage.total เป็น "1,161 บาท"
// ------------------------------------------------
test.fixme("CartPage.applyCoupon() ใช้โค้ด DN10", async ({ page }) => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 4: เขียน method remove(productName) ของ CartPage
// แนวทาง: ปุ่ม "ลบ" จะเปิด dialog confirm (บท 25) ต้องดักด้วย page.once("dialog", ...) แล้ว accept() "ก่อน" กดปุ่ม
//        หารายการสินค้าด้วย this.items.filter({ hasText: productName }) (บท 16) แล้วกดปุ่ม "ลบ" ในรายการนั้น
//        ใน test: เตรียมเมาส์ p03 กับแก้วกาแฟ p06 อย่างละ 1 ชิ้น goto(), remove("แก้วกาแฟเซรามิก")
//        ตรวจว่า cartPage.items เหลือ 1 รายการ และมีข้อความ "เมาส์ไร้สาย"
// ------------------------------------------------
test.fixme("CartPage.remove() ลบสินค้าออกจากตะกร้า", async ({ page }) => {
  // 👉 เขียน test ของข้อ 4 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 5: เขียน method increase(productName) แล้วต่อยอดเป็น flow
// แนวทาง: กดปุ่ม "เพิ่มจำนวน" ในรายการของสินค้านั้นหนึ่งครั้ง
//        ใน test: เตรียมเมาส์ p03 จำนวน 1, goto(), increase("เมาส์ไร้สาย") สองครั้ง
//        ตรวจว่า cartPage.subtotal เป็น "1,770 บาท" (590 x 3) แล้ว applyCoupon("DN10") ตรวจ cartPage.total เป็น "1,593 บาท"
// ------------------------------------------------
test.fixme("CartPage.increase() แล้วใช้โค้ดส่วนลดต่อ", async ({ page }) => {
  // 👉 เขียน test ของข้อ 5 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
