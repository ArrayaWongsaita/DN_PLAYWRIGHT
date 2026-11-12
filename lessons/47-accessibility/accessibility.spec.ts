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
test.fixme("ช่องกรอกและปุ่มในฟอร์มเข้าสู่ระบบมี role และชื่อถูกต้อง", async ({ page }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: คำอธิบาย (accessible description) ของช่องรหัสผ่านในฟอร์มสมัครสมาชิก
// แนวทาง: goto("/register") หาช่องด้วย getByLabel("รหัสผ่าน", { exact: true }) (ต้อง exact เพราะมี "ยืนยันรหัสผ่าน" ด้วย)
//        ตรวจ toHaveAccessibleName("รหัสผ่าน") และ toHaveAccessibleDescription("อย่างน้อย 8 ตัวอักษร")
//        คำอธิบายมาจาก aria-describedby ที่ชี้ไป <small> ใต้ช่อง
// ------------------------------------------------
test.fixme("ช่องรหัสผ่านมีคำอธิบายว่าอย่างน้อย 8 ตัวอักษร", async ({ page }) => {
  // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: หน้า /playground/a11y มีปัญหาที่ตั้งใจไว้
// แนวทาง: goto("/playground/a11y") รอ heading "หน้านี้มีปัญหา accessibility โดยตั้งใจ" (level 1) แล้ว analyze() ด้วย AxeBuilder
//        เก็บ id ของกฎที่พบด้วย results.violations.map((v) => v.id) (ต่อ .sort() เพื่อเรียงให้แน่นอน)
//        แล้ว toEqual ให้ตรงกับ 4 ข้อ: "button-name", "color-contrast", "image-alt", "label"
//        (id เหล่านี้ได้จากการรันจริงบนหน้านี้ ดูคำอธิบายแต่ละข้อใน README)
// ------------------------------------------------
test.fixme("หน้า playground a11y ถูกตรวจเจอปัญหาตามที่ตั้งใจไว้", async ({ page }) => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 4: หน้าสินค้ากับหน้าเข้าสู่ระบบต้องผ่าน axe และจำกัดการตรวจเฉพาะบางส่วน
// แนวทาง: สอง test ในข้อเดียว: (ก) goto("/products") รอ heading "สินค้าทั้งหมด" แล้วตรวจว่า violations เป็น []
//        (ข) goto("/login") แล้วใช้ new AxeBuilder({ page }).include("main") เพื่อตรวจเฉพาะใน <main>
//        include รับ selector ของส่วนที่จะตรวจ (นี่คือ API ของ axe ไม่ใช่การหา locator ของ Playwright)
//        ผลต้องเป็น [] เหมือนกัน
// ------------------------------------------------
test.fixme("หน้าสินค้าผ่าน axe และหน้าเข้าสู่ระบบผ่าน axe เฉพาะส่วน main", async ({ page }) => {
  // 👉 เขียน test ของข้อ 4 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
