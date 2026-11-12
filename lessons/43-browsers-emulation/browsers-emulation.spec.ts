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
// แนวทาง: ใน test.describe ใส่ test.use({ viewport: { width: 390, height: 844 } }) แล้ว goto("/")
//        ตรวจว่าปุ่ม "เปิดเมนู" เห็นอยู่ (ได้ผลทุก project เพราะ viewport ทับค่าของ project)
//        ลองกดปุ่มแล้วตรวจว่า aria-expanded เป็น "true" ด้วย (toHaveAttribute)
// ------------------------------------------------
test.describe("ข้อ 1: viewport มือถือ", () => {
  // 👉 ใส่ test.use({ viewport: ... }) ที่นี่

  test.fixme("จอ 390x844 เห็นปุ่มเปิดเมนู", async ({ page }) => {
    // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });
});


// ------------------------------------------------
// ข้อ 2: เปลี่ยนภาษาเป็น en-US
// แนวทาง: test.use({ locale: "en-US" }) แล้ว goto("/") ข้อความใน data-testid="today" ต้องเป็นภาษาอังกฤษ
//        อย่าเทียบวันที่ตรงๆ (วันที่เปลี่ยนทุกวัน) ใช้ regex เช่น /^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}$/
//        (หน้าแรกสร้างวันที่ด้วย Intl.DateTimeFormat(navigator.language, { dateStyle: "full" }) ได้ประมาณ "Thursday, November 12, 2026")
// ------------------------------------------------
test.describe("ข้อ 2: locale en-US", () => {
  // 👉 ใส่ test.use({ locale: ... }) ที่นี่

  test.fixme("วันที่บนหน้าแรกเป็นภาษาอังกฤษ", async ({ page }) => {
    // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });
});


// ------------------------------------------------
// ข้อ 3: เขตเวลา + page.clock เห็นคำทักทายต่างกัน
// แนวทาง: ใช้ page.clock.install({ time: new Date("2026-06-01T01:00:00Z") }) ก่อน goto("/") (เวลาเดียวกันทั่วโลก)
//        กลุ่มแรก test.use({ timezoneId: "Asia/Bangkok" }) (ตรงกับ 08:00) ตรวจ greeting "สวัสดีตอนเช้า"
//        กลุ่มสอง test.use({ timezoneId: "America/New_York" }) (ตรงกับ 21:00) ตรวจ greeting "สวัสดีตอนเย็น"
// ------------------------------------------------
test.describe("ข้อ 3: เขตเวลา Asia/Bangkok", () => {
  // 👉 ใส่ test.use({ timezoneId: ... }) ที่นี่

  test.fixme("เวลาเดียวกัน ที่กรุงเทพเป็นตอนเช้า", async ({ page }) => {
    // 👉 เขียน test ของข้อ 3 (กรุงเทพ) ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });
});

test.describe("ข้อ 3: เขตเวลา America/New_York", () => {
  // 👉 ใส่ test.use({ timezoneId: ... }) ที่นี่

  test.fixme("เวลาเดียวกัน ที่นิวยอร์กเป็นตอนเย็น", async ({ page }) => {
    // 👉 เขียน test ของข้อ 3 (นิวยอร์ก) ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });
});


// ------------------------------------------------
// ข้อ 4: ตำแหน่งที่ตั้ง (geolocation) และ permission
// แนวทาง: test.use({ geolocation: { latitude: 13.7563, longitude: 100.5018 }, permissions: ["geolocation"] })
//        goto("/stores") กดปุ่ม "หาสาขาใกล้ฉัน" ตรวจ role status ที่มีข้อความ "สาขาที่ใกล้ที่สุดคือ สาขาสยาม"
//        (พิกัดนี้อยู่กรุงเทพ) ถ้ารู้สึกอยากลอง ลองเปลี่ยนเป็นพิกัดเชียงใหม่ 18.7883, 98.9853
// ------------------------------------------------
test.describe("ข้อ 4: geolocation", () => {
  // 👉 ใส่ test.use({ geolocation: ..., permissions: ... }) ที่นี่

  test.fixme("หาสาขาใกล้ฉันได้สาขาสยาม", async ({ page }) => {
    // 👉 เขียน test ของข้อ 4 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });
});


// ------------------------------------------------
// ข้อ 5: ออฟไลน์
// แนวทาง: goto("/") แล้วสั่ง context.setOffline(true) (รับ context จาก fixture) ตรวจ role status
//        "ไม่มีการเชื่อมต่ออินเทอร์เน็ต" เห็นอยู่ จากนั้น setOffline(false) แล้วตรวจว่าข้อความนั้นหายไป (toBeHidden)
// ------------------------------------------------
test.fixme("ออฟไลน์แล้วแอปแสดงแถบแจ้งเตือน", async ({ page, context }) => {
  // 👉 เขียน test ของข้อ 5 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
