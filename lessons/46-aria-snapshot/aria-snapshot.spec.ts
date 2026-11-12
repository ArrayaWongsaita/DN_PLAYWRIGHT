import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 46: เทียบโครงสร้างหน้าด้วย aria snapshot
// ฝึก: toMatchAriaSnapshot, locator.ariaSnapshot, --update-snapshots
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: โครงสร้างของเมนูหลัก
// ------------------------------------------------
test("เมนูหลักมีลิงก์ครบตามลำดับ", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "เมนูหลัก" });

  // toMatchAriaSnapshot เทียบ "โครงสร้างตามความหมาย" (role + ชื่อ) ของ element กับ template แบบ YAML
  // บรรทัดที่ขึ้นต้น "- " คือหนึ่ง node: role ตามด้วยชื่อในเครื่องหมายคำพูด และลูกๆ ย่อหน้าเข้าไป
  // ชื่อที่เปลี่ยนได้ (เช่นจำนวนในตะกร้า) เขียนเป็น regular expression ระหว่างเครื่องหมาย / /
  await expect(nav).toMatchAriaSnapshot(`
    - navigation "เมนูหลัก":
      - link "หน้าแรก"
      - link "สินค้า"
      - link /ตะกร้า/
      - link "เข้าสู่ระบบ"
  `);
});


// ------------------------------------------------
// ตัวอย่างที่ 2: โครงสร้างของฟอร์มเข้าสู่ระบบ
// ------------------------------------------------
test("ฟอร์มเข้าสู่ระบบมีช่องกรอกและปุ่มที่ถูกปิดอยู่ตอนเริ่ม", async ({ page }) => {
  await page.goto("/login");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "เข้าสู่ระบบ", level: 1 })).toBeVisible();

  // [level=1] และ [disabled] คือ attribute ของ node ปุ่มจะ disabled จนกว่าจะกรอกทั้งอีเมลและรหัสผ่าน
  // ข้อความที่ไม่ได้เป็น element (เช่นข้อความ label) ไม่ต้องเขียนใน template
  await expect(main).toMatchAriaSnapshot(`
    - main:
      - heading "เข้าสู่ระบบ" [level=1]
      - textbox "อีเมล"
      - textbox "รหัสผ่าน"
      - button "เข้าสู่ระบบ" [disabled]
  `);
});


// ------------------------------------------------
// ข้อ 1: โครงสร้างของส่วนท้ายหน้า (footer)
// แนวทาง: goto("/") แล้วใช้ locator getByRole("contentinfo") (footer ของหน้ามี role นี้)
//        เขียน template: node "contentinfo" ที่มีลิงก์ "สาขาของเรา" และ "Playground" (ย่อหน้าซ้อนใน paragraph)
//        ถ้าไม่รู้โครงสร้าง ให้ลอง console.log(await footer.ariaSnapshot()) ดูก่อน
// ------------------------------------------------
test.fixme("ส่วนท้ายหน้ามีลิงก์สาขาของเราและ Playground", async ({ page }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: ฟอร์มเข้าสู่ระบบหลังกรอกข้อมูล
// แนวทาง: goto("/login") กรอกอีเมลและรหัสผ่านด้วย getByLabel แล้วตรวจ toMatchAriaSnapshot ของ main
//        ช่องกรอกจะแสดงค่าที่กรอกต่อท้ายชื่อ เช่น - textbox "อีเมล": ค่าที่กรอก
//        ปุ่ม "เข้าสู่ระบบ" ไม่ disabled แล้ว (เขียนแค่ - button "เข้าสู่ระบบ")
//        ก่อนตรวจ snapshot ให้ expect(ปุ่ม).toBeEnabled() เพื่อให้แน่ใจว่ากรอกครบแล้ว
// ------------------------------------------------
test.fixme("ฟอร์มเข้าสู่ระบบหลังกรอกแสดงค่าที่กรอก", async ({ page }) => {
  // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: กลุ่มหมวดที่สนใจในฟอร์มสมัครสมาชิก
// แนวทาง: goto("/register") ใช้ locator getByRole("group", { name: "หมวดที่สนใจ" })
//        ติ๊ก checkbox "หนังสือ" ด้วย check() แล้วเขียน template ของ group นี้:
//        มี checkbox "อุปกรณ์ไอที", "เสื้อผ้า", "ของใช้ในบ้าน" (ยังไม่ติ๊ก) และ "หนังสือ" ที่มี [checked]
//        ลองรัน aria snapshot ของ group (ariaSnapshot()) เพื่อดูว่า checkbox แต่ละอันเขียนยังไง
// ------------------------------------------------
test.fixme("ติ๊กหมวดหนังสือแล้ว snapshot แสดงว่า checked", async ({ page }) => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
