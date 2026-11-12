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
test("login เป็นผู้ดูแลระบบด้วย LoginPage", async ({ page }) => {
  // เหตุผลที่ข้อนี้ไม่ต้องแก้ LoginPage เลย: login(email, password) รับค่าเป็น parameter จึงใช้กับบัญชีไหนก็ได้
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("admin@dnshop.test", "admin123");

  await expect(page).toHaveURL("/account");
  await expect(page.getByText("สิทธิ์: ผู้ดูแลระบบ")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: เขียน method goto() ของ CartPage แล้วใช้ใน test
// แนวทาง: เปิด pages/CartPage.ts แก้ method goto() ให้เปิดหน้า "/cart" (เหมือน goto() ของ LoginPage)
//        ใน test: เตรียมตะกร้าด้วย page.request.post("/api/cart", { data: { productId: "p01", quantity: 2 } }) (บท 37)
//        แล้ว cartPage.goto() ตรวจ cartPage.items มี 1 รายการ และ cartPage.subtotal เป็น "2,580 บาท"
// ------------------------------------------------
test("CartPage.goto() เปิดตะกร้าที่เตรียมด้วย API", async ({ page }) => {
  // เตรียมด้วย API ก่อน goto เสมอ เพราะหน้า /cart อ่านตะกร้าตอนโหลดหน้า (บท 37)
  const add = await page.request.post("/api/cart", { data: { productId: "p01", quantity: 2 } });
  expect(add.status()).toBe(201);

  const cartPage = new CartPage(page);
  await cartPage.goto();

  // test ใช้ locator จาก Page Object (items, subtotal) ไม่ต้องเขียน getByRole/getByTestId เอง
  await expect(cartPage.items).toHaveCount(1);
  await expect(cartPage.subtotal).toHaveText("2,580 บาท");
});


// ------------------------------------------------
// ข้อ 3: เขียน method applyCoupon(code) ของ CartPage
// แนวทาง: ใน CartPage.ts กรอก this.couponInput ด้วย code แล้วกด this.applyCouponButton
//        ใน test: เตรียมตะกร้าหูฟัง p01 จำนวน 1 ด้วย API, goto(), applyCoupon("DN10")
//        ตรวจ cartPage.discount เป็น "129 บาท" และ cartPage.total เป็น "1,161 บาท"
// ------------------------------------------------
test("CartPage.applyCoupon() ใช้โค้ด DN10", async ({ page }) => {
  await page.request.post("/api/cart", { data: { productId: "p01", quantity: 1 } });

  const cartPage = new CartPage(page);
  await cartPage.goto();
  await cartPage.applyCoupon("DN10");

  // ผลที่ตรวจอยู่ใน test: ลด 10% ของ 1,290 = 129 และยอดสุทธิ 1,290 - 129 = 1,161
  // expect รอจนค่าอัปเดต (retry) จึงไม่ต้องรอเองหลังกดปุ่ม
  await expect(cartPage.discount).toHaveText("129 บาท");
  await expect(cartPage.total).toHaveText("1,161 บาท");
});


// ------------------------------------------------
// ข้อ 4: เขียน method remove(productName) ของ CartPage
// แนวทาง: ปุ่ม "ลบ" จะเปิด dialog confirm (บท 25) ต้องดักด้วย page.once("dialog", ...) แล้ว accept() "ก่อน" กดปุ่ม
//        หารายการสินค้าด้วย this.items.filter({ hasText: productName }) (บท 16) แล้วกดปุ่ม "ลบ" ในรายการนั้น
//        ใน test: เตรียมเมาส์ p03 กับแก้วกาแฟ p06 อย่างละ 1 ชิ้น goto(), remove("แก้วกาแฟเซรามิก")
//        ตรวจว่า cartPage.items เหลือ 1 รายการ และมีข้อความ "เมาส์ไร้สาย"
// ------------------------------------------------
test("CartPage.remove() ลบสินค้าออกจากตะกร้า", async ({ page }) => {
  await page.request.post("/api/cart", { data: { productId: "p03", quantity: 1 } });
  await page.request.post("/api/cart", { data: { productId: "p06", quantity: 1 } });

  const cartPage = new CartPage(page);
  await cartPage.goto();
  await expect(cartPage.items).toHaveCount(2);

  // เรื่อง dialog ถูกซ่อนไว้ใน remove() แล้ว test จึงอ่านเป็นเจตนา: "ลบแก้วกาแฟ"
  await cartPage.remove("แก้วกาแฟเซรามิก");

  await expect(cartPage.items).toHaveCount(1);
  await expect(cartPage.items).toContainText("เมาส์ไร้สาย");
});


// ------------------------------------------------
// ข้อ 5: เขียน method increase(productName) แล้วต่อยอดเป็น flow
// แนวทาง: กดปุ่ม "เพิ่มจำนวน" ในรายการของสินค้านั้นหนึ่งครั้ง และให้ method รอจนช่อง "จำนวน" ของรายการนั้นเพิ่มขึ้นก่อนจบ
//        (เราลองกดสองครั้งติดกันโดยไม่รอ แล้วล้มบางรอบ: ครั้งที่สองอาจอ่านจำนวนเก่า)
//        ใน test: เตรียมเมาส์ p03 จำนวน 1, goto(), increase("เมาส์ไร้สาย") สองครั้ง
//        ตรวจว่า cartPage.subtotal เป็น "1,770 บาท" (590 x 3) แล้ว applyCoupon("DN10") ตรวจ cartPage.total เป็น "1,593 บาท"
// ------------------------------------------------
test("CartPage.increase() แล้วใช้โค้ดส่วนลดต่อ", async ({ page }) => {
  await page.request.post("/api/cart", { data: { productId: "p03", quantity: 1 } });

  const cartPage = new CartPage(page);
  await cartPage.goto();
  // เรียกติดกันได้ เพราะ increase() รอให้จำนวนเพิ่มจริงก่อนจบ (ดูเหตุผลใน CartPage.ts)
  await cartPage.increase("เมาส์ไร้สาย");
  await cartPage.increase("เมาส์ไร้สาย");

  // 590 x 3 = 1,770
  await expect(cartPage.subtotal).toHaveText("1,770 บาท");

  // method หลายตัวต่อกันเป็น flow ได้ ลด 10% ของ 1,770 = 177 (ปัดเศษแล้ว) ยอดสุทธิ 1,593
  await cartPage.applyCoupon("DN10");
  await expect(cartPage.total).toHaveText("1,593 บาท");
});
