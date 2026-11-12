import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 04: หาของบนหน้าด้วย getByRole
// ฝึก: getByRole (role + name + exact + level), toBeVisible
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
//
// รูปแบบ:
//   page.getByRole("heading", { name: "DN Shop" })
//                  ^ ชนิดของ element   ^ ชื่อที่ผู้ใช้เห็น/ได้ยิน
// role ที่ใช้บ่อย: heading, link, button, textbox, searchbox, navigation, list
//
// ถ้าหา element ได้มากกว่า 1 ตัว Playwright จะ error ว่า "strict mode violation"
// (ดูข้อ 2 และ README ส่วน "จุดที่มักพลาด")
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: หน้าแรกต้องมีหัวข้อ (heading) "DN Shop"
// ------------------------------------------------
test("หน้าแรกต้องมีหัวข้อ DN Shop", async ({ page }) => {
  await page.goto("/");
  // หา heading ที่ชื่อ "DN Shop" แล้วตรวจว่ามองเห็น
  await expect(page.getByRole("heading", { name: "DN Shop" })).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: หน้าแรกต้องมีลิงก์ "ดูสินค้าทั้งหมด"
// ------------------------------------------------
test("หน้าแรกต้องมีลิงก์ ดูสินค้าทั้งหมด", async ({ page }) => {
  await page.goto("/");
  // role ของ <a href> คือ "link" ชื่อคือข้อความในลิงก์
  await expect(page.getByRole("link", { name: "ดูสินค้าทั้งหมด" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: หน้าแรกต้องมีลิงก์ "หน้าแรก" ในเมนู
// แนวทาง: เหมือนตัวอย่างที่ 2 ทุกอย่าง เปลี่ยนแค่ name เป็น "หน้าแรก"
// ------------------------------------------------
test("หน้าแรกต้องมีลิงก์ หน้าแรก", async ({ page }) => {
  await page.goto("/");
  // ชื่อ "หน้าแรก" ไม่ซ้อนกับลิงก์อื่น จึงไม่ต้องใช้ exact
  await expect(page.getByRole("link", { name: "หน้าแรก" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: หน้าแรกต้องมีลิงก์ "สินค้า" (ลิงก์ในเมนู ไม่ใช่ "ดูสินค้าทั้งหมด")
// แนวทาง: เขียนด้วย getByRole("link", { name: "สินค้า" }) ก่อนแล้วรัน จะเจอ error strict mode violation
//        เพราะ name แบบปกติ "มีคำนี้อยู่ในชื่อ" ก็ถือว่าตรง (ลิงก์ "ดูสินค้าทั้งหมด" ก็มีคำว่า "สินค้า")
//        แก้ด้วยการเพิ่ม exact: true ในวงเล็บปีกกา ให้ตรงทั้งชื่อ
// ------------------------------------------------
test("หน้าแรกต้องมีลิงก์ สินค้า ในเมนู", async ({ page }) => {
  await page.goto("/");
  // ถ้าเขียนแค่ { name: "สินค้า" } จะเจอ strict mode violation เพราะลิงก์ "ดูสินค้าทั้งหมด" ก็มีคำว่า "สินค้า"
  // exact: true บังคับให้ชื่อต้องตรงทั้งหมด จึงเหลือเฉพาะลิงก์ "สินค้า" ในเมนู
  await expect(page.getByRole("link", { name: "สินค้า", exact: true })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 3: หน้า /products ต้องมีหัวข้อระดับ 1 (h1) ชื่อ "สินค้าทั้งหมด"
// แนวทาง: page.goto("/products") แล้วใช้ getByRole("heading", { name: "สินค้าทั้งหมด", level: 1 })
//        level: 1 คือ <h1> (ระบุเพื่อให้ชัดว่าเป็นหัวข้อหลักของหน้า)
// ------------------------------------------------
test("หน้า /products ต้องมีหัวข้อระดับ 1 สินค้าทั้งหมด", async ({ page }) => {
  await page.goto("/products");
  // level: 1 ระบุว่าเป็น <h1> ซึ่งเป็นหัวข้อหลักของหน้า (ถ้าเป็น h2 จะไม่ตรง)
  await expect(page.getByRole("heading", { name: "สินค้าทั้งหมด", level: 1 })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: หน้า /products ต้องมีช่องค้นหา (searchbox) ชื่อ "ค้นหาสินค้า" และปุ่ม (button) "ค้นหา"
// แนวทาง: ช่อง <input type="search"> มี role ชื่อ "searchbox" ส่วนชื่อของมันมาจาก label "ค้นหาสินค้า"
//        เขียน expect สองบรรทัด บรรทัดละหนึ่ง element
// ------------------------------------------------
test("หน้า /products ต้องมีช่องค้นหาสินค้าและปุ่ม ค้นหา", async ({ page }) => {
  await page.goto("/products");
  // <input type="search"> มี role searchbox และได้ชื่อจาก <label> "ค้นหาสินค้า"
  await expect(page.getByRole("searchbox", { name: "ค้นหาสินค้า" })).toBeVisible();
  // ปุ่ม "ค้นหา" เป็น button คนละ role กับ searchbox จึงไม่ชนกันแม้ชื่อคล้ายกัน
  await expect(page.getByRole("button", { name: "ค้นหา" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 5: หน้า /products ต้องมีเมนูหลัก (navigation) ชื่อ "เมนูหลัก", รายการสินค้า (list) ชื่อ "รายการสินค้า"
//        และปุ่ม "สินค้าหมด" ของสินค้าที่ขายหมด
// แนวทาง: role ของ <nav> คือ "navigation" และของ <ul> คือ "list" ส่วนชื่อมาจาก aria-label
//        ปุ่ม "สินค้าหมด" เป็นปุ่มที่กดไม่ได้ (disabled) แต่ยังมองเห็นได้ จึงใช้ toBeVisible ได้
// ------------------------------------------------
test("หน้า /products ต้องมีเมนูหลัก รายการสินค้า และปุ่ม สินค้าหมด", async ({ page }) => {
  await page.goto("/products");
  // <nav aria-label="เมนูหลัก"> มี role navigation และชื่อมาจาก aria-label
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" })).toBeVisible();
  // รายการสินค้าโหลดจาก API ฝั่ง browser: expect รอให้เองจนกว่ารายการจะโผล่
  await expect(page.getByRole("list", { name: "รายการสินค้า" })).toBeVisible();
  // ปุ่ม disabled ยังเป็น button ที่ผู้ใช้เห็น (สินค้าหมวกแก๊ปหมดสต็อก) toBeVisible จึงผ่านได้
  await expect(page.getByRole("button", { name: "สินค้าหมด" })).toBeVisible();
});
