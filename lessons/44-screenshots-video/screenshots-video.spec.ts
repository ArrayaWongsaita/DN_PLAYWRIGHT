import fs from "node:fs";
import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 44: ถ่ายภาพหน้าจอและอัดวิดีโอ
// ฝึก: page.screenshot, locator.screenshot, testInfo.attach, test.use({ video: "on" })
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// เปิดการอัดวิดีโอให้ "ทุก test ในไฟล์นี้" (ค่าเริ่มต้นใน config ของ repo คือปิด)
// video ต้องตั้งระดับบนสุดของไฟล์หรือใน config เท่านั้น: ตั้งใน test.describe จะ error
// เพราะการอัดวิดีโอต้องเริ่มตั้งแต่ตอนสร้าง browser context (ต้องเปิด worker ใหม่)
test.use({ video: "on" });


// ------------------------------------------------
// ตัวอย่างที่ 1: ถ่ายภาพทั้งหน้า เก็บเป็นไฟล์ใน test-results/ แล้วแนบเข้ารายงาน
// ------------------------------------------------
test("ถ่ายภาพหน้าแรกทั้งหน้าแล้วแนบเข้ารายงาน", async ({ page }, testInfo) => {
  await page.goto("/");
  // รอให้หัวข้อหลักขึ้นก่อน เพื่อให้แน่ใจว่าหน้าวาดเสร็จแล้ว
  await expect(page.getByRole("heading", { name: "DN Shop", level: 1 })).toBeVisible();

  // testInfo.outputPath() ให้ path ในโฟลเดอร์ผลลัพธ์ของ test นี้ (ใต้ test-results/) ที่ไม่ซ้ำกับ test อื่น
  const path = testInfo.outputPath("home-full.png");
  // fullPage: true ถ่ายทั้งหน้ารวมส่วนที่ต้องเลื่อนลงไปดู
  await page.screenshot({ path, fullPage: true });

  // ไฟล์ภาพต้องมีอยู่จริงและไม่ว่าง
  expect(fs.statSync(path).size).toBeGreaterThan(0);

  // แนบไฟล์เข้ารายงาน HTML (เปิดดูด้วย pnpm report) ชื่อที่ตั้งจะขึ้นในส่วน Attachments
  await testInfo.attach("หน้าแรกทั้งหน้า", { path, contentType: "image/png" });
});


// ------------------------------------------------
// ตัวอย่างที่ 2: ถ่ายเฉพาะ element (ทุก test ในไฟล์นี้อัดวิดีโออยู่แล้วจาก test.use ด้านบน)
// ------------------------------------------------
test("ถ่ายภาพเมนูหลักเฉพาะส่วน ขณะที่อัดวิดีโออยู่", async ({ page }, testInfo) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "เมนูหลัก" });
  await expect(nav.getByRole("link", { name: "สินค้า" })).toBeVisible();

  // locator.screenshot() ถ่ายเฉพาะกรอบของ element นั้น (เลื่อนให้เห็นและรอให้นิ่งให้เอง)
  const buffer = await nav.screenshot();
  // ถ้าไม่ใส่ path จะได้ Buffer กลับมา แนบเข้ารายงานด้วย body แทน path
  await testInfo.attach("เมนูหลัก", { body: buffer, contentType: "image/png" });

  // ไฟล์วิดีโอ (.webm) จะถูกเขียนเสร็จตอน test จบและปิด page แล้วเท่านั้น
  // จึงเปิดดูได้ที่ test-results/ หลังรันเสร็จ ไม่ใช่ตรวจใน test นี้
  expect(page.video()).not.toBeNull();
});


// ------------------------------------------------
// ข้อ 1: ถ่ายภาพหน้าสินค้าเก็บลงไฟล์
// แนวทาง: goto("/products") รอให้ heading "สินค้าทั้งหมด" ขึ้น
//        ใช้ page.screenshot({ path }) โดยได้ path จาก testInfo.outputPath("products.png")
//        ตรวจด้วย fs.statSync(path).size ว่ามากกว่า 0 (เหมือนตัวอย่างที่ 1 แต่ไม่ต้องใส่ fullPage)
// ------------------------------------------------
test("ถ่ายภาพหน้าสินค้าเก็บเป็นไฟล์", async ({ page }, testInfo) => {
  await page.goto("/products");
  // รอ heading ก่อนถ่าย เพื่อไม่ให้ได้ภาพหน้าว่างตอนยังโหลดไม่เสร็จ
  await expect(page.getByRole("heading", { name: "สินค้าทั้งหมด" })).toBeVisible();

  // ใช้ testInfo.outputPath แทนชื่อไฟล์ตายตัว เพราะ test รันขนานกัน ไฟล์ต้องไม่ชนกับ test อื่น
  const path = testInfo.outputPath("products.png");
  await page.screenshot({ path });

  // ตรวจแค่ว่าไฟล์ถูกสร้างและไม่ว่าง (ไม่เทียบเนื้อภาพ นั่นคือเรื่องของบท 45)
  expect(fs.statSync(path).size).toBeGreaterThan(0);
});


// ------------------------------------------------
// ข้อ 2: ถ่ายเฉพาะส่วน Flash Sale และแนบเข้ารายงาน
// แนวทาง: goto("/") แล้วหา section ที่ชื่อ "Flash Sale" ด้วย getByRole("region", { name: "Flash Sale" })
//        ใช้ .screenshot() ของ locator นั้น แล้ว testInfo.attach("Flash Sale", { body, contentType: "image/png" })
//        ตรวจว่า buffer ไม่ว่าง (buffer.length มากกว่า 0)
// ------------------------------------------------
test("ถ่ายภาพเฉพาะส่วน Flash Sale", async ({ page }, testInfo) => {
  await page.goto("/");
  // <section> ที่มี aria-labelledby ชี้ไป h2 "Flash Sale" ได้ role region และชื่อ "Flash Sale"
  const flashSale = page.getByRole("region", { name: "Flash Sale" });
  await expect(flashSale).toBeVisible();

  // ไม่ใส่ path จึงได้ Buffer กลับมา เหมาะกับการแนบเข้ารายงานโดยไม่ต้องสร้างไฟล์เอง
  const buffer = await flashSale.screenshot();
  expect(buffer.length).toBeGreaterThan(0);
  await testInfo.attach("Flash Sale", { body: buffer, contentType: "image/png" });
});


// ------------------------------------------------
// ข้อ 3: เปรียบเทียบขนาดภาพ viewport กับภาพทั้งหน้า
// แนวทาง: goto("/") ถ่ายสองรอบเป็น Buffer: page.screenshot() กับ page.screenshot({ fullPage: true })
//        ภาพทั้งหน้ายาวกว่า จึงมีขนาดไฟล์ (buffer.length) มากกว่าภาพ viewport ตรวจด้วย toBeGreaterThan
//        แนบทั้งสองภาพด้วย testInfo.attach (ชื่อไม่ซ้ำกัน) แล้วเปิด pnpm report ดู
//        (หน้าแรกมีสินค้าแนะนำและ Flash Sale ยาวเกินจอ 1280x720 ภาพทั้งหน้าจึงสูงกว่า)
// ------------------------------------------------
test("ภาพทั้งหน้าใหญ่กว่าภาพเฉพาะส่วนที่เห็น", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "DN Shop", level: 1 })).toBeVisible();

  const viewportShot = await page.screenshot();
  const fullShot = await page.screenshot({ fullPage: true });

  // หน้าแรกยาวกว่าจอ 1280x720 ภาพทั้งหน้าจึงมีพิกเซลมากกว่า และไฟล์ PNG ใหญ่กว่าตามไปด้วย
  // (เทียบขนาดไฟล์เป็นวิธีหยาบๆ ที่พอสำหรับบทนี้ ไม่ได้อ่านความสูงของภาพตรงๆ)
  expect(fullShot.length).toBeGreaterThan(viewportShot.length);

  // ชื่อที่แนบต้องไม่ซ้ำกัน เพื่อให้แยกออกในรายงานว่าอันไหนคืออันไหน
  await testInfo.attach("เฉพาะที่เห็นในจอ", { body: viewportShot, contentType: "image/png" });
  await testInfo.attach("ทั้งหน้า", { body: fullShot, contentType: "image/png" });
});


// ------------------------------------------------
// ข้อ 4: ดูวิดีโอของการเพิ่มสินค้าลงตะกร้า
// แนวทาง: ไฟล์นี้อัดวิดีโออยู่แล้ว (test.use ด้านบนไฟล์) goto("/products") รอ heading "สินค้าทั้งหมด"
//        กด "เพิ่มลงตะกร้า" ของสินค้าแรก (ใช้ .first()) แล้วตรวจว่า role status ที่มีข้อความ "ลงตะกร้าแล้ว"
//        เห็นอยู่ (ใช้ filter({ hasText })) รันเสร็จเปิด test-results/ หาไฟล์ video.webm ของ test นี้ดู
// ------------------------------------------------
test("อัดวิดีโอตอนเพิ่มสินค้าลงตะกร้า", async ({ page }) => {
  // test.use({ video: "on" }) ด้านบนไฟล์ทำให้ test นี้อัดวิดีโออยู่แล้ว ไม่ต้องทำอะไรเพิ่มใน test
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "สินค้าทั้งหมด" })).toBeVisible();

  // ปุ่ม "เพิ่มลงตะกร้า" ปรากฏหลังโหลดรายการสินค้าเสร็จ (Playwright รอให้เอง)
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();

  // ข้อความสถานะมีชื่อสินค้าอยู่ด้วย จึงกรองด้วย hasText แทนการเทียบข้อความเต็ม
  // (กรองด้วย role status เพราะหน้านี้อาจมี status อื่น เช่น "กำลังโหลดสินค้า...")
  await expect(page.getByRole("status").filter({ hasText: "ลงตะกร้าแล้ว" })).toBeVisible();
  // หลังรันเสร็จ ไฟล์ video.webm ของ test นี้อยู่ในโฟลเดอร์ของ test ใต้ test-results/
});
