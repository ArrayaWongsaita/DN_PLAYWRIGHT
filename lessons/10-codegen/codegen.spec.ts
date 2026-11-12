import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 10: อัด test ด้วย codegen แล้วเกลาให้ดี
// ฝึก: pnpm codegen, ปุ่ม assert ใน codegen, เปลี่ยนโค้ดดิบให้เป็น getByRole + expect
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้ (ต้องเปิด 2 terminal: pnpm app และ pnpm codegen)
//
// หลักการ: codegen ช่วยให้ได้ "โครง" เร็วขึ้น แต่โค้ดที่อัดได้เป็นแค่ร่างแรก
//         ต้องเกลาเสมอ: ใช้ URL แบบสั้น, เลือก locator ที่ดี, เพิ่ม assertion (codegen ไม่รู้ว่าคุณอยากตรวจอะไร)
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: "โค้ดดิบจาก codegen" (รูปแบบเดียวกับที่ codegen ให้มา ยังไม่ได้เกลา)
// เรื่องที่อัด: เปิดหน้าแรก → ไปหน้าสินค้า → ค้นหาหูฟัง → เปิดหน้าสินค้า → เพิ่มลงตะกร้า
// ข้อสังเกต: ไม่มี expect เลย, URL ยาวเต็ม, ใช้ getByPlaceholder/getByText ทั้งที่มี getByRole ที่ดีกว่า
//           ถ้าหน้าเว็บพังแต่ปุ่มยังกดได้ test นี้ก็ยังผ่าน (จึงยังไม่น่าไว้ใจ)
// ------------------------------------------------
test("[โค้ดดิบจาก codegen] ค้นหาหูฟังแล้วเพิ่มลงตะกร้า", async ({ page }) => {
  await page.goto("http://localhost:3100/");
  await page.getByRole("link", { name: "สินค้า", exact: true }).click();
  await page.getByPlaceholder("พิมพ์ชื่อสินค้า แล้วกด Enter").click();
  await page.getByPlaceholder("พิมพ์ชื่อสินค้า แล้วกด Enter").fill("หูฟัง");
  await page.getByPlaceholder("พิมพ์ชื่อสินค้า แล้วกด Enter").press("Enter");
  await page.getByText("หูฟังไร้สาย DN Buds").click();
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: "โค้ดหลังเกลา" เรื่องเดียวกับตัวอย่างที่ 1
// สิ่งที่เปลี่ยน (ไล่ดูทีละบรรทัดเทียบกับตัวอย่างที่ 1):
//   1. goto ใช้ "/" สั้นๆ (baseURL อยู่ใน config แล้ว)
//   2. ลิงก์ "สินค้า" ในเมนู ระบุผ่าน navigation "เมนูหลัก" ให้ชัด
//   3. ช่องค้นหา: เปลี่ยน getByPlaceholder เป็น getByRole("searchbox") แล้วเก็บใส่ตัวแปร
//      และตัด click() ที่เกินออก (fill คลิกให้เองอยู่แล้ว)
//   4. ชื่อสินค้า: เปลี่ยน getByText เป็น getByRole("link") ให้ตรงกับสิ่งที่ผู้ใช้กดจริง
//   5. เพิ่ม expect หลังแต่ละขั้นที่สำคัญ เพื่อให้รู้ว่า "สำเร็จจริง" ไม่ใช่แค่กดผ่าน
// ------------------------------------------------
test("[โค้ดหลังเกลา] ค้นหาหูฟังแล้วเพิ่มลงตะกร้า", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "เมนูหลัก" }).getByRole("link", { name: "สินค้า" }).click();
  await expect(page).toHaveURL("/products");

  const searchBox = page.getByRole("searchbox", { name: "ค้นหาสินค้า" });
  await searchBox.fill("หูฟัง");
  await searchBox.press("Enter");
  await expect(page.getByText("พบสินค้า 1 รายการ")).toBeVisible();

  await page.getByRole("link", { name: "หูฟังไร้สาย DN Buds" }).click();
  await expect(page).toHaveURL(/\/products\/p01$/);

  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  // ข้อความ "เพิ่มลงตะกร้าแล้ว" อยู่ใน role="status" (แอปไม่ซ่อนเอง จึงตรวจได้ไม่ต้องรีบ)
  await expect(page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" })).toBeVisible();
  // ตัวเลขในลิงก์ "ตะกร้า" ของ header ต้องเป็น 1
  await expect(page.getByRole("link", { name: "ตะกร้า (1)" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: อัดการเลือกหมวดหมู่ที่หน้า /products
// ขั้นตอน: เปิด codegen (pnpm codegen) → เลือกหมวดหมู่ "หนังสือ" ในรายการ "หมวดหมู่"
//         → กดปุ่ม "Assert text" ของ codegen คลิกที่ข้อความ "พบสินค้า 3 รายการ" → copy โค้ดมาวางด้านล่าง
// เกลา: เปลี่ยน URL เป็นแบบสั้น และตรวจให้ครบ: เห็นข้อความ "พบสินค้า 3 รายการ" และเห็นลิงก์ "หนังสือ Playwright ฉบับลงมือทำ"
// ------------------------------------------------
test("[codegen] เลือกหมวดหนังสือแล้วต้องพบสินค้า 3 รายการ", async ({ page }) => {
  // --- โค้ดดิบที่ codegen ให้ (เก็บไว้ในคอมเมนต์เพื่อเทียบ) ---
  // await page.goto('http://localhost:3100/products');
  // await page.getByLabel('หมวดหมู่').selectOption('books');
  // --- โค้ดหลังเกลา ---
  await page.goto("/products");
  // ทำไมเปลี่ยนเป็น getByRole("combobox"): ตรงกับสิ่งที่ผู้ใช้เห็น (select ที่มีชื่อ "หมวดหมู่") และสม่ำเสมอกับ locator อื่นในบท 08
  await page.getByRole("combobox", { name: "หมวดหมู่" }).selectOption({ label: "หนังสือ" });
  // ทำไมต้องเพิ่ม expect: โค้ดดิบไม่ตรวจอะไร ที่เติมคือผลที่ผู้ใช้ควรเห็น (หนังสือมี 3 เล่ม)
  await expect(page.getByText("พบสินค้า 3 รายการ")).toBeVisible();
  await expect(page.getByRole("link", { name: "หนังสือ Playwright ฉบับลงมือทำ" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: อัดการเพิ่มจำนวนสินค้าแล้วเพิ่มลงตะกร้า
// ขั้นตอน: เปิด /products/p04 → กด "เพิ่มจำนวน" 2 ครั้ง → กด "เพิ่มลงตะกร้า" → copy โค้ดมาวาง
// เกลา: เพิ่ม expect ว่าช่องจำนวนเป็น "3" (toHaveValue), เห็นข้อความ "เพิ่มลงตะกร้าแล้ว" ใน role="status"
//      และลิงก์ "ตะกร้า (3)" ปรากฏ
//      (ถ้า codegen ให้ getByRole('spinbutton') หรือ locator แปลกๆ ตรวจว่าชื่อตรงกับที่เรียนในบท 06)
// ------------------------------------------------
test("[codegen] เพิ่มจำนวนเสื้อยืด 2 ครั้งแล้วเพิ่มลงตะกร้า", async ({ page }) => {
  // --- โค้ดดิบที่ codegen ให้ ---
  // await page.goto('http://localhost:3100/products/p04');
  // await page.getByRole('button', { name: 'เพิ่มจำนวน' }).click();
  // await page.getByRole('button', { name: 'เพิ่มจำนวน' }).click();
  // await page.getByRole('button', { name: 'เพิ่มลงตะกร้า' }).click();
  // --- โค้ดหลังเกลา ---
  await page.goto("/products/p04");
  // ทำไมเก็บเป็นตัวแปร: โค้ดดิบเรียก locator เดิมซ้ำสองบรรทัด
  const increase = page.getByRole("button", { name: "เพิ่มจำนวน" });
  await increase.click();
  await increase.click();
  // เริ่มที่ 1 กดเพิ่ม 2 ครั้ง ต้องเป็น 3 (ตรวจ value ไม่ใช่ text)
  await expect(page.getByRole("textbox", { name: "จำนวน" })).toHaveValue("3");

  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  // ทำไมตรวจสองที่: ข้อความยืนยันบอกว่าแอปรับคำสั่ง ส่วนตัวเลขที่ header บอกว่าของเข้าตะกร้าจริง 3 ชิ้น
  await expect(page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ตะกร้า (3)" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 3: อัดการสมัครสมาชิกแบบยังไม่กรอกอะไร
// ขั้นตอน: เปิด /register → กดปุ่ม "สมัครสมาชิก" ทันที → ใช้ปุ่ม "Assert visibility" คลิกข้อความ error ที่ขึ้น → copy โค้ดมาวาง
// เกลา: ตรวจข้อความ "กรุณากรอกชื่อ" และ "กรุณายอมรับเงื่อนไขการใช้งาน" ให้ครบทั้งสอง
//      และลบบรรทัดที่ codegen ใส่เกินมา (เช่น click ซ้ำ) ออก
// ------------------------------------------------
test("[codegen] สมัครสมาชิกโดยไม่กรอกข้อมูลต้องมีข้อความ error", async ({ page }) => {
  // --- โค้ดดิบที่ codegen ให้ ---
  // await page.goto('http://localhost:3100/register');
  // await page.getByRole('button', { name: 'สมัครสมาชิก' }).click();
  // await expect(page.getByText('กรุณากรอกชื่อ')).toBeVisible();
  // --- โค้ดหลังเกลา ---
  await page.goto("/register");
  await page.getByRole("button", { name: "สมัครสมาชิก" }).click();
  // ทำไมตรวจสองข้อความ: โค้ดดิบตรวจแค่ข้อความแรกที่คลิกไป ฟอร์มนี้แจ้ง error หลายช่องพร้อมกัน
  await expect(page.getByText("กรุณากรอกชื่อ")).toBeVisible();
  await expect(page.getByText("กรุณายอมรับเงื่อนไขการใช้งาน")).toBeVisible();
});
