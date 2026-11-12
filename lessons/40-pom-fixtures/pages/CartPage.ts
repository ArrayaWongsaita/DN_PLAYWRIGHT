import type { Locator, Page } from "@playwright/test";

// Page Object ของหน้า /cart (เขียนเสร็จแล้ว เหมือนที่เป็นเฉลยของบท 38)
export class CartPage {
  readonly page: Page;
  readonly items: Locator;
  readonly couponInput: Locator;
  readonly applyCouponButton: Locator;
  readonly subtotal: Locator;
  readonly discount: Locator;
  readonly total: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.items = page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem");
    this.couponInput = page.getByLabel("โค้ดส่วนลด");
    this.applyCouponButton = page.getByRole("button", { name: "ใช้โค้ด" });
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

  async increase(productName: string): Promise<void> {
    await this.items.filter({ hasText: productName }).getByRole("button", { name: "เพิ่มจำนวน" }).click();
  }

  async remove(productName: string): Promise<void> {
    // ปุ่ม "ลบ" เปิด confirm dialog: ต้องดักก่อนกดปุ่ม
    this.page.once("dialog", (dialog) => void dialog.accept());
    await this.items.filter({ hasText: productName }).getByRole("button", { name: "ลบ" }).click();
  }
}
