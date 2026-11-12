import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 18: CSS, XPath, and และ or
// ฝึก: page.locator("css"), page.locator("xpath=..."), locator.and(), locator.or()
// บทนี้ "ตั้งใจ" ใช้ CSS และ XPath ซึ่งปกติเลี่ยง (เหตุผลอยู่ใน README) ESLint จึงผ่อนกฎเฉพาะบทนี้
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: หาของชิ้นเดียวกันด้วย CSS, XPath และ getByRole
// ------------------------------------------------
test("หน้า /products หาการ์ดสินค้าด้วย CSS, XPath และ getByRole ได้ 10 ใบเท่ากัน", async ({ page }) => {
  await page.goto("/products");

  // CSS: <li> ที่เป็นลูกตรงๆ (>) ของ <ul> ที่มี attribute aria-label ตามที่ระบุ
  const byCss = page.locator('ul[aria-label="รายการสินค้า"] > li');
  // XPath: ขึ้นต้นด้วย xpath= (หรือ // ก็ถูกมองเป็น XPath เหมือนกัน แต่ใส่ xpath= ให้อ่านง่าย)
  const byXpath = page.locator('xpath=//ul[@aria-label="รายการสินค้า"]/li');
  // getByRole: วิธีที่แนะนำ อ่านง่ายที่สุด
  const byRole = page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem");

  await expect(byCss).toHaveCount(10);
  await expect(byXpath).toHaveCount(10);
  await expect(byRole).toHaveCount(10);

  // XPath ยกตัวอย่างสิ่งที่ CSS เดินขึ้นไปหา parent ตรงๆ ไม่ได้: ขึ้นไปหา parent (..)
  // เริ่มจาก heading ของเมาส์ แล้วขึ้นไป 1 ชั้นได้ <li> ของการ์ดเมาส์
  const mouseCard = page.getByRole("heading", { name: "เมาส์ไร้สาย" }).locator("xpath=..");
  await expect(mouseCard).toContainText("590 บาท");
});


// ------------------------------------------------
// ตัวอย่างที่ 2: แอปเปลี่ยน class แล้ว CSS พัง แต่ getByRole ไม่พัง
// ------------------------------------------------
test("เมื่อ class ถูกเปลี่ยน locator แบบ CSS พัง แต่ getByRole ยังหาเจอ", async ({ page }) => {
  await page.goto("/products");

  // โค้ดสองแบบที่หาของชิ้นเดียวกัน (การ์ดสินค้า) คนละวิธี
  const byCss = page.locator("li.product-card");
  const byRole = page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem");

  // ก่อนเปลี่ยน: ทั้งสองแบบเจอ 10 ใบ
  await expect(byCss).toHaveCount(10);
  await expect(byRole).toHaveCount(10);

  // จำลองว่านักพัฒนาแอปเปลี่ยนชื่อ class ตอนรีดีไซน์ (product-card -> item-card)
  // เราไม่แก้โค้ดแอปจริง แต่สั่งให้ browser เปลี่ยน class ของการ์ดทุกใบเอง
  await page.evaluate(() => {
    document.querySelectorAll("li.product-card").forEach((li) => {
      li.className = "item-card";
    });
  });

  // หลังเปลี่ยน: CSS หาไม่เจอสักใบ (test แบบนี้จะแดงทั้งที่หน้าเว็บใช้งานได้ปกติ)
  await expect(byCss).toHaveCount(0);
  // getByRole ยังเจอ 10 ใบ เพราะ <li> ยังเป็นรายการสินค้าเหมือนเดิม
  await expect(byRole).toHaveCount(10);
});


// ------------------------------------------------
// ตัวอย่างที่ 3: and และ or
// ------------------------------------------------
test("and รวมเงื่อนไขของ element เดียว และ or รับได้สองทาง", async ({ page }) => {
  await page.goto("/products");

  // and: ต้องเป็น element เดียวกันที่ตรงทั้งสอง locator (ไม่ใช่ element ที่อยู่ข้างใน)
  // ปุ่ม (button) ที่ข้อความ "สินค้าหมด" มีใบเดียว
  const soldOut = page.getByRole("button").and(page.getByText("สินค้าหมด"));
  await expect(soldOut).toHaveCount(1);
  await expect(soldOut).toBeDisabled();

  // or: element ที่ตรง locator ใดตัวหนึ่ง
  // ผู้เยี่ยมชมที่ยังไม่ login จะเห็นลิงก์ "เข้าสู่ระบบ" ส่วนคน login แล้วจะเห็นปุ่ม "ออกจากระบบ"
  // เขียนครั้งเดียวรองรับทั้งสองกรณี (ที่นี่ไม่ได้ login จึงเจอลิงก์)
  const loginOrLogout = page.getByRole("link", { name: "เข้าสู่ระบบ" }).or(page.getByRole("button", { name: "ออกจากระบบ" }));
  await expect(loginOrLogout).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: หน้า /products หาปุ่ม "เพิ่มลงตะกร้า" ด้วย CSS แล้วต้องเจอ 9 ปุ่ม
// แนวทาง: ปุ่มทั้งหมดในรายการหาได้ด้วย 'ul[aria-label="รายการสินค้า"] button' (เว้นวรรคหมายถึง "อยู่ข้างใน")
//        ปุ่ม 10 ใบรวม "สินค้าหมด" ต้องกรองให้เหลือ 9 ด้วย :not([disabled]) ต่อท้าย button เช่น button:not([disabled])
// ------------------------------------------------
test("หาปุ่มที่กดได้ในรายการสินค้าด้วย CSS", async ({ page }) => {
  await page.goto("/products");
  // เว้นวรรคระหว่าง ul กับ button = button อยู่ลึกแค่ไหนก็ได้ข้างใน ul; :not([disabled]) ตัดปุ่ม "สินค้าหมด" ออก
  const buttons = page.locator('ul[aria-label="รายการสินค้า"] button:not([disabled])');
  await expect(buttons).toHaveCount(9);
});


// ------------------------------------------------
// ข้อ 2: หน้า /products ใช้ XPath หา <li> ที่มีลิงก์ชื่อ "หมวกแก๊ป" แล้วตรวจว่ามีปุ่ม "สินค้าหมด" อยู่ข้างใน
// แนวทาง: ใช้ XPath แบบตัวอย่างที่ 1 (ขึ้นไปหา parent) หรือเขียน //li[.//a[text()="หมวกแก๊ป"]]
//        แล้วต่อ .getByRole("button", { name: "สินค้าหมด" }) ตรวจ toBeDisabled (เห็นไหมว่า locator ผสม XPath กับ getByRole ได้)
// ------------------------------------------------
test("หาการ์ดหมวกแก๊ปด้วย XPath", async ({ page }) => {
  await page.goto("/products");
  // XPath: <li> ที่ "มี" <a> ข้อความตรงกับ หมวกแก๊ป อยู่ข้างใน (.// = ค้นจากตำแหน่งปัจจุบันลงไปข้างใน)
  const card = page.locator('xpath=//li[.//a[text()="หมวกแก๊ป"]]');
  await expect(card).toHaveCount(1);
  // ผสม XPath กับ getByRole ได้ เพราะต่อ locator ได้เสมอ
  await expect(card.getByRole("button", { name: "สินค้าหมด" })).toBeDisabled();
});


// ------------------------------------------------
// ข้อ 3: หน้า /products ใช้ and หาลิงก์ (link) ที่มีข้อความ "หูฟังไร้สาย DN Buds" แล้วต้องเจอ 1 ตัว
// แนวทาง: page.getByRole("link").and(page.getByText("หูฟังไร้สาย DN Buds")) เหมือนตัวอย่างที่ 3
//        getByText หาจากข้อความที่แสดงเท่านั้น ไม่ดู alt ของรูป จึงตรงแค่ตัวลิงก์ ถ้าเจอมากกว่า 1 ให้ดูข้อความ error ว่า element ไหนบ้าง
// ------------------------------------------------
test("ใช้ and หาลิงก์หูฟัง", async ({ page }) => {
  await page.goto("/products");
  // and ต้องเป็น element เดียวกัน: ลิงก์ <a> ที่ข้อความตรง ส่วนรูปที่ alt เป็นชื่อเดียวกันไม่ใช่ลิงก์ จึงไม่เข้ามา
  const link = page.getByRole("link").and(page.getByText("หูฟังไร้สาย DN Buds"));
  await expect(link).toHaveCount(1);
});


// ------------------------------------------------
// ข้อ 4: เปิดหน้า /products?cookieBanner=1 (หน้านี้มี dialog คุกกี้โผล่มาช้า) ใช้ or รอปุ่ม "ยอมรับทั้งหมด" หรือ "ปฏิเสธ" อย่างใดอย่างหนึ่ง
// แนวทาง: banner โผล่หลังโหลดหน้า 0.5–2.5 วินาที ใช้ page.getByRole("button", { name: "ยอมรับทั้งหมด" }).or(page.getByRole("button", { name: "ปฏิเสธ" }))
//        ผลลัพธ์ตรงสองปุ่มพร้อมกัน ถ้าใช้ expect(...).toBeVisible() จะเจอ strict mode violation ให้ต่อ .first() ก่อน
// ------------------------------------------------
test("ใช้ or รอปุ่มของ dialog คุกกี้", async ({ page }) => {
  await page.goto("/products?cookieBanner=1");
  // dialog โผล่ช้า 0.5–2.5 วินาที expect รอให้เอง ไม่ต้องหน่วงเวลา
  // ทั้งสองปุ่มโผล่พร้อมกัน or จึงตรง 2 element ต้อง .first() ไม่งั้นเจอ strict mode violation
  const consentButton = page
    .getByRole("button", { name: "ยอมรับทั้งหมด" })
    .or(page.getByRole("button", { name: "ปฏิเสธ" }))
    .first();
  await expect(consentButton).toBeVisible();
});
