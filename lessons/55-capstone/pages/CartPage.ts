import type { Locator, Page } from "@playwright/test";

// หน้า /cart: คูปองและยอดรวม (การเตรียมของในตะกร้าให้ทำผ่าน ShopApi)
export class CartPage {
  readonly page: Page;
  readonly items: Locator;
  readonly couponInput: Locator;
  readonly applyCouponButton: Locator;
  readonly couponStatus: Locator;
  readonly subtotal: Locator;
  readonly discount: Locator;
  readonly total: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.items = page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem");
    this.couponInput = page.getByLabel("โค้ดส่วนลด");
    this.applyCouponButton = page.getByRole("button", { name: "ใช้โค้ด" });
    // ใช้ role="status" ที่กรองด้วยข้อความ เพราะบนหน้าเดียวอาจมี status หลายตัว
    this.couponStatus = page.getByRole("status").filter({ hasText: "ใช้โค้ด" });
    this.subtotal = page.getByTestId("subtotal");
    this.discount = page.getByTestId("discount");
    this.total = page.getByTestId("total");
    this.checkoutButton = page.getByRole("button", { name: "ไปชำระเงิน" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/cart");
  }

  async applyCoupon(code: string): Promise<void> {
    await this.couponInput.fill(code);
    await this.applyCouponButton.click();
  }
}
