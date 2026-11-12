import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 43: หลาย browser และการจำลองสภาพแวดล้อม (emulation)
// ฝึก: projects หลาย browser, isMobile, colorScheme, locale, timezoneId + page.clock, geolocation + permissions, setOffline
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// รันด้วย: pnpm test --config lessons/43-browsers-emulation/playwright.config.ts
// ต้องติดตั้ง browser เพิ่มก่อน: pnpm exec playwright install firefox webkit
// ================================================

// แนวคิด: config ของบทนี้มี 4 project (chromium, firefox, webkit, Mobile Safari) ทุก test จึงรันซ้ำ 4 รอบ
// ส่วนการ "จำลอง" (ภาษา เขตเวลา โหมดมืด ตำแหน่ง ออฟไลน์ ขนาดจอ) ตั้งได้ใน use ของ config หรือ test.use ในไฟล์นี้
// โค้ดใน test ต้องใช้ได้กับทุก browser เหมือนกัน เว้นแต่จะบอกไว้ชัดเจน


// ------------------------------------------------
// ตัวอย่างที่ 1: โหมดมืด (colorScheme)
// ------------------------------------------------
test.describe("โหมดมืด", () => {
  // จำลอง prefers-color-scheme: dark ให้ทุก test ในกลุ่มนี้
  test.use({ colorScheme: "dark" });

  test("พื้นหลังหน้าเว็บเป็นสีเข้ม", async ({ page }) => {
    await page.goto("/");
    // ค่า style ที่ browser คำนวณแล้ว (computed) ของ body
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(17, 24, 39)");
  });
});


// ------------------------------------------------
// ตัวอย่างที่ 2: เมนูเปลี่ยนตามอุปกรณ์ของ project
// ------------------------------------------------
test("หัวเว็บแสดงเมนูต่างกันระหว่างจอใหญ่กับมือถือ", async ({ page, isMobile }) => {
  // isMobile เป็น fixture ที่อ่านจาก use.isMobile ของ project (devices["iPhone 15"] ตั้งเป็น true)
  await page.goto("/");

  // toBeVisible({ visible }) ตรวจว่า "เห็น" หรือ "ไม่เห็น" ตามค่าที่ส่งเข้าไป จึงไม่ต้องเขียน if ครอบ expect
  // มือถือ (จอแคบกว่า 768px): แอปซ่อน nav แล้วแสดงปุ่ม "เปิดเมนู"  /  จอกว้าง: เห็น nav และไม่เห็นปุ่ม
  await expect(page.getByRole("button", { name: "เปิดเมนู" })).toBeVisible({ visible: isMobile });
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" }).getByRole("link", { name: "สินค้า" })).toBeVisible({
    visible: !isMobile,
  });
});


// ------------------------------------------------
// ข้อ 1: บังคับ viewport มือถือเอง
// ------------------------------------------------
test.describe("ข้อ 1: viewport มือถือ", () => {
  // viewport ที่ test.use ทับ viewport ของ project จึงได้ผลเหมือนกันทั้ง 4 project
  test.use({ viewport: { width: 390, height: 844 } });

  test("จอ 390x844 เห็นปุ่มเปิดเมนู", async ({ page }) => {
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "เปิดเมนู" });
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await menuButton.click();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });
});


// ------------------------------------------------
// ข้อ 2: เปลี่ยนภาษาเป็น en-US
// ------------------------------------------------
test.describe("ข้อ 2: locale en-US", () => {
  test.use({ locale: "en-US" });

  test("วันที่บนหน้าแรกเป็นภาษาอังกฤษ", async ({ page }) => {
    await page.goto("/");

    // วันที่เปลี่ยนทุกวัน จึงตรวจ "รูปแบบ" แทนค่า: ชื่อวัน, ชื่อเดือน วันที่, ปี (ภาษาไทยจะไม่ตรง regex นี้)
    await expect(page.getByTestId("today")).toHaveText(/^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}$/);
  });
});


// ------------------------------------------------
// ข้อ 3: เขตเวลา + page.clock เห็นคำทักทายต่างกัน
// ------------------------------------------------
test.describe("ข้อ 3: เขตเวลา Asia/Bangkok", () => {
  test.use({ timezoneId: "Asia/Bangkok" });

  test("เวลาเดียวกัน ที่กรุงเทพเป็นตอนเช้า", async ({ page }) => {
    // ตั้งเวลาปลอมก่อน goto: 01:00 UTC = 08:00 ที่กรุงเทพ (UTC+7)
    await page.clock.install({ time: new Date("2026-06-01T01:00:00Z") });
    await page.goto("/");
    await expect(page.getByTestId("greeting")).toHaveText("สวัสดีตอนเช้า");
  });
});

test.describe("ข้อ 3: เขตเวลา America/New_York", () => {
  test.use({ timezoneId: "America/New_York" });

  test("เวลาเดียวกัน ที่นิวยอร์กเป็นตอนเย็น", async ({ page }) => {
    // 01:00 UTC เดียวกัน = 21:00 ของวันก่อนที่นิวยอร์ก (UTC-4 ช่วง daylight saving) คำทักทายจึงต่างกัน
    await page.clock.install({ time: new Date("2026-06-01T01:00:00Z") });
    await page.goto("/");
    await expect(page.getByTestId("greeting")).toHaveText("สวัสดีตอนเย็น");
  });
});


// ------------------------------------------------
// ข้อ 4: ตำแหน่งที่ตั้ง (geolocation) และ permission
// ------------------------------------------------
test.describe("ข้อ 4: geolocation", () => {
  // geolocation กำหนดพิกัด ส่วน permissions ต้องอนุญาตให้ด้วย ไม่งั้นเว็บจะถูกปฏิเสธและแสดง alert "ไม่ได้รับอนุญาต..."
  test.use({ geolocation: { latitude: 13.7563, longitude: 100.5018 }, permissions: ["geolocation"] });

  test("หาสาขาใกล้ฉันได้สาขาสยาม", async ({ page }) => {
    await page.goto("/stores");
    await page.getByRole("button", { name: "หาสาขาใกล้ฉัน" }).click();

    // กรอง status ด้วยข้อความ เพราะหน้าอาจมี role=status อื่นอยู่ด้วย
    await expect(page.getByRole("status").filter({ hasText: "สาขาที่ใกล้ที่สุดคือ สาขาสยาม" })).toBeVisible();
  });
});


// ------------------------------------------------
// ข้อ 5: ออฟไลน์
// ------------------------------------------------
test("ออฟไลน์แล้วแอปแสดงแถบแจ้งเตือน", async ({ page, context }) => {
  await page.goto("/");
  const banner = page.getByRole("status").filter({ hasText: "ไม่มีการเชื่อมต่ออินเทอร์เน็ต" });
  await expect(banner).toBeHidden();

  // setOffline เป็นของ context (ไม่ใช่ page) หน้าทั้งหมดใน context นี้จะออฟไลน์
  await context.setOffline(true);
  await expect(banner).toBeVisible();

  await context.setOffline(false);
  await expect(banner).toBeHidden();
});
