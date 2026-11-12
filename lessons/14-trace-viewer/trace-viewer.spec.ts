import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 14: Trace Viewer
// ฝึก: เปิด trace ของ test, ไล่ดูทีละ action, ดู DOM snapshot / network / console เพื่อหาสาเหตุที่ test พัง
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================
//
// รูปแบบของบทนี้ไม่เหมือนบทอื่น:
//   - ตัวอย่างที่ 1 เป็น test ที่ผ่าน ใช้ฝึกเปิด trace (รันด้วย --trace on)
//   - ข้อ 1–3 บน main เป็น test ที่ "ตั้งใจให้พัง" อยู่ใน test.fixme ผู้เรียนเปลี่ยนเป็น test รันให้พัง เปิด trace หาสาเหตุ
//     ไฟล์นี้ (branch solutions) คือฉบับที่แก้แล้ว ทุกข้อมีคอมเมนต์ "สาเหตุ" ว่า trace บอกอะไร และ "วิธีแก้"


// ------------------------------------------------
// ตัวอย่างที่ 1: test ที่ผ่าน ไว้ฝึกเปิด trace (รัน: pnpm test 14-trace-viewer --trace on)
// ------------------------------------------------
test("หน้าสินค้า p01 เพิ่มลงตะกร้าแล้วเห็นข้อความยืนยัน", async ({ page }) => {
  await page.goto("/products/p01");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1 (เฉลย): ปุ่มเพิ่มลงตะกร้าของ p01 ต้องกดได้
// ------------------------------------------------
// สาเหตุ: เปิด trace ดู DOM snapshot ของขั้น expect ที่แดง จะเห็นว่าปุ่มบนหน้าชื่อ "เพิ่มลงตะกร้า"
//        ไม่ใช่ "ใส่ตะกร้า" (name ที่เขียนไว้เดิม) แท็บ Log ก็บอกว่า waiting for getByRole('button', { name: 'ใส่ตะกร้า' })
//        จนหมดเวลา และ error คือ element(s) not found
// วิธีแก้: แก้ชื่อใน locator ให้ตรงกับชื่อบนหน้าจริง
test("ข้อ 1: หน้าสินค้า p01 ปุ่มเพิ่มลงตะกร้าต้องกดได้", async ({ page }) => {
  await page.goto("/products/p01");
  await expect(page.getByRole("button", { name: "เพิ่มลงตะกร้า" })).toBeEnabled();
});


// ------------------------------------------------
// ข้อ 2 (เฉลย): กดไปหน้าถัดไปแล้วต้องอยู่หน้า done
// ------------------------------------------------
// สาเหตุ: ใน Actions ของ trace มีแค่ goto กับ click แล้วก็ expect(page.url()) ซึ่งไม่ใช่ action ของ Playwright
//        (ไม่มี "waiting for" ใน Log) ปุ่มนี้รอ 1 วินาทีก่อนเปลี่ยนหน้า แต่ page.url() อ่านค่าตอนนี้ครั้งเดียว
//        จึงได้ URL ของหน้าเดิม ภาพ After ของ click ก็ยังเป็นหน้า slow
// วิธีแก้: ใช้ await expect(page).toHaveURL(...) ซึ่งรอจน URL ตรง (ดูบท 09 และ 13)
test("ข้อ 2: กดไปหน้าถัดไปแล้วต้องอยู่หน้า done", async ({ page }) => {
  await page.goto("/playground/slow");
  await page.getByRole("button", { name: "ไปหน้าถัดไป" }).click();
  await expect(page).toHaveURL(/\/playground\/slow\/done$/);
  await expect(page.getByRole("heading", { name: "เสร็จแล้ว" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 3 (เฉลย): สั่งหมอนอิง 3 ชิ้นสองรอบ รอบแรกเพิ่มได้ รอบที่สองต้องถูกปฏิเสธเพราะเกินสต็อก
// ------------------------------------------------
// สาเหตุ: แท็บ Network ของ trace แสดง POST /api/cart สองครั้ง ครั้งแรกได้ 201 ครั้งที่สองได้ 409
//        (3 + 3 = 6 เกินสต็อก 5 ชิ้น) เซิร์ฟเวอร์ปฏิเสธ หน้าเลยไม่แสดง "เพิ่มลงตะกร้าแล้ว"
//        แต่แสดง role="alert" "สินค้าในสต็อกไม่พอ" แทน (เห็นใน DOM snapshot) test เดิมรอข้อความที่ไม่มีวันขึ้น
//        ปัญหาไม่ใช่ว่าแอปพัง แต่ test คาดหวังผิดจากกฎของร้าน
// วิธีแก้: รอบที่สองตรวจ alert ที่ถูกต้อง และตรวจว่าข้อความ "เพิ่มลงตะกร้าแล้ว" ไม่ขึ้น
test("ข้อ 3: สั่งหมอนอิง 3 ชิ้นสองรอบ รอบที่สองต้องถูกปฏิเสธเพราะเกินสต็อก", async ({ page }) => {
  await page.goto("/products/p07");
  await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
  await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
  await expect(page.getByRole("textbox", { name: "จำนวน" })).toHaveValue("3");

  const added = page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" });
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(added).toBeVisible();

  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "สินค้าในสต็อกไม่พอ" })).toBeVisible();
  await expect(added).toBeHidden();
});
