import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 13: web-first assertions และการรอ
// ฝึก: assertion ที่รอเอง (await expect(locator)), ทำไมไม่ใช้ expect(await x.isVisible()), expect timeout
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================
//
// บทนี้เป็นบทที่ "ตั้งใจ" ให้ดูโค้ดที่ไม่ควรเขียน (ตัวอย่างที่ 3 อยู่ใน test.fixme)
// เพื่อให้เห็นว่ามันพังเพราะอะไร ไม่ได้สอนให้เอาไปใช้จริง


// ------------------------------------------------
// ตัวอย่างที่ 1: ข้อความ "เพิ่มลงตะกร้าแล้ว" ขึ้นช้ากว่าที่กดปุ่ม (แอปหน่วง 800ms) แต่ assertion รอให้เอง
// ------------------------------------------------
test("หน้าสินค้า p01 กดเพิ่มลงตะกร้าแล้วต้องเห็นข้อความเพิ่มลงตะกร้าแล้ว", async ({ page }) => {
  await page.goto("/products/p01");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  // ตอนบรรทัดนี้เริ่มทำงาน ข้อความยังไม่ขึ้น (แอปหน่วง 800ms) แต่ toBeVisible ลองตรวจซ้ำเรื่อยๆ
  // จนกว่าข้อความจะขึ้นหรือครบเวลา (ค่าเริ่มต้นของ expect คือ 5 วินาที) จึงไม่ต้องเขียนรอเอง
  await expect(page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" })).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: งานที่ช้ากว่าเวลารอเริ่มต้น (5 วินาที) ให้เพิ่มเวลาของ assertion นั้นด้วย { timeout }
// ------------------------------------------------
test("หน้า /playground/slow ที่ delay 6 วินาที ต้องรอนานกว่าค่าเริ่มต้น", async ({ page }) => {
  // ?delay=6000 บอกหน้านี้ให้หน่วงการโหลดข้อมูล 6 วินาที (ช้ากว่า 5 วินาทีของ expect)
  await page.goto("/playground/slow?delay=6000");
  await page.getByRole("button", { name: "โหลดข้อมูล" }).click();
  // ถ้าไม่ใส่ timeout บรรทัดนี้จะล้มเหลวที่ 5 วินาที ใส่ { timeout: 10_000 } เพื่อให้รอได้สูงสุด 10 วินาที
  // (เวลาที่ใส่คือ "เพดาน" ถ้าข้อความขึ้นเร็วกว่านั้นก็ผ่านทันที ไม่ได้หน่วงให้ช้าลง)
  await expect(page.getByRole("status").filter({ hasText: "โหลดข้อมูลเสร็จแล้ว" })).toBeVisible({ timeout: 10_000 });
});


// ------------------------------------------------
// ตัวอย่างที่ 3 (เฉลย): ฉบับแก้ของโค้ดที่พังใน main
// ------------------------------------------------
// เหตุผลที่ฉบับเดิมพัง: isVisible() ตอบทันทีตอนที่ข้อความยังไม่ขึ้น (แอปหน่วง 800ms) ได้ false
// แล้ว expect(false).toBe(true) ก็ตรวจครั้งเดียวและล้มเหลวทันที ไม่มีอะไรรอเลย
// ทางแก้: ส่ง locator เข้า expect ตรงๆ แล้วใช้ web-first assertion ซึ่งลองซ้ำเองจนผ่านหรือหมดเวลา
test("ตัวอย่างที่ 3 (เฉลย) ใช้ await expect(locator).toBeVisible() แทน isVisible()", async ({ page }) => {
  await page.goto("/products/p01");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  const message = page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" });
  // ฉบับเดิม (พัง): expect(await message.isVisible()).toBe(true);
  await expect(message).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: หน้าสินค้า p02 (คีย์บอร์ดเครื่องกล) กดเพิ่มลงตะกร้าแล้วต้องเห็นข้อความ "เพิ่มลงตะกร้าแล้ว"
// แนวทาง: เหมือนตัวอย่างที่ 1 เปลี่ยนเป็น /products/p02 (ข้อความยืนยันเหมือนเดิม)
// ------------------------------------------------
test("หน้าสินค้า p02 กดเพิ่มลงตะกร้าแล้วต้องเห็นข้อความยืนยัน", async ({ page }) => {
  await page.goto("/products/p02");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  // แอปหน่วง 800ms ก่อนแสดงข้อความ toBeVisible รอเองจึงไม่ต้องมี sleep
  await expect(page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: กดเพิ่มสินค้า p01 ลงตะกร้า พอข้อความยืนยันขึ้น ตัวเลขในลิงก์ตะกร้าของ header (data-testid="cart-count") ต้องเป็น "1"
// แนวทาง: ต่อจากข้อ 1 ตรวจ getByTestId("cart-count") ด้วย toHaveText("1") ตัวเลขนี้อัปเดตหลังข้อความยืนยัน
//        จึงตรวจแล้วอาจยังเป็น "0" ชั่วขณะ ปล่อยให้ assertion รอเอง
// ------------------------------------------------
test("กดเพิ่มลงตะกร้าแล้วตัวเลขตะกร้าที่ header ต้องเป็น 1", async ({ page }) => {
  await page.goto("/products/p01");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" })).toBeVisible();
  // ตัวเลขใน header อัปเดตหลังข้อความ ถ้าอ่านค่าครั้งเดียวอาจยังเป็น "0" toHaveText ลองซ้ำจนเป็น "1"
  await expect(page.getByTestId("cart-count")).toHaveText("1");
});


// ------------------------------------------------
// ข้อ 3: หน้า /playground/slow (delay เริ่มต้น 2 วินาที) กดปุ่ม "โหลดข้อมูล" ต้องเห็น "กำลังโหลด..." ก่อน แล้วจึงเห็น "โหลดข้อมูลเสร็จแล้ว"
// แนวทาง: ทั้งสองข้อความอยู่ใน role="status" แยกกันด้วย .filter({ hasText }) ตรวจด้วย toBeVisible ทีละข้อความ
//        2 วินาทีน้อยกว่า 5 วินาทีของ expect จึงไม่ต้องใส่ timeout
// ------------------------------------------------
test("หน้า /playground/slow โหลดข้อมูลแล้วเห็นสถานะกำลังโหลดและเสร็จแล้ว", async ({ page }) => {
  await page.goto("/playground/slow");
  await page.getByRole("button", { name: "โหลดข้อมูล" }).click();
  // สถานะระหว่างโหลดอยู่ 2 วินาที ตรวจเจอแน่นอนเพราะ toBeVisible ลองซ้ำตลอดช่วงนั้น
  await expect(page.getByRole("status").filter({ hasText: "กำลังโหลด..." })).toBeVisible();
  // 2 วินาทีน้อยกว่าเวลารอเริ่มต้น 5 วินาที ไม่ต้องใส่ timeout
  await expect(page.getByRole("status").filter({ hasText: "โหลดข้อมูลเสร็จแล้ว" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: หน้า /playground/slow?delay=7000 กดปุ่ม "โหลดข้อมูล" แล้วต้องเห็น "โหลดข้อมูลเสร็จแล้ว"
// แนวทาง: 7 วินาทีนานกว่าค่าเริ่มต้นของ expect เหมือนตัวอย่างที่ 2 ต้องใส่ { timeout: 10_000 }
//        ลองรันก่อนโดยยังไม่ใส่ timeout เพื่ออ่านข้อความ error "Timeout 5000ms exceeded" แล้วค่อยแก้
// ------------------------------------------------
test("หน้า /playground/slow ที่ delay 7 วินาที ต้องใส่ timeout ให้ assertion", async ({ page }) => {
  await page.goto("/playground/slow?delay=7000");
  await page.getByRole("button", { name: "โหลดข้อมูล" }).click();
  // 7 วินาทีนานกว่า 5 วินาทีของ expect (ถ้าไม่ใส่ timeout จะล้มด้วย "Timeout 5000ms exceeded")
  // ใส่ 10_000 เป็นเพดาน ผ่านทันทีที่ข้อความขึ้น ไม่ได้หน่วงเวลาเพิ่ม
  await expect(page.getByRole("status").filter({ hasText: "โหลดข้อมูลเสร็จแล้ว" })).toBeVisible({ timeout: 10_000 });
});


// ------------------------------------------------
// ข้อ 5: หน้า /playground/slow ปุ่ม "ส่งฟอร์ม" ถูก disabled อยู่ประมาณ 1.5 วินาทีหลังโหลดหน้า รอให้ enabled
//        (toBeEnabled) แล้วกดปุ่ม ต้องเห็น "ส่งฟอร์มแล้ว"
// แนวทาง: ตอนแรกปุ่มมีข้อความ "รอสักครู่..." เมื่อพร้อมจึงเปลี่ยนเป็น "ส่งฟอร์ม" ใช้ getByRole("button", { name: "ส่งฟอร์ม" })
//        ซึ่งหาเจอเฉพาะตอนที่ชื่อเปลี่ยนแล้ว ตรวจ toBeEnabled() ก่อน click ก็ได้
//        (click รอให้ปุ่มพร้อมกดเองอยู่แล้ว แต่ฝึกใช้ assertion ที่รอ)
// ------------------------------------------------
test("หน้า /playground/slow ปุ่มส่งฟอร์มพร้อมกดแล้วกดส่งได้", async ({ page }) => {
  await page.goto("/playground/slow");
  // ชื่อปุ่ม "ส่งฟอร์ม" มีหลังพร้อมใช้งานเท่านั้น (ก่อนหน้านั้นชื่อ "รอสักครู่...") locator จึงรอเจอเอง
  const submit = page.getByRole("button", { name: "ส่งฟอร์ม" });
  // toBeEnabled รอจนปุ่มหมด disabled (ราว 1.5 วินาที)
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByText("ส่งฟอร์มแล้ว")).toBeVisible();
});
