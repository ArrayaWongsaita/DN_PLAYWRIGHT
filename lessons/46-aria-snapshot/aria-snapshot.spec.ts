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
test("ส่วนท้ายหน้ามีลิงก์สาขาของเราและ Playground", async ({ page }) => {
  await page.goto("/");
  // <footer> ที่อยู่ใน body โดยตรงมี role contentinfo
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Playground" })).toBeVisible();

  // ลิงก์ทั้งสองอยู่ใน <p> เดียวกัน จึงซ้อนอยู่ใต้ paragraph
  // ข้ามข้อความลิขสิทธิ์และเครื่องหมาย "·" ไปเลย เพราะไม่ใช่สิ่งที่ต้องการเฝ้า (template เทียบแบบบางส่วน)
  await expect(footer).toMatchAriaSnapshot(`
    - contentinfo:
      - paragraph:
        - link "สาขาของเรา"
        - link "Playground"
  `);
});


// ------------------------------------------------
// ข้อ 2: ฟอร์มเข้าสู่ระบบหลังกรอกข้อมูล
// แนวทาง: goto("/login") กรอกอีเมลและรหัสผ่านด้วย getByLabel แล้วตรวจ toMatchAriaSnapshot ของ main
//        ช่องกรอกจะแสดงค่าที่กรอกต่อท้ายชื่อ เช่น - textbox "อีเมล": ค่าที่กรอก
//        ปุ่ม "เข้าสู่ระบบ" ไม่ disabled แล้ว (เขียนแค่ - button "เข้าสู่ระบบ")
//        ก่อนตรวจ snapshot ให้ expect(ปุ่ม).toBeEnabled() เพื่อให้แน่ใจว่ากรอกครบแล้ว
// ------------------------------------------------
test("ฟอร์มเข้าสู่ระบบหลังกรอกแสดงค่าที่กรอก", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("somchai@example.com");
  await page.getByLabel("รหัสผ่าน").fill("secret123");
  // ปุ่ม enabled ก็ต่อเมื่อ state ของฟอร์มได้ค่าทั้งสองช่องแล้ว จึงเป็นตัวบอกว่ากรอกครบจริง ก่อนตรวจ snapshot
  await expect(page.getByRole("button", { name: "เข้าสู่ระบบ" })).toBeEnabled();

  // ช่องกรอกแสดงค่าต่อท้ายหลัง ":" ส่วนปุ่มไม่มี [disabled] แล้ว
  // (template ไม่เขียน [disabled] ก็จริง แต่ที่ยืนยันว่าปุ่ม enabled คือ toBeEnabled ด้านบน)
  await expect(page.getByRole("main")).toMatchAriaSnapshot(`
    - main:
      - textbox "อีเมล": somchai@example.com
      - textbox "รหัสผ่าน": secret123
      - button "เข้าสู่ระบบ"
  `);
});


// ------------------------------------------------
// ข้อ 3: กลุ่มหมวดที่สนใจในฟอร์มสมัครสมาชิก
// แนวทาง: goto("/register") ใช้ locator getByRole("group", { name: "หมวดที่สนใจ" })
//        ติ๊ก checkbox "หนังสือ" ด้วย check() แล้วเขียน template ของ group นี้:
//        มี checkbox "อุปกรณ์ไอที", "เสื้อผ้า", "ของใช้ในบ้าน" (ยังไม่ติ๊ก) และ "หนังสือ" ที่มี [checked]
//        ลองรัน aria snapshot ของ group (ariaSnapshot()) เพื่อดูว่า checkbox แต่ละอันเขียนยังไง
// ------------------------------------------------
test("ติ๊กหมวดหนังสือแล้ว snapshot แสดงว่า checked", async ({ page }) => {
  await page.goto("/register");
  // fieldset ที่มี legend "หมวดที่สนใจ" ได้ role group และชื่อจาก legend
  const group = page.getByRole("group", { name: "หมวดที่สนใจ" });
  await group.getByRole("checkbox", { name: "หนังสือ" }).check();

  // อันที่ไม่ได้ติ๊กไม่ต้องเขียน attribute ส่วนอันที่ติ๊กแล้วเขียน [checked]
  await expect(group).toMatchAriaSnapshot(`
    - group "หมวดที่สนใจ":
      - checkbox "อุปกรณ์ไอที"
      - checkbox "เสื้อผ้า"
      - checkbox "ของใช้ในบ้าน"
      - checkbox "หนังสือ" [checked]
  `);
});
