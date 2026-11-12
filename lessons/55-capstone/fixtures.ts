import { test as base } from "@playwright/test";

// โครงของไฟล์ fixture (บท 39 และ 40) ตอนนี้ยังไม่มี fixture อะไรเลย test ที่นี่คือ test ปกติของ Playwright
// งานของคุณ: เพิ่ม fixture ให้ test ขอได้ใน argument เช่น Page Object ของแต่ละหน้า (ไว้ในโฟลเดอร์ pages/)
// และตัวช่วยเตรียมข้อมูลผ่าน API เช่น "ใส่สินค้าลงตะกร้า" หรือ "สั่งซื้อให้เสร็จ"
//
// รูปแบบ (ดูตัวอย่างเต็มได้ในบท 40):
//   type Fixtures = { cartPage: CartPage };
//   export const test = base.extend<Fixtures>({
//     cartPage: async ({ page }, use) => { await use(new CartPage(page)); },
//   });
export const test = base;

export { expect } from "@playwright/test";
