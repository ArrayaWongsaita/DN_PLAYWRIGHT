import { test as base, expect, type Page } from "@playwright/test";

// ไฟล์นี้คือ "ที่รวม fixture ของเราเอง" ของบท 39
// test.extend() รับ test ตัวเดิมของ Playwright (base) แล้วคืน test ตัวใหม่ที่มี fixture เพิ่ม
// spec ที่ต้องการใช้ ให้ import { test, expect } จากไฟล์นี้แทน "@playwright/test"

export type Account = { email: string; password: string };

// บัญชีทดสอบของแอป (ผู้ใช้ทั่วไป และผู้ดูแลระบบ)
export const USER: Account = { email: "user@dnshop.test", password: "password123" };
export const ADMIN: Account = { email: "admin@dnshop.test", password: "admin123" };

// type ของ fixture ที่เราเพิ่มเอง (ใส่เป็น generic ให้ test.extend)
type MyFixtures = {
  // option fixture: ค่าที่ test หรือ config เปลี่ยนได้ด้วย test.use({ account: ... })
  account: Account;
  // page ที่ login แล้ว (ผู้ใช้ตาม option account)
  loggedInPage: Page;
  // page ที่ login แล้ว และมีหูฟัง (p01) 1 ชิ้นในตะกร้า
  cartWithItem: Page;
  // ข้อ 3: page ที่ login เป็นผู้ดูแลระบบ (ยังไม่ได้เขียน)
  adminPage: Page;
  // auto fixture: ทำงานทุก test โดยไม่ต้องขอใน argument
  testLog: void;
};

export const test = base.extend<MyFixtures>({
  // ---- option fixture ----
  // รูปแบบคือ [ค่าเริ่มต้น, { option: true }] ไม่มีฟังก์ชัน use เพราะเป็นแค่ "ค่า"
  account: [USER, { option: true }],

  // ---- fixture ที่ setup/teardown ----
  // รับ fixture อื่นเป็น argument (ในที่นี้คือ page และ account) Playwright จัดลำดับให้เอง
  loggedInPage: async ({ page, account }, use) => {
    // ---- setup: โค้ดก่อน use() ----
    await base.step("[fixture loggedInPage] setup: login ผ่าน API", async () => {
      console.log("[loggedInPage] setup");
      // page.request ใช้ cookie ร่วมกับ page (บท 37) cookie dn_auth ที่ได้จึงอยู่ใน browser context ของ page
      const res = await page.request.post("/api/auth/login", { data: account });
      // toBeOK ตรวจว่า status เป็น 2xx ถ้าไม่ใช่ fixture จะ fail ทันทีและ test ที่ขอ fixture นี้ไม่เริ่ม
      await expect(res).toBeOK();
    });

    // ---- ส่งต่อให้ test ----
    // use(page) คือจุดที่ test (และ fixture ที่พึ่งพาตัวนี้) ทำงาน: use() จะ "จบ" หลัง test จบ
    await use(page);

    // ---- teardown: โค้ดหลัง use() รันหลัง test จบ (แม้ test fail) ----
    await base.step("[fixture loggedInPage] teardown: logout ผ่าน API", async () => {
      console.log("[loggedInPage] teardown");
      await page.request.post("/api/auth/logout");
    });
  },

  // fixture ที่ต่อยอดจาก fixture อื่น: ขอ loggedInPage ก็ได้ login มาให้ด้วย
  cartWithItem: async ({ loggedInPage }, use) => {
    await base.step("[fixture cartWithItem] setup: เพิ่มหูฟังลงตะกร้า", async () => {
      console.log("[cartWithItem] setup");
      const res = await loggedInPage.request.post("/api/cart", { data: { productId: "p01", quantity: 1 } });
      await expect(res).toBeOK();
    });

    await use(loggedInPage);

    await base.step("[fixture cartWithItem] teardown", async () => {
      console.log("[cartWithItem] teardown");
    });
  },

  // ข้อ 3: เขียน fixture นี้เอง (login เป็น ADMIN ผ่าน API แล้ว use(page))
  adminPage: async ({ page }, use) => {
    throw new Error("👉 ยังไม่ได้เขียน fixture นี้");
  },

  // ---- auto fixture ----
  // { auto: true } ทำให้ fixture นี้รันทุก test ในไฟล์ที่ใช้ test ตัวนี้ แม้ test ไม่ได้ขอ
  // (ใช้กับงานที่ทุก test ต้องทำ เช่น เก็บ log) ตัวอย่างนี้แค่พิมพ์ชื่อ test ก่อนและหลังรัน
  testLog: [
    async ({}, use, testInfo) => {
      console.log(`[auto] เริ่ม: ${testInfo.title}`);
      await use();
      console.log(`[auto] จบ: ${testInfo.title} (${testInfo.status})`);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
