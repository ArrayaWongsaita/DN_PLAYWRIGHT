import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 17: ทำงานกับรายการ (หลาย element)
// ฝึก: toHaveCount, toHaveText แบบ array, nth/first/last, all()
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: นับจำนวนการ์ด แล้วเรียงราคาต่ำไปสูง ตรวจลำดับชื่อสินค้า
// ------------------------------------------------
test("หน้า /products มี 10 การ์ด และเรียงราคาต่ำไปสูงได้ลำดับที่ถูกต้อง", async ({ page }) => {
  await page.goto("/products");
  // หัวข้อ h2 (ชื่อสินค้า) ทุกใบที่อยู่ใน <ul aria-label="รายการสินค้า"> ตัวเดียวได้หลาย element
  const names = page.getByRole("list", { name: "รายการสินค้า" }).getByRole("heading");
  // toHaveCount รอจนจำนวนตรง (ระหว่างโหลดรายการยังไม่แสดง จำนวนเป็น 0 ก่อน)
  await expect(names).toHaveCount(10);

  await page.getByLabel("เรียงตาม").selectOption("ราคาต่ำไปสูง");
  // toHaveText แบบ array: เทียบ "ทีละตัวตามลำดับ" และจำนวนต้องเท่ากันพอดี
  // รอได้เองเช่นกัน จึงไม่ต้องรอให้รายการเรียงใหม่เสร็จก่อน
  // (หนังสือ Playwright กับหมอนอิงราคาเท่ากัน 450 บาท แอปคงลำดับเดิมไว้ คือหมอนอิงก่อน)
  await expect(names).toHaveText([
    "สมุดโน้ตลายจุด",
    "แก้วกาแฟเซรามิก",
    "เสื้อยืด DN สีขาว",
    "หมวกแก๊ป",
    "หนังสือ TypeScript เบื้องต้น",
    "หมอนอิงลายแมว",
    "หนังสือ Playwright ฉบับลงมือทำ",
    "เมาส์ไร้สาย",
    "หูฟังไร้สาย DN Buds",
    "คีย์บอร์ดเครื่องกล",
  ]);
});


// ------------------------------------------------
// ตัวอย่างที่ 2: first / last / nth และวนทีละใบด้วย all()
// ------------------------------------------------
test("หน้า /products ใช้ first, last, nth และวนตรวจทุกการ์ดด้วย all()", async ({ page }) => {
  await page.goto("/products");
  const cards = page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem");
  // ต้องรอให้ครบ 10 ใบก่อนเสมอ แล้วค่อยใช้ all() (ดูเหตุผลใน README: all() ไม่รอ)
  await expect(cards).toHaveCount(10);

  // first() = ใบแรก, last() = ใบสุดท้าย, nth(n) = ใบที่ n นับจาก 0
  await expect(cards.first()).toContainText("หูฟังไร้สาย DN Buds");
  await expect(cards.last()).toContainText("สมุดโน้ตลายจุด");
  // ลำดับ "แนะนำ" คือสินค้าแนะนำ 3 ใบ (หูฟัง เสื้อยืด หมอนอิง) แล้วตามด้วยที่เหลือ ใบที่ 5 (nth(4)) จึงเป็นเมาส์
  await expect(cards.nth(4)).toContainText("เมาส์ไร้สาย");

  // all() คืน array ของ locator ที่ชี้ไปทีละใบ ณ ตอนนี้ วนด้วย for...of ได้
  for (const card of await cards.all()) {
    // ทุกใบต้องมีรูป และราคาลงท้ายด้วย "บาท"
    await expect(card.getByRole("img")).toBeVisible();
    await expect(card).toContainText("บาท");
  }
});


// ------------------------------------------------
// ข้อ 1: หน้า /products เลือกหมวด "หนังสือ" แล้วต้องเหลือ 3 การ์ด และเลือกหมวด "ของใช้ในบ้าน" ต้องเหลือ 2 การ์ด
// แนวทาง: เหมือนตัวอย่างที่ 1 ใช้ getByLabel("หมวดหมู่").selectOption("หนังสือ") แล้ว toHaveCount(3)
//        จากนั้นเลือก "ของใช้ในบ้าน" แล้ว toHaveCount(2) (ตัวนับเดิมใช้ต่อได้ เพราะ locator หาใหม่ทุกครั้ง)
// ------------------------------------------------
test("กรองหมวดแล้วนับจำนวนการ์ด", async ({ page }) => {
  await page.goto("/products");
  const cards = page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem");
  await page.getByLabel("หมวดหมู่").selectOption("หนังสือ");
  // รอเองจนรายการกรองเสร็จ (ระหว่างโหลดรายการจะหายไปชั่วขณะ)
  await expect(cards).toHaveCount(3);
  // ใช้ locator เดิมต่อได้ เพราะมันหาใหม่ทุกครั้งที่ถูกใช้
  await page.getByLabel("หมวดหมู่").selectOption("ของใช้ในบ้าน");
  await expect(cards).toHaveCount(2);
});


// ------------------------------------------------
// ข้อ 2: หน้า /products เรียงราคาสูงไปต่ำ แล้วตรวจชื่อสินค้า 3 ใบแรกด้วย nth หรือ first
// แนวทาง: เลือก "ราคาสูงไปต่ำ" ใบแรกคือ "คีย์บอร์ดเครื่องกล" ใบที่สองคือ "หูฟังไร้สาย DN Buds" ใบที่สามคือ "เมาส์ไร้สาย"
//        ใช้ cards.first() และ cards.nth(1) / cards.nth(2) กับ toContainText
// ------------------------------------------------
test("เรียงราคาสูงไปต่ำแล้วตรวจสามใบแรก", async ({ page }) => {
  await page.goto("/products");
  const cards = page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem");
  await page.getByLabel("เรียงตาม").selectOption("ราคาสูงไปต่ำ");
  // ลำดับคือสิ่งที่ตรวจ จึงใช้ first/nth ได้เหมาะสม; expect รอจนรายการเรียงใหม่เสร็จเอง
  await expect(cards.first()).toContainText("คีย์บอร์ดเครื่องกล");
  await expect(cards.nth(1)).toContainText("หูฟังไร้สาย DN Buds");
  await expect(cards.nth(2)).toContainText("เมาส์ไร้สาย");
});


// ------------------------------------------------
// ข้อ 3: หน้า /products ค้นหา "ไร้สาย" แล้วต้องเหลือ 2 ใบ ตรวจชื่อด้วย toHaveText แบบ array
// แนวทาง: พิมพ์ในช่อง "ค้นหาสินค้า" แล้วกด Enter (บท 07) ได้ "หูฟังไร้สาย DN Buds" กับ "เมาส์ไร้สาย" ตามลำดับแนะนำ
//        ใช้ locator ของ heading แบบตัวอย่างที่ 1 แล้ว toHaveText([...])
// ------------------------------------------------
test("ค้นหาไร้สายแล้วตรวจชื่อทั้งสองใบ", async ({ page }) => {
  await page.goto("/products");
  await page.getByLabel("ค้นหาสินค้า").fill("ไร้สาย");
  await page.getByLabel("ค้นหาสินค้า").press("Enter");
  const names = page.getByRole("list", { name: "รายการสินค้า" }).getByRole("heading");
  // array ต้องมีจำนวนเท่ากับ element จริง (2 ใบ) และเรียงตามลำดับ "แนะนำ" (หูฟังเป็นสินค้าแนะนำจึงมาก่อน)
  await expect(names).toHaveText(["หูฟังไร้สาย DN Buds", "เมาส์ไร้สาย"]);
});


// ------------------------------------------------
// ข้อ 4: หน้า /products วนด้วย all() ตรวจว่าทุกการ์ดที่ไม่ใช่หมวกแก๊ป (filter hasNotText) มีปุ่ม "เพิ่มลงตะกร้า" ที่กดได้ (toBeEnabled)
// แนวทาง: cards.filter({ hasNotText: "หมวกแก๊ป" }) แล้ว await expect(...).toHaveCount(9) ก่อนวน all()
//        ในลูปตรวจ card.getByRole("button", { name: "เพิ่มลงตะกร้า" })
// ------------------------------------------------
test("ทุกการ์ดที่ไม่ใช่หมวกแก๊ปกดเพิ่มลงตะกร้าได้", async ({ page }) => {
  await page.goto("/products");
  const cards = page
    .getByRole("list", { name: "รายการสินค้า" })
    .getByRole("listitem")
    .filter({ hasNotText: "หมวกแก๊ป" });
  // all() ไม่รอ จึงต้องรอให้รายการครบ 9 ใบก่อน ไม่งั้นอาจได้ array ว่างแล้วลูปไม่ทำงาน test จะผ่านแบบไม่ได้ตรวจอะไร
  await expect(cards).toHaveCount(9);
  for (const card of await cards.all()) {
    await expect(card.getByRole("button", { name: "เพิ่มลงตะกร้า" })).toBeEnabled();
  }
});
