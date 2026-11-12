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
test("loginPage login เป็นผู้ดูแลระบบ", async ({ page, loginPage }) => {
  // เหมือนตัวอย่างที่ 1 แค่เปลี่ยนบัญชี: login(email, password) รับค่าเป็น parameter จึงไม่ต้องแก้ Page Object
  await loginPage.goto();
  await loginPage.login("admin@dnshop.test", "admin123");

  await expect(page).toHaveURL("/account");
  await expect(page.getByText("สิทธิ์: ผู้ดูแลระบบ")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: ใช้ cartPage.increase()
// แนวทาง: เตรียมเมาส์ไร้สาย p03 จำนวน 1 ด้วย API, cartPage.goto(), increase("เมาส์ไร้สาย") สองครั้ง
//        (method increase ใน pages/CartPage.ts เขียนไว้ให้แล้ว และรอให้จำนวนเพิ่มก่อนจบ จึงเรียกติดกันได้ อ่านเหตุผลในไฟล์นั้น)
//        ตรวจ cartPage.subtotal เป็น "1,770 บาท" (590 x 3)
// ------------------------------------------------
test("cartPage เพิ่มจำนวนสินค้า", async ({ page, cartPage }) => {
  const add = await page.request.post("/api/cart", { data: { productId: "p03", quantity: 1 } });
  expect(add.status()).toBe(201);

  await cartPage.goto();
  // เรียกติดกันได้เพราะ increase() รอให้จำนวนเพิ่มจริงก่อนจบ (ดูเหตุผลใน pages/CartPage.ts)
  await cartPage.increase("เมาส์ไร้สาย");
  await cartPage.increase("เมาส์ไร้สาย");

  // 590 x 3 = 1,770
  await expect(cartPage.subtotal).toHaveText("1,770 บาท");
});


// ------------------------------------------------
// ข้อ 3: เขียน CheckoutPage (pages/CheckoutPage.ts) แล้วใช้ผ่าน fixture checkoutPage
// แนวทาง: เติม goto() (เปิด "/checkout"), fillRecipient(name, address, phone) (กรอกสามช่อง)
//        ใน test: เตรียมแก้วกาแฟ p06 จำนวน 1 ด้วย API, checkoutPage.goto(), fillRecipient("สมชาย ใจดี", "99 ถนนสุขุมวิท กรุงเทพฯ", "0812345678")
//        ตรวจว่าช่องชื่อมีค่า "สมชาย ใจดี" (toHaveValue) และ checkoutPage.orderTotal เป็น "240 บาท" (190 + ส่งธรรมดา 50)
// ------------------------------------------------
test("checkoutPage กรอกข้อมูลผู้รับ", async ({ page, checkoutPage }) => {
  // เตรียมตะกร้าก่อนเปิด /checkout ถ้าตะกร้าว่างแอปจะส่งกลับ /cart
  const add = await page.request.post("/api/cart", { data: { productId: "p06", quantity: 1 } });
  expect(add.status()).toBe(201);

  await checkoutPage.goto();
  await checkoutPage.fillRecipient("สมชาย ใจดี", "99 ถนนสุขุมวิท กรุงเทพฯ", "0812345678");

  await expect(checkoutPage.nameInput).toHaveValue("สมชาย ใจดี");
  await expect(checkoutPage.phoneInput).toHaveValue("0812345678");
  // 190 + ค่าส่งธรรมดา 50 = 240 (ตัวเลือกเริ่มต้นคือส่งธรรมดา)
  await expect(checkoutPage.orderTotal).toHaveText("240 บาท");
});


// ------------------------------------------------
// ข้อ 4: สั่งซื้อให้จบด้วย checkoutPage
// แนวทาง: เติม placeOrderWith(payment) ใน CheckoutPage: selectOption ที่ paymentSelect ด้วยค่า payment, check() ช่อง acceptTerms
//        แล้วกด submitButton เตรียมตะกร้าเหมือนข้อ 3, fillRecipient แล้ว placeOrderWith("cod")
//        ตรวจ URL เป็น /orders/DN-0001 (หมายเลขคำสั่งซื้อแรกของ session นี้) และ heading "สั่งซื้อสำเร็จ"
// ------------------------------------------------
test("checkoutPage สั่งซื้อแบบเก็บเงินปลายทาง", async ({ page, checkoutPage }) => {
  await page.request.post("/api/cart", { data: { productId: "p06", quantity: 1 } });

  await checkoutPage.goto();
  await checkoutPage.fillRecipient("สมชาย ใจดี", "99 ถนนสุขุมวิท กรุงเทพฯ", "0812345678");
  // ใช้ cod เพราะ card ต้องยืนยันบัตรใน iframe (บท 29) ซึ่งไม่ใช่เป้าหมายของข้อนี้
  await checkoutPage.placeOrderWith("cod");

  // หมายเลขแรกของ session ใหม่คือ DN-0001 (หมายเลขแยกตาม session และ test นี้มี session เป็นของตัวเอง)
  await expect(page).toHaveURL("/orders/DN-0001");
  await expect(page.getByRole("heading", { name: "สั่งซื้อสำเร็จ" })).toBeVisible();
  await expect(page.getByText("ยอดสุทธิ")).toContainText("240 บาท");
});


// ------------------------------------------------
// ข้อ 5: ใช้ worker fixture catalog (ข้อมูลสินค้าที่อ่านอย่างเดียว) คำนวณยอดที่คาดหวัง
// แนวทาง: ขอ catalog ใน argument ใช้ catalog.find((p) => p.id === "p03") หาเมาส์ (เช็คว่าเจอก่อน ด้วย expect(item).toBeDefined())
//        เตรียมเมาส์จำนวน 2 ด้วย API แล้ว cartPage.goto() ตรวจ cartPage.subtotal
//        ค่าที่คาดหวังคำนวณจาก item.price * 2 แล้วจัดรูปแบบด้วย `${(item.price * 2).toLocaleString("en-US")} บาท` (ต้องได้ "1,180 บาท")
// ------------------------------------------------
test("ใช้ catalog คำนวณยอดรวมที่คาดหวัง", async ({ page, cartPage, catalog }) => {
  // catalog ถูกโหลดครั้งเดียวต่อ worker (ไม่เสียเวลาดึงใหม่ในทุก test) และเป็นข้อมูลอ่านอย่างเดียว
  const mouse = catalog.find((p) => p.id === "p03");
  // find อาจคืน undefined: ตรวจให้ชัดก่อน แล้วค่อยใช้ (ถ้าไม่เจอ test จะ fail ที่บรรทัดนี้ ไม่ใช่ error ประหลาดทีหลัง)
  expect(mouse).toBeDefined();
  const price = mouse!.price;

  const add = await page.request.post("/api/cart", { data: { productId: "p03", quantity: 2 } });
  expect(add.status()).toBe(201);

  await cartPage.goto();
  // ค่าที่คาดหวังมาจากข้อมูลจริงของแอป ไม่ได้พิมพ์ตัวเลขตายตัวใน test (590 x 2 = 1,180)
  // toLocaleString("en-US") ใส่เครื่องหมายคั่นหลักพันเป็นจุลภาค ตรงกับรูปแบบที่หน้าเว็บแสดง
  await expect(cartPage.subtotal).toHaveText(`${(price * 2).toLocaleString("en-US")} บาท`);
});
