import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 01: test แรกของคุณ
// ฝึก: test, { page }, page.goto, toHaveTitle
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
//
// โครงของ test ใน Playwright:
//   test("ชื่อ test", async ({ page }) => {
//     await page.goto("/");                       // เปิดหน้าเว็บ
//     await expect(page).toHaveTitle("...");      // ตรวจ title ของหน้า
//   });
//
// หมายเหตุ: "/" ต่อท้าย baseURL จาก playwright.config.ts (http://localhost:3100)
//          ทุกอย่างที่คุยกับหน้าเว็บต้องมี await นำหน้า (บท 03 จะอธิบายว่าถ้าลืมจะเกิดอะไร)
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: หน้าแรกต้องมี title "หน้าแรก | DN Shop"
// ------------------------------------------------
test("หน้าแรกต้องมี title ว่า หน้าแรก | DN Shop", async ({ page }) => {
  // เปิดหน้าแรก ( "/" จะถูกต่อเป็น http://localhost:3100/ )
  await page.goto("/");
  // ตรวจว่า title ของหน้า (ข้อความบนแท็บ browser) ตรงกับที่คาดไว้
  await expect(page).toHaveTitle("หน้าแรก | DN Shop");
});


// ------------------------------------------------
// ข้อ 1: หน้า /products ต้องมี title "สินค้าทั้งหมด | DN Shop"
// แนวทาง: ทำเหมือนตัวอย่างที่ 1 ทุกอย่าง เปลี่ยนแค่ path ใน page.goto และข้อความใน toHaveTitle
// ------------------------------------------------
test("หน้า /products ต้องมี title ว่า สินค้าทั้งหมด | DN Shop", async ({ page }) => {
  // path เริ่มด้วย "/" จะถูกต่อท้าย baseURL จึงไม่ต้องเขียน http://localhost:3100 เอง
  await page.goto("/products");
  // toHaveTitle รอและลองใหม่เอง จึงไม่ต้องคอยดักว่าหน้าโหลดเสร็จหรือยัง
  await expect(page).toHaveTitle("สินค้าทั้งหมด | DN Shop");
});


// ------------------------------------------------
// ข้อ 2: หน้า /cart ต้องมี title "ตะกร้าสินค้า | DN Shop"
// แนวทาง: โครงเดิม ใช้ page.goto("/cart") แล้ว toHaveTitle
// ------------------------------------------------
test("หน้า /cart ต้องมี title ว่า ตะกร้าสินค้า | DN Shop", async ({ page }) => {
  await page.goto("/cart");
  // title ตรวจทั้งข้อความ ต้องตรงทุกตัวอักษรรวมช่องว่างรอบ |
  await expect(page).toHaveTitle("ตะกร้าสินค้า | DN Shop");
});


// ------------------------------------------------
// ข้อ 3: หน้า /login ต้องมี title "เข้าสู่ระบบ | DN Shop"
// แนวทาง: โครงเดิม ใช้ page.goto("/login") แล้ว toHaveTitle
// ------------------------------------------------
test("หน้า /login ต้องมี title ว่า เข้าสู่ระบบ | DN Shop", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle("เข้าสู่ระบบ | DN Shop");
});


// ------------------------------------------------
// ข้อ 4: หน้า /stores ต้องมี title "สาขาของเรา | DN Shop"
// แนวทาง: โครงเดิม ใช้ page.goto("/stores") แล้ว toHaveTitle
//        ลองเปลี่ยนข้อความใน toHaveTitle ให้ผิดดูหนึ่งครั้ง เพื่อฝึกอ่าน Expected / Received แล้วแก้กลับ
// ------------------------------------------------
test("หน้า /stores ต้องมี title ว่า สาขาของเรา | DN Shop", async ({ page }) => {
  await page.goto("/stores");
  // ลองแก้ข้อความด้านล่างให้ผิดแล้วรัน จะเห็น Expected (ที่เราเขียน) กับ Received (ที่หน้าเว็บมีจริง) เทียบกันได้เลย
  await expect(page).toHaveTitle("สาขาของเรา | DN Shop");
});
