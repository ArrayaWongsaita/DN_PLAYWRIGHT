import { test as base } from "@playwright/test";
import { AccountPage } from "./pages/AccountPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { Header } from "./pages/Header";
import { OrderPage } from "./pages/OrderPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ShopApi } from "./pages/ShopApi";

// fixture ของบท 55 (เฉลย): ส่ง Page Object กับตัวช่วยเตรียมข้อมูลผ่าน API ให้ test ขอใช้ใน argument ได้เลย
// แบ่งหน้าที่: Page Object = "หน้าเว็บหน้านั้นทำอะไรได้" / ShopApi = "เตรียมข้อมูลหลังบ้านโดยไม่ผ่านหน้าเว็บ" / test = "ตรวจอะไร"
type Fixtures = {
  header: Header;
  productsPage: ProductsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  orderPage: OrderPage;
  accountPage: AccountPage;
  shop: ShopApi;
};

export const test = base.extend<Fixtures>({
  header: async ({ page }, use) => {
    await use(new Header(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  orderPage: async ({ page }, use) => {
    await use(new OrderPage(page));
  },
  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },
  // ใช้ page.request (ไม่ใช่ fixture request) เพราะต้องใช้ cookie ชุดเดียวกับหน้าเว็บ: ตะกร้าที่เตรียมจึงอยู่ session เดียวกับที่ test เปิดดู (บท 37)
  shop: async ({ page }, use) => {
    await use(new ShopApi(page.request));
  },
});

export { expect } from "@playwright/test";
