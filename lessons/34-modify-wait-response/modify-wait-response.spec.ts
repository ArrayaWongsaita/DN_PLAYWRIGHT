import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 34: แก้ response, ทำให้ request ล้มเหลว, รอ response และ request
// ฝึก: route.fetch + route.fulfill({ response }), route.abort, page.waitForResponse, page.waitForRequest
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// บทนี้ใช้หน้า /products เหมือนบท 33: หน้าดึงรายการจาก /api/products ฝั่ง browser และกดเพิ่มลงตะกร้าด้วย POST /api/cart
// สิ่งที่ต่างจากบท 33: คราวนี้เรา "ใช้ข้อมูลจริงเป็นฐาน" แล้วแก้นิดเดียว และ "ดู" คำขอ/คำตอบที่เกิดขึ้นจริงด้วย


// ------------------------------------------------
// ตัวอย่างที่ 1: ขอข้อมูลจริงจาก server แล้วแก้ชื่อกับราคาก่อนส่งให้หน้า
// ------------------------------------------------
test("หน้า products: แก้ชื่อและราคาของสินค้าชิ้นแรกใน response จริง", async ({ page }) => {
  // ตั้ง route ก่อน goto (เหมือนบท 33)
  await page.route("**/api/products*", async (route) => {
    // route.fetch() ส่งคำขอเดิมไปที่ server จริง แล้วได้ response กลับมาให้เราดูได้ก่อนตัดสินใจ
    const response = await route.fetch();
    // อ่าน body เป็น JSON (เป็น object ธรรมดา แก้ได้เลย)
    const json = await response.json();
    // สินค้าชิ้นแรกในลำดับ "แนะนำ" คือหูฟังไร้สาย DN Buds แก้ชื่อกับราคา
    json.products[0].name = "หูฟังรุ่นพิเศษ";
    json.products[0].price = 1;
    // ตอบให้หน้าโดยใช้ response เดิมเป็นฐาน (status/headers เดิม) แต่เปลี่ยน body เป็น json ที่แก้แล้ว
    await route.fulfill({ response, json });
  });

  await page.goto("/products");

  // หาการ์ดของสินค้าที่เราเปลี่ยนชื่อ แล้วตรวจราคาใหม่ในการ์ดนั้น
  const card = page.getByRole("listitem").filter({ hasText: "หูฟังรุ่นพิเศษ" });
  await expect(card).toContainText("1 บาท");
  // สินค้าอื่นยังเป็นข้อมูลจริง (เมาส์ไร้สายยังราคา 590 บาท)
  await expect(page.getByRole("listitem").filter({ hasText: "เมาส์ไร้สาย" })).toContainText("590 บาท");
});


// ------------------------------------------------
// ตัวอย่างที่ 2: รอ response ของการเพิ่มลงตะกร้า แล้วอ่าน body ที่ server ตอบ
// ------------------------------------------------
test("หน้า products: กดเพิ่มเมาส์ลงตะกร้า แล้วอ่าน response จาก API", async ({ page }) => {
  await page.goto("/products");

  // การ์ดสินค้าขึ้นหลังหน้าดึงข้อมูลเสร็จ แปลว่าหน้าพร้อมแล้ว (ปุ่มกดได้จริง)
  const card = page.getByRole("listitem").filter({ hasText: "เมาส์ไร้สาย" });
  await expect(card).toBeVisible();

  // สร้าง promise "ก่อน" กดปุ่ม (ยังไม่ await) เพื่อเริ่มดักฟังก่อนที่ response จะมา ถ้าสร้างหลังกดอาจพลาด response ไปแล้ว
  // เงื่อนไข: เป็นคำขอ POST ไป /api/cart และ server ตอบ 201 (Created)
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes("/api/cart") && r.request().method() === "POST" && r.status() === 201,
  );

  // กดปุ่ม ทำให้หน้าส่ง POST /api/cart
  await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();

  // ตอนนี้ค่อย await promise เพื่อรับ response
  const response = await responsePromise;
  // อ่าน body (สรุปตะกร้าที่ server ตอบกลับ) แล้วตรวจ
  const cart = await response.json();
  expect(cart.count).toBe(1);
  expect(cart.items[0]).toMatchObject({ productId: "p03", quantity: 1, price: 590 });

  // หน้าจอก็แสดงข้อความยืนยันตามมา (status หลายอัน จึงกรองด้วยข้อความ)
  await expect(page.getByRole("status").filter({ hasText: 'เพิ่ม "เมาส์ไร้สาย" ลงตะกร้าแล้ว' })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: แก้ราคาของเมาส์ไร้สายใน response จริง
// แนวทาง: เหมือนตัวอย่างที่ 1 แต่หาสินค้าด้วย id แทนลำดับ:
//        json.products.find((p: { id: string }) => p.id === "p03").price = 1 แล้ว fulfill({ response, json })
//        ตรวจว่าการ์ดของ "เมาส์ไร้สาย" มีข้อความ "1 บาท" และการ์ดของ "หูฟังไร้สาย DN Buds" ยัง "1,290 บาท"
// ------------------------------------------------
test("หน้า products: แก้ราคาเมาส์ไร้สายเป็น 1 บาท", async ({ page }) => {
  await page.route("**/api/products*", async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    // หาด้วย id (p03) แทนการใช้ลำดับ เพราะลำดับในรายการเปลี่ยนได้เมื่อมีการเรียง แต่ id ไม่เปลี่ยน
    json.products.find((p: { id: string }) => p.id === "p03").price = 1;
    // fulfill ด้วย response เดิมเป็นฐาน เพื่อคง status และ header ที่ server ตอบมา เปลี่ยนแค่ body
    await route.fulfill({ response, json });
  });

  await page.goto("/products");

  // กรองการ์ดด้วยชื่อ (บท 16) แล้วตรวจข้อความราคาในการ์ดนั้น
  await expect(page.getByRole("listitem").filter({ hasText: "เมาส์ไร้สาย" })).toContainText("1 บาท");
  // สินค้าอื่นไม่ถูกแตะต้อง ยืนยันว่าเราแก้เฉพาะชิ้นเดียวจริง
  await expect(page.getByRole("listitem").filter({ hasText: "หูฟังไร้สาย DN Buds" })).toContainText("1,290 บาท");
});


// ------------------------------------------------
// ข้อ 2: รอ response ของการค้นหา
// แนวทาง: goto("/products") รอการ์ดขึ้นก่อน (เช่น "พบสินค้า 10 รายการ") สร้าง promise ก่อนกดค้นหา:
//        page.waitForResponse((r) => r.url().includes("/api/products") && r.url().includes("q="))
//        จากนั้น fill ช่อง "ค้นหาสินค้า" ด้วย "ไร้สาย" แล้ว press("Enter") await promise
//        ตรวจ response.status() เป็น 200 และ (await response.json()).total เป็น 2
// ------------------------------------------------
test("หน้า products: ค้นหาไร้สายแล้วตรวจ response ที่ server ตอบ", async ({ page }) => {
  await page.goto("/products");
  // รอให้รายการแรกโหลดเสร็จก่อน ถ้ากรอกตอนหน้ายังไม่พร้อม (ยังไม่ hydrate) ข้อความที่กรอกอาจหายหรือ Enter ไม่ทำงาน
  await expect(page.getByText("พบสินค้า 10 รายการ")).toBeVisible();

  // เงื่อนไข q= ทำให้ไม่ไปจับ response ของการโหลดครั้งแรก (ที่ไม่มี q) ซึ่งเสร็จไปแล้วด้วย
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes("/api/products") && r.url().includes("q="),
  );
  await page.getByLabel("ค้นหาสินค้า").fill("ไร้สาย");
  await page.getByLabel("ค้นหาสินค้า").press("Enter");

  const response = await responsePromise;
  expect(response.status()).toBe(200);
  // seed มีสินค้าชื่อมี "ไร้สาย" สองชิ้น: หูฟังไร้สาย DN Buds กับเมาส์ไร้สาย
  expect((await response.json()).total).toBe(2);
  // ฝั่งหน้าจอต้องสอดคล้องกับที่ API ตอบ
  await expect(page.getByText("พบสินค้า 2 รายการ")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 3: ทำให้คำขอล้มเหลวด้วย route.abort แล้วหายเมื่อเลิกดัก
// แนวทาง: ตั้ง route "**/api/products*" ให้ await route.abort() goto แล้วตรวจ alert "โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่"
//        (แบบเดียวกับบท 33 ต่างกันที่นี่ไม่มี response เลย เหมือนเน็ตหลุด)
//        จากนั้นเรียก await page.unroute("**/api/products*") เลิกดัก แล้วกดปุ่ม "ลองใหม่" ตรวจว่าเห็น "พบสินค้า 10 รายการ"
// ------------------------------------------------
test("หน้า products: เน็ตหลุด (abort) แล้วกดลองใหม่หลังเลิกดัก", async ({ page }) => {
  await page.route("**/api/products*", async (route) => {
    // abort = คำขอล้มเหลวแบบไม่มี response (เหมือนเน็ตหลุด) fetch ฝั่งหน้าจะ reject แทนที่จะได้ status
    await route.abort();
  });

  await page.goto("/products");
  const alert = page.getByRole("alert").filter({ hasText: "โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่" });
  await expect(alert).toBeVisible();

  // เลิกดัก: คำขอต่อจากนี้ไปถึง server จริงตามปกติ (ต้องใช้ pattern เดียวกับตอน route)
  await page.unroute("**/api/products*");
  await alert.getByRole("button", { name: "ลองใหม่" }).click();
  await expect(page.getByText("พบสินค้า 10 รายการ")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: ตรวจ body ที่หน้าส่งไปด้วย waitForRequest
// แนวทาง: เปิดหน้า รอการ์ดของ "แก้วกาแฟเซรามิก" ขึ้น สร้าง promise ก่อนกด:
//        page.waitForRequest((r) => r.url().includes("/api/cart") && r.method() === "POST")
//        กดปุ่ม "เพิ่มลงตะกร้า" ในการ์ดนั้น แล้ว await promise ตรวจ request.postDataJSON() เท่ากับ { productId: "p06", quantity: 1 }
// ------------------------------------------------
test("หน้า products: ตรวจ body ของคำขอเพิ่มลงตะกร้า", async ({ page }) => {
  await page.goto("/products");
  const card = page.getByRole("listitem").filter({ hasText: "แก้วกาแฟเซรามิก" });
  // การ์ดขึ้นแล้วหน้าถึงจะพร้อมให้กด
  await expect(card).toBeVisible();

  // ต้องสร้าง promise ก่อนกด ไม่งั้นคำขอที่ออกไปแล้วจะถูกพลาด
  const requestPromise = page.waitForRequest(
    (r) => r.url().includes("/api/cart") && r.method() === "POST",
  );
  await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();

  const request = await requestPromise;
  // postDataJSON() แปลง body ที่ส่งไปเป็น object ให้ ตรวจได้ว่าหน้าส่งอะไรออกไปจริง
  expect(request.postDataJSON()).toEqual({ productId: "p06", quantity: 1 });
});


// ------------------------------------------------
// ข้อ 5: แก้คำขอก่อนส่ง (route.continue) แล้วดูผลที่หน้าจอ
// แนวทาง: ตั้ง route "**/api/cart" ก่อนกดปุ่ม ใน handler เรียก
//        route.continue({ postData: JSON.stringify({ productId: "p06", quantity: 2 }) }) (ส่งต่อไป server จริงแต่เปลี่ยน body)
//        เปิดหน้า รอการ์ดแก้วกาแฟขึ้น กด "เพิ่มลงตะกร้า" (หน้าส่ง quantity 1 แต่ server ได้ 2)
//        ตรวจว่า data-testid="cart-count" (getByTestId) มีข้อความ "2"
// ------------------------------------------------
test("หน้า products: เปลี่ยนจำนวนในคำขอจาก 1 เป็น 2 ก่อนส่งถึง server", async ({ page }) => {
  await page.goto("/products");
  const card = page.getByRole("listitem").filter({ hasText: "แก้วกาแฟเซรามิก" });
  await expect(card).toBeVisible();

  await page.route("**/api/cart", async (route) => {
    // continue = ส่งคำขอไปที่ server จริง แต่เปลี่ยนบางส่วนได้ ตรงนี้เปลี่ยน body เป็นจำนวน 2 (header ยังเป็น JSON ตามเดิม)
    // แก้เฉพาะคำขอ POST ส่วนคำขออื่นที่ตรง pattern เดียวกัน (เช่น GET) ปล่อยผ่านตามปกติ
    if (route.request().method() !== "POST") return route.fallback();
    await route.continue({ postData: JSON.stringify({ productId: "p06", quantity: 2 }) });
  });

  // หน้าส่ง quantity 1 แต่ server ได้รับ 2 (เพราะเราแก้ระหว่างทาง)
  await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();

  // จำนวนบนไอคอนตะกร้าเป็นของจริงจาก server (ตั้งหลังหน้ารีเฟรชข้อมูล) จึงรอด้วย assertion ที่ retry เอง
  await expect(page.getByTestId("cart-count")).toHaveText("2");
});
