import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 45: เทียบภาพหน้าจอ (visual comparison)
// ฝึก: toHaveScreenshot, --update-snapshots, mask, maxDiffPixelRatio
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// รันด้วย: pnpm test --config lessons/45-visual-comparison/playwright.config.ts
// ================================================


// ------------------------------------------------
// ตัวอย่าง: เทียบภาพหน้าแรก โดย mask ส่วนที่เปลี่ยนตลอด
// ตัวอย่างนี้ห่อด้วย test.fixme เพราะต้องมีภาพต้นแบบก่อนถึงจะเทียบได้
// ให้ทำตามขั้นตอนในหัวข้อ "ทำทีละขั้น" ของ README (เปลี่ยน test.fixme เป็น test, สร้างภาพต้นแบบ, รันซ้ำ)
// ------------------------------------------------
// (เฉลย: เปลี่ยนจาก test.fixme เป็น test แล้ว ต้องสร้างภาพต้นแบบก่อนด้วย --update-snapshots)
test("หน้าแรกหน้าตาไม่เปลี่ยน (ไม่นับส่วนที่เปลี่ยนตลอด)", async ({ page }) => {
  await page.goto("/");

  // คำทักทาย วันที่ และ timer เปลี่ยนตามเวลาจริง ส่วนที่แสดงจะเกิดหลังหน้า hydrate เสร็จ
  // รอให้ข้อความขึ้นก่อน (สถานะที่ขึ้นแล้วไม่หายไป) ไม่งั้นความสูงของหน้าอาจไม่เท่ากันระหว่างรอบ
  const greeting = page.getByTestId("greeting");
  const today = page.getByTestId("today");
  const timer = page.getByRole("timer", { name: "เวลาที่เหลือ" });
  await expect(greeting).not.toBeEmpty();
  await expect(today).not.toBeEmpty();
  await expect(timer).not.toBeEmpty();

  // mask: ทาสี่เหลี่ยมสีชมพูทับ element เหล่านี้ทั้งตอนสร้างภาพต้นแบบและตอนเทียบ จึงไม่นับความต่างในส่วนนั้น
  await expect(page).toHaveScreenshot("home.png", { mask: [greeting, today, timer] });
});


// ------------------------------------------------
// ข้อ 1: เทียบภาพหน้าเข้าสู่ระบบ
// แนวทาง: goto("/login") รอให้ heading "เข้าสู่ระบบ" (level 1) เห็นอยู่ แล้ว
//        await expect(page).toHaveScreenshot("login.png") หน้านี้ไม่มีส่วนที่เปลี่ยนตลอดจึงไม่ต้องใช้ mask
//        รันครั้งแรกด้วย --update-snapshots เพื่อสร้างภาพต้นแบบ แล้วรันปกติอีกครั้ง
// ------------------------------------------------
test("หน้าเข้าสู่ระบบหน้าตาไม่เปลี่ยน", async ({ page }) => {
  await page.goto("/login");
  // รอ heading ก่อนถ่าย เพื่อให้ภาพต้นแบบเป็นภาพของหน้าที่วาดเสร็จแล้ว
  await expect(page.getByRole("heading", { name: "เข้าสู่ระบบ", level: 1 })).toBeVisible();
  // หน้านี้ไม่มีส่วนที่เปลี่ยนตามเวลา จึงไม่ต้อง mask (ใช้เกณฑ์ maxDiffPixelRatio จาก config)
  await expect(page).toHaveScreenshot("login.png");
});


// ------------------------------------------------
// ข้อ 2: เทียบภาพเฉพาะ element
// แนวทาง: goto("/") แล้วใช้ toHaveScreenshot กับ locator ของ nav "เมนูหลัก" (getByRole("navigation", { name: "เมนูหลัก" }))
//        ตั้งชื่อภาพ "main-nav.png" ภาพเฉพาะส่วนเล็กกว่าและนิ่งกว่าภาพทั้งหน้า จึงเหมาะกับการเฝ้าดูส่วนสำคัญ
// ------------------------------------------------
test("เมนูหลักหน้าตาไม่เปลี่ยน", async ({ page }) => {
  await page.goto("/");
  // ใช้ toHaveScreenshot กับ locator จะถ่ายและเทียบเฉพาะกรอบของ nav ภาพเล็ก เทียบเร็ว และไม่โดนส่วนอื่นของหน้ารบกวน
  // (ในนี้มีจำนวนในตะกร้า ซึ่งเป็น 0 เสมอเพราะแต่ละ test ใช้ browser context ใหม่ของตัวเอง)
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" })).toHaveScreenshot("main-nav.png");
});


// ------------------------------------------------
// ข้อ 3: เทียบภาพหน้าแรกทั้งหน้า พร้อม mask และเกณฑ์ที่เข้มกว่า config
// แนวทาง: เหมือนตัวอย่าง แต่เพิ่ม fullPage: true และ maxDiffPixelRatio: 0.002 ใน option ของ toHaveScreenshot
//        (option ที่ใส่ใน test ทับค่าที่ตั้งใน config) ตั้งชื่อภาพ "home-full.png"
//        รอให้ข้อความของ greeting, today, timer ขึ้นก่อนถ่ายเหมือนตัวอย่าง
// ------------------------------------------------
test("หน้าแรกทั้งหน้าหน้าตาไม่เปลี่ยน", async ({ page }) => {
  await page.goto("/");

  const greeting = page.getByTestId("greeting");
  const today = page.getByTestId("today");
  const timer = page.getByRole("timer", { name: "เวลาที่เหลือ" });
  // รอข้อความขึ้นก่อน (ขึ้นหลัง hydrate และไม่หายไปอีก) ไม่งั้นความสูงของหน้าอาจต่างกันระหว่างรอบ
  await expect(greeting).not.toBeEmpty();
  await expect(today).not.toBeEmpty();
  await expect(timer).not.toBeEmpty();

  await expect(page).toHaveScreenshot("home-full.png", {
    fullPage: true, // ถ่ายทั้งหน้า รวมสินค้าแนะนำที่ต้องเลื่อนลงไปดู
    mask: [greeting, today, timer], // ซ่อนสามส่วนที่เปลี่ยนตามเวลาจริง
    maxDiffPixelRatio: 0.002, // เข้มกว่า 0.01 ใน config: ยอมต่างได้แค่ 0.2% (ค่าใน test ทับค่าใน config)
  });
});
