import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 21: annotations และ tags
// ฝึก: test.skip (มีเงื่อนไข), test.fail, test.slow, test.fixme, tag, --grep
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: ติด tag @smoke และข้าม test แบบมีเงื่อนไข (browserName)
// ------------------------------------------------
// tag ใส่ในอาร์กิวเมนต์ตัวที่สอง (object) ระหว่างชื่อกับฟังก์ชัน; ใส่ได้ทั้ง string เดียวหรือ array
test("หน้าแรกแสดงหัวข้อ DN Shop", { tag: "@smoke" }, async ({ page, browserName }) => {
  // test.skip(เงื่อนไข, เหตุผล) ถ้าเงื่อนไขเป็นจริง test นี้ถูกข้ามและไม่รันบรรทัดถัดไป
  // repo นี้รันเฉพาะ chromium จึงไม่ถูกข้าม แต่ถ้าเพิ่ม firefox ใน config แล้วมีปัญหา ข้ามเฉพาะ firefox ได้ทันที
  test.skip(browserName === "firefox", "ยังไม่รองรับ firefox ในบทนี้");

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "DN Shop" })).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: test.fail() = รู้ว่าพัง (bug ที่ยังไม่แก้) แต่ให้ถือว่าผ่านไปก่อน
// ------------------------------------------------
test("หน้าสินค้า p01 แสดงราคา 999 บาท (บั๊กที่รู้แล้ว ราคาจริงคือ 1,290 บาท)", async ({ page }) => {
  // test.fail() บอกว่า "test นี้ต้อง fail" ถ้า fail จริง = ผ่าน (เป็นสีเขียว)
  // ถ้ามีคนแก้บั๊กจน test ผ่านโดยไม่ตั้งใจ test จะกลายเป็น fail เพื่อเตือนให้ลบ test.fail() ออก
  test.fail();

  await page.goto("/products/p01");
  // ใส่ timeout สั้นๆ ให้ assertion ที่รู้ว่าจะ fail ไม่ต้องรอเต็ม 5 วินาที
  await expect(page.getByText("999 บาท")).toBeVisible({ timeout: 1000 });
});


// ------------------------------------------------
// ข้อ 1: ข้าม test แบบมีเงื่อนไข ตรวจชื่อหน้าสินค้า p03 ว่าเป็น "เมาส์ไร้สาย" ติด tag @smoke และข้ามเมื่อเป็น webkit
// แนวทาง: เหมือนตัวอย่างที่ 1 รับ { page, browserName } ใส่ { tag: "@smoke" } และ test.skip(browserName === "webkit", "เหตุผล")
//        หมายเหตุ: repo นี้รันแค่ chromium เงื่อนไข webkit จึงไม่เคยข้ามจริง ลองเปลี่ยนเป็น "chromium" เพื่อดูผล skipped แล้วเปลี่ยนกลับ
//        แล้ว goto("/products/p03") ตรวจ heading ระดับ 1
// ------------------------------------------------
test("หน้าสินค้า p03 แสดงชื่อเมาส์ไร้สาย", { tag: "@smoke" }, async ({ page, browserName }) => {
  // เงื่อนไขเป็นเท็จใน chromium จึงไม่ถูกข้าม (เปลี่ยนเป็น "chromium" ดูผลข้ามได้)
  test.skip(browserName === "webkit", "ยังไม่รองรับ webkit ในบทนี้");

  await page.goto("/products/p03");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("เมาส์ไร้สาย");
});


// ------------------------------------------------
// ข้อ 2: ใช้ test.fail() กับ test ที่รู้ว่า fail: หน้า /products/p02 แสดงราคา "1,000 บาท" (ราคาจริงคือ 2,490 บาท)
// แนวทาง: เหมือนตัวอย่างที่ 2 เรียก test.fail() ต้น test แล้ว expect(...).toBeVisible({ timeout: 1000 })
//        ทดลองลบ test.fail() ออกดูว่า test fail แล้วใส่กลับ
// ------------------------------------------------
test("หน้าสินค้า p02 แสดงราคา 1,000 บาท (บั๊กที่รู้แล้ว)", async ({ page }) => {
  // ประกาศว่า test นี้ "ต้อง fail" (ราคาจริง 2,490 บาท) fail จริง = ผ่าน; ถ้าลบบรรทัดนี้ test จะ fail
  test.fail();

  await page.goto("/products/p02");
  await expect(page.getByText("1,000 บาท")).toBeVisible({ timeout: 1000 });
});


// ------------------------------------------------
// ข้อ 3: ใช้ test.slow() กับหน้าที่ช้า: /playground/slow?delay=1000 กด "โหลดข้อมูล" แล้วต้องเห็นสถานะ "โหลดข้อมูลเสร็จแล้ว"
// แนวทาง: เรียก test.slow() ต้น test (เพิ่ม timeout ของ test เป็น 3 เท่า) goto แล้วกดปุ่ม
//        ตรวจ page.getByRole("status").filter({ hasText: "โหลดข้อมูลเสร็จแล้ว" })
// ------------------------------------------------
test("หน้า slow โหลดข้อมูลเสร็จ (ใช้ test.slow)", async ({ page }) => {
  // timeout ของ test นี้เป็น 3 เท่า เผื่อหน้าที่ช้าตามธรรมชาติ (delay=1000 ทำให้ช้า แต่ยังไม่เกิน 30 วินาทีอยู่ดี)
  test.slow();

  await page.goto("/playground/slow?delay=1000");
  await page.getByRole("button", { name: "โหลดข้อมูล" }).click();
  await expect(page.getByRole("status").filter({ hasText: "โหลดข้อมูลเสร็จแล้ว" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: ติด tag ให้ test แล้วรันเฉพาะ tag ด้วย --grep: เขียน test ตะกร้าว่าง ติด tag ทั้ง "@smoke" และ "@cart" (array)
// แนวทาง: { tag: ["@smoke", "@cart"] } goto("/cart") ตรวจข้อความ "ตะกร้าของคุณยังว่างอยู่"
//        จากนั้นรัน pnpm test 21-annotations-tags --grep "@cart" แล้วลอง --grep-invert "@cart" (ครอบด้วย "..." เสมอ เพราะ @ ใน PowerShell มีความหมายพิเศษ) เทียบจำนวน test (อ่านวิธีใน README)
// ------------------------------------------------
test("ตะกร้าว่างแสดงข้อความตะกร้ายังว่าง", { tag: ["@smoke", "@cart"] }, async ({ page }) => {
  await page.goto("/cart");
  await expect(page.getByText("ตะกร้าของคุณยังว่างอยู่")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 5: ลอง test.only แล้วลบออก: เขียน test ตรวจหน้า /login มี heading ระดับ 1 "เข้าสู่ระบบ"
// แนวทาง: เขียนเสร็จให้เปลี่ยนเป็น test.only รัน pnpm test 21-annotations-tags สังเกตว่ามีแค่ test เดียวที่รัน
//        จากนั้น **ลบ .only ออกก่อนบันทึกและส่งงาน** (อ่านเหตุผลและ forbidOnly ใน README)
// ------------------------------------------------
test("หน้า login มี heading เข้าสู่ระบบ", async ({ page }) => {
  // ตอนทดลองให้เขียนเป็น test.only แล้วรันดู จากนั้นลบ .only ออก (ใน solutions ไม่มี .only เหลืออยู่)
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1, name: "เข้าสู่ระบบ" })).toBeVisible();
});
