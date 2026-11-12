import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 47: Accessibility (การเข้าถึงสำหรับทุกคน)
// ฝึก: toHaveRole, toHaveAccessibleName, toHaveAccessibleDescription, @axe-core/playwright (AxeBuilder)
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: role และชื่อ (accessible name) ของ element บนหน้าแรก
// ------------------------------------------------
test("หน้าแรกมี role และชื่อที่โปรแกรมอ่านหน้าจออ่านได้ถูกต้อง", async ({ page }) => {
  await page.goto("/");

  // toHaveRole ตรวจ role ที่ browser คำนวณให้ element นั้น (role ที่โปรแกรมอ่านหน้าจอเห็น)
  const nav = page.getByRole("navigation", { name: "เมนูหลัก" });
  await expect(nav).toHaveRole("navigation");
  await expect(page.getByRole("heading", { name: "DN Shop", level: 1 })).toHaveRole("heading");

  // toHaveAccessibleName ตรวจชื่อที่โปรแกรมอ่านหน้าจอจะอ่านออกเสียงให้ element นั้น
  // ใส่ regular expression ได้เมื่อชื่อมีส่วนที่เปลี่ยน (จำนวนในตะกร้า)
  await expect(nav.getByRole("link", { name: /ตะกร้า/ })).toHaveAccessibleName(/^ตะกร้า \(\d+\)$/);
  // timer ของ Flash Sale ได้ชื่อจาก aria-label
  await expect(page.getByRole("timer")).toHaveAccessibleName("เวลาที่เหลือ");
});


// ------------------------------------------------
// ตัวอย่างที่ 2: ให้ axe ตรวจหน้าแรก ต้องไม่พบปัญหาเลย
// ------------------------------------------------
test("หน้าแรกไม่มีปัญหา accessibility ที่ axe ตรวจเจอ", async ({ page }) => {
  await page.goto("/");
  // รอให้คำทักทายขึ้น (เกิดหลังหน้า hydrate เสร็จ) เพื่อให้แน่ใจว่าหน้าอยู่ในสภาพสุดท้ายแล้วค่อยตรวจ
  await expect(page.getByTestId("greeting")).not.toBeEmpty();

  // AxeBuilder รับ page แล้ว analyze() ตรวจหน้าปัจจุบันด้วยกฎชุดมาตรฐานของ axe-core
  const results = await new AxeBuilder({ page }).analyze();

  // results.violations คือรายการปัญหาที่เจอ หน้าที่ผ่านต้องได้ array ว่าง
  // (ถ้ามีปัญหา expect จะพิมพ์ทั้งรายการ ซึ่งมี id ของกฎ คำอธิบาย และ element ที่เกี่ยวข้อง)
  expect(results.violations).toEqual([]);
});


// ------------------------------------------------
// ข้อ 1: role และชื่อของฟอร์มเข้าสู่ระบบ
// แนวทาง: goto("/login") ใช้ getByLabel("อีเมล") และ getByLabel("รหัสผ่าน")
//        ตรวจ toHaveRole("textbox") ของช่องอีเมล และ toHaveAccessibleName("อีเมล") ของทั้งสองช่อง
//        ปุ่ม "เข้าสู่ระบบ" (getByRole("button", ...)) ตรวจ toHaveRole("button")
//        (เหมือนตัวอย่างที่ 1 แต่ใช้กับฟอร์ม)
// ------------------------------------------------
test("ช่องกรอกและปุ่มในฟอร์มเข้าสู่ระบบมี role และชื่อถูกต้อง", async ({ page }) => {
  await page.goto("/login");

  const email = page.getByLabel("อีเมล");
  const password = page.getByLabel("รหัสผ่าน");
  // getByLabel หาช่องจากชื่อ แล้ว toHaveAccessibleName ยืนยันว่าชื่อที่โปรแกรมอ่านหน้าจอได้ก็คือชื่อนั้นจริง
  await expect(email).toHaveRole("textbox");
  await expect(email).toHaveAccessibleName("อีเมล");
  await expect(password).toHaveAccessibleName("รหัสผ่าน");

  await expect(page.getByRole("button", { name: "เข้าสู่ระบบ" })).toHaveRole("button");
});


// ------------------------------------------------
// ข้อ 2: คำอธิบาย (accessible description) ของช่องรหัสผ่านในฟอร์มสมัครสมาชิก
// แนวทาง: goto("/register") หาช่องด้วย getByLabel("รหัสผ่าน", { exact: true }) (ต้อง exact เพราะมี "ยืนยันรหัสผ่าน" ด้วย)
//        ตรวจ toHaveAccessibleName("รหัสผ่าน") และ toHaveAccessibleDescription("อย่างน้อย 8 ตัวอักษร")
//        คำอธิบายมาจาก aria-describedby ที่ชี้ไป <small> ใต้ช่อง
// ------------------------------------------------
test("ช่องรหัสผ่านมีคำอธิบายว่าอย่างน้อย 8 ตัวอักษร", async ({ page }) => {
  await page.goto("/register");

  // exact: true เพราะ "ยืนยันรหัสผ่าน" ก็มีคำว่า "รหัสผ่าน" อยู่ในชื่อ ถ้าไม่ใส่จะตรงสองช่อง
  const password = page.getByLabel("รหัสผ่าน", { exact: true });
  await expect(password).toHaveAccessibleName("รหัสผ่าน");
  // คำอธิบายมาจาก aria-describedby="password-hint" ที่ชี้ไปหา <small> ใต้ช่อง
  await expect(password).toHaveAccessibleDescription("อย่างน้อย 8 ตัวอักษร");
});


// ------------------------------------------------
// ข้อ 3: หน้า /playground/a11y มีปัญหาที่ตั้งใจไว้
// แนวทาง: goto("/playground/a11y") รอ heading "หน้านี้มีปัญหา accessibility โดยตั้งใจ" (level 1) แล้ว analyze() ด้วย AxeBuilder
//        เก็บ id ของกฎที่พบด้วย results.violations.map((v) => v.id) (ต่อ .sort() เพื่อเรียงให้แน่นอน)
//        แล้ว toEqual ให้ตรงกับ 4 ข้อ: "button-name", "color-contrast", "image-alt", "label"
//        (id เหล่านี้ได้จากการรันจริงบนหน้านี้ ดูคำอธิบายแต่ละข้อใน README)
// ------------------------------------------------
test("หน้า playground a11y ถูกตรวจเจอปัญหาตามที่ตั้งใจไว้", async ({ page }) => {
  await page.goto("/playground/a11y");
  await expect(page.getByRole("heading", { name: "หน้านี้มีปัญหา accessibility โดยตั้งใจ", level: 1 })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();

  // เทียบเฉพาะ id ของกฎ (ไม่เทียบทั้งก้อน เพราะรายละเอียดอย่าง HTML และข้อความอธิบายเปลี่ยนตามเวอร์ชันของ axe)
  // .sort() ให้ลำดับแน่นอน ไม่ขึ้นกับลำดับที่ axe คืนมา
  expect(results.violations.map((v) => v.id).sort()).toEqual(["button-name", "color-contrast", "image-alt", "label"]);
});


// ------------------------------------------------
// ข้อ 4: หน้าสินค้ากับหน้าเข้าสู่ระบบต้องผ่าน axe และจำกัดการตรวจเฉพาะบางส่วน
// แนวทาง: สอง test ในข้อเดียว: (ก) goto("/products") รอ heading "สินค้าทั้งหมด" แล้วตรวจว่า violations เป็น []
//        (ข) goto("/login") แล้วใช้ new AxeBuilder({ page }).include("main") เพื่อตรวจเฉพาะใน <main>
//        include รับ selector ของส่วนที่จะตรวจ (นี่คือ API ของ axe ไม่ใช่การหา locator ของ Playwright)
//        ผลต้องเป็น [] เหมือนกัน
// ------------------------------------------------
test("หน้าสินค้าผ่าน axe และหน้าเข้าสู่ระบบผ่าน axe เฉพาะส่วน main", async ({ page }) => {
  await page.goto("/products");
  // รอ heading และรายการสินค้าก่อนตรวจ เพราะ /products โหลดรายการสินค้าภายหลัง
  // ถ้าตรวจตอนยังเป็นข้อความ "กำลังโหลดสินค้า..." จะไม่ได้ตรวจการ์ดสินค้าเลย
  await expect(page.getByRole("heading", { name: "สินค้าทั้งหมด" })).toBeVisible();
  await expect(page.getByRole("img").first()).toBeVisible();
  const productsResults = await new AxeBuilder({ page }).analyze();
  expect(productsResults.violations).toEqual([]);

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "เข้าสู่ระบบ", level: 1 })).toBeVisible();
  // include("main") จำกัดการตรวจเฉพาะส่วนนั้น (เป็น selector ของ axe ไม่ใช่ locator ของ Playwright)
  const loginResults = await new AxeBuilder({ page }).include("main").analyze();
  expect(loginResults.violations).toEqual([]);
});
