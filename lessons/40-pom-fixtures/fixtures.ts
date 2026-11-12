import { test as base, expect } from "@playwright/test";
import { baseURL } from "../../playwright.shared";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { LoginPage } from "./pages/LoginPage";

// บท 40: รวม Page Object (บท 38) กับ fixture (บท 39)
// test ขอ loginPage / cartPage / checkoutPage ใน argument ได้เลย ไม่ต้อง new เองทุก test

// ข้อมูลสินค้าที่อ่านอย่างเดียว (ใช้กับ worker fixture ด้านล่าง)
export type CatalogItem = { id: string; name: string; price: number };

// fixture แบบ test (ค่าเริ่มต้น): สร้างใหม่ทุก test ใช้ page ได้
type TestFixtures = {
  loginPage: LoginPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

// fixture แบบ worker: สร้างครั้งเดียวต่อ worker process แล้วใช้ร่วมกันทุก test ที่ worker นั้นรัน
type WorkerFixtures = {
  catalog: readonly CatalogItem[];
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Page Object: ขอ page แล้วห่อด้วย class (ไม่มี teardown จึงไม่ต้องทำอะไรหลัง use)
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  // worker fixture: ใส่ { scope: "worker" } ตัวที่สองของ tuple
  // ข้อจำกัด: worker fixture ขอ fixture แบบ test (เช่น page, request, baseURL) ไม่ได้ จึงสร้าง request context เองจาก
  // `playwright` (worker fixture) และอ่าน baseURL จาก playwright.shared.ts
  catalog: [
    async ({ playwright }, use, workerInfo) => {
      console.log(`[catalog] worker ${workerInfo.workerIndex}: โหลดรายการสินค้า`);
      const api = await playwright.request.newContext({ baseURL });
      const res = await api.get("/api/products");
      await expect(res).toBeOK();
      const body = (await res.json()) as { products: CatalogItem[] };
      await api.dispose();
      // เก็บเฉพาะ id/name/price (ไม่เก็บ stock เพราะ test อื่นเปลี่ยนได้) และ freeze กันแก้ข้อมูลที่ใช้ร่วมกัน
      const items = body.products.map(({ id, name, price }) => Object.freeze({ id, name, price }));
      await use(Object.freeze(items));
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";
