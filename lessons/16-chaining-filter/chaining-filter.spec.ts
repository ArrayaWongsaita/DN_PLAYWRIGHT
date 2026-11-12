import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 16: ต่อ locator (chaining) และ filter
// ฝึก: locator.getByRole ต่อจาก locator, filter({ hasText, hasNotText, has, hasNot }), แถวในตาราง
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: กดปุ่ม "เพิ่มลงตะกร้า" ของการ์ด "เมาส์ไร้สาย" โดยเฉพาะ
// ------------------------------------------------
test("หน้า /products กดเพิ่มเมาส์ไร้สายลงตะกร้าโดยหาปุ่มจากการ์ดของมัน", async ({ page }) => {
  await page.goto("/products");
  // การ์ดสินค้าแต่ละใบคือ <li> ใน <ul aria-label="รายการสินค้า"> จึงมี role = listitem
  // filter({ hasText }) เก็บไว้เฉพาะ <li> ที่มีข้อความนี้อยู่ข้างใน (การ์ดอื่นถูกตัดออก)
  const mouseCard = page.getByRole("listitem").filter({ hasText: "เมาส์ไร้สาย" });
  // ต่อ .getByRole ท้าย locator: ค้นหาเฉพาะ "ข้างใน" การ์ดนี้ จึงได้ปุ่มเดียว
  await mouseCard.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  // ข้อความแจ้งผลมี "ชื่อสินค้า" อยู่ด้วย จึงยืนยันได้ว่ากดถูกการ์ด
  await expect(page.getByRole("status").filter({ hasText: 'เพิ่ม "เมาส์ไร้สาย" ลงตะกร้าแล้ว' })).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: หาแถวในตารางของแอดมิน แล้วตรวจเซลล์ในแถวนั้น
// ------------------------------------------------
test("หน้า /admin/products แถวคีย์บอร์ดเครื่องกลมีราคา 2,490 บาทและปุ่มลบ", async ({ page }) => {
  // ยังไม่มี fixture/storageState (มาในบทหลังๆ) จึง login ผ่านหน้าเว็บในแต่ละ test
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("admin@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("admin123");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  // login สำเร็จจะถูกพาไปหน้า /account รอจนเห็น h1 ก่อนค่อยไปต่อ
  await expect(page.getByRole("heading", { name: "บัญชีของฉัน" })).toBeVisible();

  await page.goto("/admin/products");
  // แถวของตาราง (<tr>) มี role = row เหมือนกับที่การ์ดเป็น listitem
  const row = page.getByRole("table", { name: "ตารางสินค้า" }).getByRole("row").filter({ hasText: "คีย์บอร์ดเครื่องกล" });
  // toContainText ตรวจว่าทั้งแถวมีข้อความนี้ (ชื่อ หมวด ราคา คงเหลือ รวมกันเป็นข้อความเดียว)
  await expect(row).toContainText("2,490 บาท");
  // ปุ่ม "ลบ" มีทุกแถว ต้องต่อจาก row เพื่อให้ได้ปุ่มของแถวนี้เท่านั้น
  await expect(row.getByRole("button", { name: "ลบ" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: หน้า /products กดเพิ่ม "หนังสือ TypeScript เบื้องต้น" ลงตะกร้า แล้วตรวจข้อความแจ้งผล
// แนวทาง: เหมือนตัวอย่างที่ 1 เปลี่ยนแค่ข้อความที่ใช้ filter และข้อความแจ้งผล
//        ข้อความแจ้งผลคือ เพิ่ม "ชื่อสินค้า" ลงตะกร้าแล้ว (มีเครื่องหมายคำพูดครอบชื่อ)
// ------------------------------------------------
test("หน้า /products กดเพิ่มหนังสือ TypeScript ลงตะกร้า", async ({ page }) => {
  await page.goto("/products");
  // filter ด้วยชื่อสินค้าเต็มๆ เพื่อไม่ให้ไปตรงกับหนังสือเล่มอื่น (เช่น "หนังสือ Playwright")
  const card = page.getByRole("listitem").filter({ hasText: "หนังสือ TypeScript เบื้องต้น" });
  await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  // ข้อความแจ้งผลมีชื่อสินค้า ยืนยันว่ากดถูกการ์ด; กรอง status ด้วยข้อความเพราะหน้านี้มี role=status มากกว่าหนึ่งอัน
  await expect(page.getByRole("status").filter({ hasText: 'เพิ่ม "หนังสือ TypeScript เบื้องต้น" ลงตะกร้าแล้ว' })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: หน้า /products การ์ด "หมวกแก๊ป" ต้องมีปุ่ม "สินค้าหมด" ที่ disabled
// แนวทาง: filter การ์ดด้วย hasText "หมวกแก๊ป" แล้วต่อ getByRole("button", { name: "สินค้าหมด" })
//        ตรวจด้วย toBeDisabled() (บท 11)
// ------------------------------------------------
test("การ์ดหมวกแก๊ปมีปุ่มสินค้าหมดที่ disabled", async ({ page }) => {
  await page.goto("/products");
  const card = page.getByRole("listitem").filter({ hasText: "หมวกแก๊ป" });
  // ปุ่มนี้อยู่ในการ์ดหมวกแก๊ปเท่านั้น เพราะต่อจาก card (ไม่ใช่จาก page)
  await expect(card.getByRole("button", { name: "สินค้าหมด" })).toBeDisabled();
});


// ------------------------------------------------
// ข้อ 3: หน้า /products หาการ์ดที่ "มีปุ่ม สินค้าหมด อยู่ข้างใน" ด้วย has แล้วตรวจว่าเป็นการ์ดของหมวกแก๊ป
// แนวทาง: getByRole("listitem").filter({ has: page.getByRole("button", { name: "สินค้าหมด" }) })
//        ใน has ต้องใช้ locator ที่เริ่มจาก page เสมอ ตรวจด้วย toHaveCount(1) และ toContainText("หมวกแก๊ป")
// ------------------------------------------------
test("การ์ดที่มีปุ่มสินค้าหมดมีใบเดียวและเป็นหมวกแก๊ป", async ({ page }) => {
  await page.goto("/products");
  // has รับ locator ที่เขียนขึ้นต้นจาก page เสมอ แต่ Playwright หาให้ "ในแต่ละการ์ด" เอง
  const soldOutCards = page.getByRole("listitem").filter({ has: page.getByRole("button", { name: "สินค้าหมด" }) });
  // toHaveCount รอให้รายการโหลดเสร็จ แล้วยืนยันว่ามีใบเดียว
  await expect(soldOutCards).toHaveCount(1);
  await expect(soldOutCards).toContainText("หมวกแก๊ป");
});


// ------------------------------------------------
// ข้อ 4: หน้า /products การ์ดที่ "ไม่มี" ปุ่มสินค้าหมด (hasNot) ต้องมี 9 ใบ และการ์ดที่ข้อความ "ไม่มี" คำว่า หนังสือ (hasNotText) ต้องมี 7 ใบ
// แนวทาง: hasNot ใช้คู่กับ locator เหมือน has ส่วน hasNotText ใช้คู่กับข้อความเหมือน hasText
//        ตรวจจำนวนด้วย toHaveCount(...) แต่ต้องรอให้รายการโหลดเสร็จก่อน (toHaveCount รอให้เอง)
// ------------------------------------------------
test("นับการ์ดด้วย hasNot และ hasNotText", async ({ page }) => {
  await page.goto("/products");
  const cards = page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem");
  // ยืนยันว่ารายการโหลดครบก่อน ไม่งั้น toHaveCount ของข้างล่างอาจผ่าน/ตกตามจังหวะโหลด
  await expect(cards).toHaveCount(10);

  // hasNot: ไม่มีปุ่ม "สินค้าหมด" อยู่ข้างใน = 10 - 1 = 9 ใบ
  await expect(cards.filter({ hasNot: page.getByRole("button", { name: "สินค้าหมด" }) })).toHaveCount(9);
  // hasNotText: ข้อความไม่มีคำว่า "หนังสือ" = ตัดหมวกหนังสือ 3 ใบ เหลือ 7 ใบ
  await expect(cards.filter({ hasNotText: "หนังสือ" })).toHaveCount(7);
});


// ------------------------------------------------
// ข้อ 5: หน้า /admin/products (login เป็น admin) แถว "หมวกแก๊ป" ต้องมี "350 บาท" และจำนวนคงเหลือ 0 และมีปุ่ม "ลบ"
// แนวทาง: login แบบตัวอย่างที่ 2 แล้วหาแถวด้วย getByRole("row").filter({ hasText: "หมวกแก๊ป" })
//        ตรวจแต่ละเซลล์ด้วย row.getByRole("cell").nth(3) ได้ (nth อธิบายในบท 17) หรือใช้ toContainText ทั้งแถว
// ------------------------------------------------
test("แถวหมวกแก๊ปในตารางแอดมิน", async ({ page }) => {
  // login ผ่านหน้าเว็บ แบบเดียวกับตัวอย่างที่ 2 (ยังไม่มี storageState)
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("admin@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("admin123");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page.getByRole("heading", { name: "บัญชีของฉัน" })).toBeVisible();
  await page.goto("/admin/products");
  const row = page.getByRole("table", { name: "ตารางสินค้า" }).getByRole("row").filter({ hasText: "หมวกแก๊ป" });
  // ตรวจราคาด้วยทั้งแถว หรือจะชี้ทีละเซลล์ก็ได้ (nth นับจาก 0: เซลล์ที่ 2 = ราคา, เซลล์ที่ 3 = คงเหลือ)
  await expect(row).toContainText("350 บาท");
  await expect(row.getByRole("cell").nth(2)).toHaveText("350 บาท");
  await expect(row.getByRole("cell").nth(3)).toHaveText("0");
  // ปุ่ม "ลบ" ของแถวนี้ (ไม่กดจริง เพราะการลบเป็นเรื่องของ dialog ในบทหลัง)
  await expect(row.getByRole("button", { name: "ลบ" })).toBeVisible();
});
