import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 14: Trace Viewer
// ฝึก: เปิด trace ของ test, ไล่ดูทีละ action, ดู DOM snapshot / network / console เพื่อหาสาเหตุที่ test พัง
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================
//
// รูปแบบของบทนี้ไม่เหมือนบทอื่น:
//   - ตัวอย่างที่ 1 เป็น test ที่ผ่าน ใช้ฝึกเปิด trace (รันด้วย --trace on)
//   - ข้อ 1–3 เป็น test ที่ "ตั้งใจให้พัง" อยู่ใน test.fixme (บน main ต้องไม่มี failed)
//     ผู้เรียนเปลี่ยนเป็น test ทีละข้อ รันให้พัง เปิด trace หาสาเหตุ แล้วแก้ให้ผ่าน
//   - อย่าแก้โดยเดาจากข้อความ error อย่างเดียว ให้เปิด trace ดูของจริงก่อนทุกข้อ


// ------------------------------------------------
// ตัวอย่างที่ 1: test ที่ผ่าน ไว้ฝึกเปิด trace (รัน: pnpm test 14-trace-viewer --trace on)
// ------------------------------------------------
test("หน้าสินค้า p01 เพิ่มลงตะกร้าแล้วเห็นข้อความยืนยัน", async ({ page }) => {
  await page.goto("/products/p01");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: test นี้พัง (เปลี่ยน test.fixme เป็น test แล้วรัน) หาสาเหตุจาก trace แล้วแก้ให้ผ่าน
// อาการ: ปุ่มเพิ่มลงตะกร้าของ p01 หาไม่เจอ
// เป้าหมายของ test: หน้าสินค้า p01 ต้องมีปุ่มที่กดเพิ่มลงตะกร้าได้ (enabled)
// แนวทาง: เปิด trace ไปที่แท็บ Actions เลือกขั้น expect ที่แดง แล้วดู DOM snapshot ว่าบนหน้าจริงมีปุ่มชื่ออะไรบ้าง
// ------------------------------------------------
test.fixme("ข้อ 1: หน้าสินค้า p01 ปุ่มเพิ่มลงตะกร้าต้องกดได้", async ({ page }) => {
  await page.goto("/products/p01");
  await expect(page.getByRole("button", { name: "ใส่ตะกร้า" })).toBeEnabled();
});


// ------------------------------------------------
// ข้อ 2: test นี้พัง หาสาเหตุจาก trace แล้วแก้ให้ผ่าน
// อาการ: กดปุ่ม "ไปหน้าถัดไป" แล้วตรวจ URL แต่ URL ยังเป็นหน้าเดิม
// เป้าหมายของ test: กดปุ่มแล้วต้องไปหน้า /playground/slow/done
// แนวทาง: ดู Actions ว่ามี action อะไรบ้างระหว่าง click กับบรรทัดที่พัง แล้วดูช่อง Before/After ของ click
//        เทียบกับบทที่ 13 ว่าบรรทัดตรวจ URL เป็นแบบที่รอหรือไม่รอ
//        (ปุ่มนี้รอ 1 วินาทีก่อนเปลี่ยนหน้า) หน้าสุดท้ายต้องเห็นหัวข้อ "เสร็จแล้ว"
// ------------------------------------------------
test.fixme("ข้อ 2: กดไปหน้าถัดไปแล้วต้องอยู่หน้า done", async ({ page }) => {
  await page.goto("/playground/slow");
  await page.getByRole("button", { name: "ไปหน้าถัดไป" }).click();
  expect(page.url()).toContain("/playground/slow/done");
  await expect(page.getByRole("heading", { name: "เสร็จแล้ว" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 3: test นี้พัง หาสาเหตุจาก trace (แท็บ Network) แล้วแก้ให้ผ่าน
// อาการ: กดเพิ่มลงตะกร้ารอบที่สอง แต่ข้อความ "เพิ่มลงตะกร้าแล้ว" ไม่ขึ้น
// เป้าหมายของ test: สั่งหมอนอิงลายแมว (p07 มีในคลัง 5 ชิ้น) ครั้งละ 3 ชิ้น สองครั้ง
//        รอบแรกควรเพิ่มได้ ส่วนรอบที่สองควรได้คำตอบที่ถูกต้องตามกฎของร้าน
// แนวทาง: ดูแท็บ Network ของ trace ว่าคำขอ POST /api/cart ทั้งสองครั้งได้ status อะไร
//        แล้วอ่านข้อความที่หน้าแสดง (ดู DOM snapshot ของ action สุดท้าย) แก้ test ให้ตรวจสิ่งที่ถูกต้องในรอบที่สอง
//        ข้อความที่หน้าแสดงเป็น role="alert" (กรองด้วย hasText เหมือนบท 07)
// ------------------------------------------------
test.fixme("ข้อ 3: สั่งหมอนอิง 3 ชิ้นสองรอบ รอบที่สองต้องเพิ่มได้", async ({ page }) => {
  await page.goto("/products/p07");
  await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
  await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
  await expect(page.getByRole("textbox", { name: "จำนวน" })).toHaveValue("3");

  const added = page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" });
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(added).toBeVisible();

  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(added).toBeVisible();
});
