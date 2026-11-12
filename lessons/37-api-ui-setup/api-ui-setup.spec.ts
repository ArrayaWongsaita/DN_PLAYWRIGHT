import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 37: เตรียมข้อมูลผ่าน API แล้วตรวจบนหน้าเว็บ
// ฝึก: page.request (cookie ร่วมกับหน้าเว็บ), เตรียมตะกร้า/คำสั่งซื้อ/login ด้วย API แล้ว goto ไปตรวจ
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// แนวคิด: test ที่ตรวจ "หน้าตะกร้า" ไม่จำเป็นต้องเสียเวลาคลิกเลือกสินค้าทีละชิ้นบนหน้า products
// ให้ใช้ API เตรียมตะกร้าให้เสร็จ (เร็วและนิ่ง) แล้วค่อยเปิดหน้าที่เราต้องการตรวจจริงๆ
// page.request คือตัวส่งคำขอ API ที่ "ใช้ cookie ชุดเดียวกับหน้าเว็บ" (cookie dn_sid และ dn_auth)
// สิ่งที่ API เตรียมไว้ใน session นี้ หน้าเว็บจึงเห็นด้วย


// ------------------------------------------------
// ตัวอย่างที่ 1: เตรียมตะกร้าด้วย API แล้วเปิดหน้า /cart ตรวจยอด
// ------------------------------------------------
test("เตรียมตะกร้าด้วย API แล้วหน้า /cart แสดงสินค้าและยอดตรงกัน", async ({ page }) => {
  // เพิ่มหูฟัง (p01 ราคา 1,290) จำนวน 2 ชิ้นผ่าน API ไม่ต้องเปิดหน้า products เลย
  const add = await page.request.post("/api/cart", { data: { productId: "p01", quantity: 2 } });
  // ตรวจว่า API เตรียมสำเร็จ (201) ถ้าขั้นเตรียมพังจะได้รู้ทันที ไม่ใช่ไปพังที่การตรวจหน้า
  expect(add.status()).toBe(201);

  // เปิดหน้า /cart: คำขอนี้ส่ง cookie dn_sid เดียวกับที่ page.request ได้รับ จึงเห็นตะกร้าที่เตรียมไว้
  await page.goto("/cart");

  // ตรวจสิ่งที่ผู้ใช้เห็นบนหน้า
  const items = page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem");
  await expect(items).toHaveCount(1);
  await expect(items).toContainText("หูฟังไร้สาย DN Buds");
  // ยอดรวมของสินค้า: 1,290 x 2
  await expect(page.getByTestId("subtotal")).toHaveText("2,580 บาท");
});


// ------------------------------------------------
// ตัวอย่างที่ 2: เตรียมคำสั่งซื้อด้วย API แล้วตรวจประวัติที่ /account
// ------------------------------------------------
test("สร้างคำสั่งซื้อด้วย API แล้วเห็นในประวัติของ /account", async ({ page }) => {
  // 1) เตรียมตะกร้า (เมาส์ไร้สาย 1 ชิ้น)
  await page.request.post("/api/cart", { data: { productId: "p03", quantity: 1 } });

  // 2) สั่งซื้อ ส่งข้อมูลผู้รับ วิธีจัดส่ง และวิธีชำระเงิน (เก็บเงินปลายทางไม่ต้องยืนยันบัตร) ได้ 201 พร้อมหมายเลขคำสั่งซื้อ
  const orderRes = await page.request.post("/api/orders", {
    data: {
      customer: { name: "สมชาย ใจดี", address: "99 ถนนสุขุมวิท กรุงเทพฯ", phone: "0812345678" },
      shipping: "standard",
      payment: "cod",
    },
  });
  expect(orderRes.status()).toBe(201);
  const order = await orderRes.json();
  // คำสั่งซื้อแรกของ session นี้ได้เลข DN-0001 (หมายเลขแยกตาม session)
  expect(order.id).toBe("DN-0001");

  // 3) หน้า /account ต้อง login ก่อน: login ผ่าน API เช่นกัน cookie dn_auth ที่ได้จะอยู่ใน context ของหน้าเว็บด้วย
  const login = await page.request.post("/api/auth/login", {
    data: { email: "user@dnshop.test", password: "password123" },
  });
  await expect(login).toBeOK();

  await page.goto("/account");

  // หน้าแสดงประวัติคำสั่งซื้อที่เราสร้างด้วย API (ลิงก์ชื่อเป็นหมายเลขคำสั่งซื้อ)
  await expect(page.getByRole("heading", { name: "ประวัติคำสั่งซื้อ" })).toBeVisible();
  await page.getByRole("link", { name: "DN-0001" }).click();
  // ลิงก์พาไปหน้ารายละเอียดของคำสั่งซื้อนั้น
  await expect(page.getByRole("heading", { name: "สั่งซื้อสำเร็จ" })).toBeVisible();
  await expect(page.getByText("หมายเลขคำสั่งซื้อ: DN-0001")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: เตรียมตะกร้าสองรายการแล้วตรวจที่ /cart
// แนวทาง: เหมือนตัวอย่างที่ 1 แต่ POST /api/cart สองครั้ง: เมาส์ไร้สาย p03 จำนวน 1 และแก้วกาแฟเซรามิก p06 จำนวน 2
//        เปิด /cart ตรวจว่ามี 2 รายการ (toHaveCount(2)) และ data-testid="subtotal" เป็น "970 บาท" (590 + 190 x 2)
// ------------------------------------------------
test("เตรียมตะกร้าสองรายการด้วย API แล้วตรวจยอดรวม", async ({ page }) => {
  // เตรียมด้วย API ทีละรายการ แต่ละครั้งใช้เวลาไม่กี่มิลลิวินาที (ถ้าทำผ่านหน้าเว็บต้องรอโหลดรายการ หาการ์ด และกดปุ่มทีละชิ้น)
  const first = await page.request.post("/api/cart", { data: { productId: "p03", quantity: 1 } });
  const second = await page.request.post("/api/cart", { data: { productId: "p06", quantity: 2 } });
  // ตรวจขั้นเตรียมว่าสำเร็จจริง ไม่งั้น test จะพังที่ปลายทางด้วยข้อความที่ไม่บอกต้นเหตุ
  expect(first.status()).toBe(201);
  expect(second.status()).toBe(201);

  await page.goto("/cart");

  await expect(page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem")).toHaveCount(2);
  // 590 + 190 x 2 = 970
  await expect(page.getByTestId("subtotal")).toHaveText("970 บาท");
});


// ------------------------------------------------
// ข้อ 2: เตรียมโค้ดส่วนลดด้วย API
// แนวทาง: เตรียมตะกร้าแบบข้อ 1 แล้ว POST /api/cart/coupon ด้วย data: { code: "DN10" } (ตรวจว่าได้ 200)
//        เปิด /cart ตรวจ data-testid ของ "discount" เป็น "97 บาท" และ "total" เป็น "873 บาท" (ลด 10% ของ 970 ปัดเป็น 97)
// ------------------------------------------------
test("ใช้โค้ดส่วนลด DN10 ด้วย API แล้วหน้า /cart แสดงยอดหลังหักส่วนลด", async ({ page }) => {
  await page.request.post("/api/cart", { data: { productId: "p03", quantity: 1 } });
  await page.request.post("/api/cart", { data: { productId: "p06", quantity: 2 } });

  // โค้ดส่วนลดเก็บไว้ที่ session เหมือนตะกร้า จึงเตรียมด้วย API ได้ ไม่ต้องไปพิมพ์ในช่องโค้ดบนหน้าเว็บ
  const coupon = await page.request.post("/api/cart/coupon", { data: { code: "DN10" } });
  expect(coupon.status()).toBe(200);

  await page.goto("/cart");

  // ส่วนลด = ปัดเศษ(970 x 10%) = 97 และยอดสุทธิ = 970 - 97 = 873
  await expect(page.getByTestId("discount")).toHaveText("97 บาท");
  await expect(page.getByTestId("total")).toHaveText("873 บาท");
});


// ------------------------------------------------
// ข้อ 3: สร้างคำสั่งซื้อที่ใช้ส่งด่วนและโค้ดส่วนลด แล้วตรวจที่หน้ารายละเอียดคำสั่งซื้อ
// แนวทาง: POST /api/cart หูฟัง p01 จำนวน 1, POST /api/cart/coupon ด้วย "DN10"
//        POST /api/orders ด้วย customer เหมือนตัวอย่างที่ 2 แต่ shipping: "express" ตรวจ 201
//        เปิด /orders/DN-0001 ตรวจ "ค่าจัดส่ง: 100 บาท" และ "ยอดสุทธิ" 1,261 บาท (1,290 - ส่วนลด 129 + ค่าส่ง 100)
//        (ข้อความยอดสุทธิอยู่ในย่อหน้าเดียวกับคำว่า "ยอดสุทธิ:" ใช้ getByText("ยอดสุทธิ") แล้ว toContainText("1,261 บาท"))
// ------------------------------------------------
test("สร้างคำสั่งซื้อส่งด่วนพร้อมส่วนลดด้วย API แล้วตรวจหน้าคำสั่งซื้อ", async ({ page }) => {
  await page.request.post("/api/cart", { data: { productId: "p01", quantity: 1 } });
  await page.request.post("/api/cart/coupon", { data: { code: "DN10" } });
  const orderRes = await page.request.post("/api/orders", {
    data: {
      customer: { name: "สมชาย ใจดี", address: "99 ถนนสุขุมวิท กรุงเทพฯ", phone: "0812345678" },
      shipping: "express",
      payment: "cod",
    },
  });
  expect(orderRes.status()).toBe(201);

  // session นี้เพิ่งสร้างคำสั่งซื้อแรก จึงเป็น DN-0001 (ถ้าไม่แน่ใจหมายเลข อ่านจาก (await orderRes.json()).id ก็ได้)
  await page.goto("/orders/DN-0001");

  await expect(page.getByRole("heading", { name: "สั่งซื้อสำเร็จ" })).toBeVisible();
  await expect(page.getByText("ค่าจัดส่ง: 100 บาท")).toBeVisible();
  // ยอดสุทธิ = 1,290 - 129 (ส่วนลด 10%) + 100 (ส่งด่วน) = 1,261 ใช้ toContainText เพราะข้อความอยู่ในย่อหน้าเดียวกับคำว่า "ยอดสุทธิ:"
  await expect(page.getByText("ยอดสุทธิ")).toContainText("1,261 บาท");
});


// ------------------------------------------------
// ข้อ 4: ใช้ API สร้างสถานการณ์ที่ทำผ่านหน้าเว็บได้ยาก แล้วตรวจพฤติกรรมของหน้า
// แนวทาง: หมอนอิงลายแมว (p07) มีสต็อก 5 ชิ้น POST /api/cart จำนวน 5 (ใช้สต็อกจนหมด โดยไม่ต้องกดปุ่ม 5 ครั้ง)
//        เปิด /products รอให้การ์ดหมอนอิงขึ้น (หน้าพร้อมกดแล้ว) กด "เพิ่มลงตะกร้า" ในการ์ดนั้น
//        ตรวจว่า alert (กรองด้วย hasText) แสดง "สินค้าในสต็อกไม่พอ" และ data-testid="cart-count" ยังเป็น "5"
// ------------------------------------------------
test("ตะกร้ามีสินค้าเต็มสต็อกจาก API แล้วกดเพิ่มบนหน้าต้องแจ้งสต็อกไม่พอ", async ({ page }) => {
  // หมอนอิง p07 มีสต็อก 5: เพิ่ม 5 ชิ้นผ่าน API ครั้งเดียว (ผ่านหน้าเว็บต้องกดปุ่ม 5 ครั้ง)
  const fill = await page.request.post("/api/cart", { data: { productId: "p07", quantity: 5 } });
  expect(fill.status()).toBe(201);

  await page.goto("/products");
  const card = page.getByRole("listitem").filter({ hasText: "หมอนอิงลายแมว" });
  // การ์ดขึ้นหลังหน้าดึงรายการเสร็จ แปลว่าหน้าพร้อมให้กดแล้ว (หน้านี้ผูกปุ่มหลังโหลดข้อมูล)
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();

  // API ตอบ 409 และหน้าแสดงข้อความของ server ใน alert (กรองด้วยข้อความเพราะมี alert ว่างของ Next.js ด้วย)
  await expect(page.getByRole("alert").filter({ hasText: "สินค้าในสต็อกไม่พอ" })).toBeVisible();
  // จำนวนในตะกร้าไม่เพิ่ม ยังเป็น 5 ตามที่เตรียมไว้
  await expect(page.getByTestId("cart-count")).toHaveText("5");
});


// ------------------------------------------------
// ข้อ 5: พิสูจน์ว่า fixture request กับ page.request ใช้ cookie คนละชุด
// แนวทาง: ใช้ fixture request (ตัวที่รับเป็น argument ของ test คู่กับ page) POST /api/cart เพิ่มหูฟัง p01 ตรวจว่าได้ 201
//        เปิด /cart ด้วย page ตรวจว่าเห็น "ตะกร้าของคุณยังว่างอยู่" (เพราะ session ไม่ใช่ใบเดียวกัน)
//        แล้วเพิ่มหูฟังด้วย page.request.post แล้ว page.reload() ตรวจว่าตะกร้าไม่ว่างแล้ว (รายการสินค้าในตะกร้ามี 1 รายการ)
// ------------------------------------------------
test("สิ่งที่เตรียมด้วย request fixture ไม่ถูกเห็นโดยหน้าเว็บ แต่ page.request เห็น", async ({ page, request }) => {
  // fixture request เป็น request context ของตัวเอง (cookie jar แยกจาก browser ของ page) จึงได้ session คนละใบ
  const viaFixture = await request.post("/api/cart", { data: { productId: "p01", quantity: 1 } });
  expect(viaFixture.status()).toBe(201);

  await page.goto("/cart");
  // หน้าเว็บอยู่ session อื่น จึงไม่เห็นหูฟังที่เพิ่มไว้ ตะกร้าว่าง
  await expect(page.getByText("ตะกร้าของคุณยังว่างอยู่")).toBeVisible();

  // page.request ใช้ cookie ชุดเดียวกับหน้า (context.request ก็เช่นกัน) ของที่เพิ่มตรงนี้หน้าเว็บเห็น
  const viaPage = await page.request.post("/api/cart", { data: { productId: "p01", quantity: 1 } });
  expect(viaPage.status()).toBe(201);
  // หน้า /cart โหลดข้อมูลตอน goto เสร็จไปแล้ว ต้องโหลดใหม่ถึงเห็นของที่เพิ่งเพิ่มทาง API
  await page.reload();
  await expect(page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem")).toHaveCount(1);
});
