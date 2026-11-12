import { test, expect } from "./fixtures";

// ================================================
// บทที่ 40: Page Object + fixture ใช้ร่วมกัน
// ฝึก: ส่ง Page Object ให้ test ผ่าน fixture, worker fixture สำหรับข้อมูลที่อ่านอย่างเดียว
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// แนวคิด: บท 38 ต้องเขียน new LoginPage(page) ใน test ทุกตัว บท 39 สอนให้ fixture เตรียมของให้ test
// บทนี้เอาสองอย่างมารวมกัน: fixtures.ts สร้าง Page Object ให้ test ขอได้ใน argument ได้เลย
//   test("...", async ({ loginPage, cartPage }) => { ... })
// และมี worker fixture ชื่อ catalog (รายการสินค้าอ่านอย่างเดียว) ที่โหลดครั้งเดียวต่อ worker
// ไฟล์ที่เกี่ยวข้อง: fixtures.ts และ pages/LoginPage.ts, pages/CartPage.ts, pages/CheckoutPage.ts


// ------------------------------------------------
// ตัวอย่างที่ 1: ขอ loginPage จาก fixture
// ------------------------------------------------
test("loginPage จาก fixture login สำเร็จ", async ({ page, loginPage }) => {
  // ไม่ต้อง new LoginPage(page) เอง fixture ทำให้แล้ว (และใช้ page ตัวเดียวกับที่ test ได้รับ)
  await loginPage.goto();
  await loginPage.login("user@dnshop.test", "password123");

  await expect(page).toHaveURL("/account");
  await expect(page.getByText("ชื่อ: สมชาย ใจดี")).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: ขอ cartPage จาก fixture แล้วใช้โค้ดส่วนลด
// ------------------------------------------------
test("cartPage จาก fixture ใช้โค้ด DN10 กับตะกร้าที่เตรียมด้วย API", async ({ page, cartPage }) => {
  // เตรียมตะกร้าด้วย API (บท 37): หูฟัง p01 จำนวน 1
  const add = await page.request.post("/api/cart", { data: { productId: "p01", quantity: 1 } });
  expect(add.status()).toBe(201);

  await cartPage.goto();
  await cartPage.applyCoupon("DN10");

  // ลด 10% ของ 1,290 = 129
  await expect(cartPage.discount).toHaveText("129 บาท");
  await expect(cartPage.total).toHaveText("1,161 บาท");
});


// ------------------------------------------------
// ข้อ 1: login เป็นผู้ดูแลระบบด้วย loginPage
// แนวทาง: เหมือนตัวอย่างที่ 1 แต่ใช้ admin@dnshop.test / admin123 ตรวจว่า "สิทธิ์: ผู้ดูแลระบบ" ขึ้นบนหน้า /account
// ------------------------------------------------
test.fixme("loginPage login เป็นผู้ดูแลระบบ", async ({ page, loginPage }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: ใช้ cartPage.increase()
// แนวทาง: เตรียมเมาส์ไร้สาย p03 จำนวน 1 ด้วย API, cartPage.goto(), increase("เมาส์ไร้สาย") สองครั้ง
//        ตรวจ cartPage.subtotal เป็น "1,770 บาท" (590 x 3)
// ------------------------------------------------
test.fixme("cartPage เพิ่มจำนวนสินค้า", async ({ page, cartPage }) => {
  // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: เขียน CheckoutPage (pages/CheckoutPage.ts) แล้วใช้ผ่าน fixture checkoutPage
// แนวทาง: เติม goto() (เปิด "/checkout"), fillRecipient(name, address, phone) (กรอกสามช่อง)
//        ใน test: เตรียมแก้วกาแฟ p06 จำนวน 1 ด้วย API, checkoutPage.goto(), fillRecipient("สมชาย ใจดี", "99 ถนนสุขุมวิท กรุงเทพฯ", "0812345678")
//        ตรวจว่าช่องชื่อมีค่า "สมชาย ใจดี" (toHaveValue) และ checkoutPage.orderTotal เป็น "240 บาท" (190 + ส่งธรรมดา 50)
// ------------------------------------------------
test.fixme("checkoutPage กรอกข้อมูลผู้รับ", async ({ page, checkoutPage }) => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 4: สั่งซื้อให้จบด้วย checkoutPage
// แนวทาง: เติม placeOrderWith(payment) ใน CheckoutPage: selectOption ที่ paymentSelect ด้วยค่า payment, check() ช่อง acceptTerms
//        แล้วกด submitButton เตรียมตะกร้าเหมือนข้อ 3, fillRecipient แล้ว placeOrderWith("cod")
//        ตรวจ URL เป็น /orders/DN-0001 (หมายเลขคำสั่งซื้อแรกของ session นี้) และ heading "สั่งซื้อสำเร็จ"
// ------------------------------------------------
test.fixme("checkoutPage สั่งซื้อแบบเก็บเงินปลายทาง", async ({ page, checkoutPage }) => {
  // 👉 เขียน test ของข้อ 4 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 5: ใช้ worker fixture catalog (ข้อมูลสินค้าที่อ่านอย่างเดียว) คำนวณยอดที่คาดหวัง
// แนวทาง: ขอ catalog ใน argument ใช้ catalog.find((p) => p.id === "p03") หาเมาส์ (เช็คว่าเจอก่อน ด้วย expect(item).toBeDefined())
//        เตรียมเมาส์จำนวน 2 ด้วย API แล้ว cartPage.goto() ตรวจ cartPage.subtotal
//        ค่าที่คาดหวังคำนวณจาก item.price * 2 แล้วจัดรูปแบบด้วย `${(item.price * 2).toLocaleString("en-US")} บาท` (ต้องได้ "1,180 บาท")
// ------------------------------------------------
test.fixme("ใช้ catalog คำนวณยอดรวมที่คาดหวัง", async ({ page, cartPage, catalog }) => {
  // 👉 เขียน test ของข้อ 5 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
