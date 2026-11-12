import type { Locator, Page } from "@playwright/test";

// Page Object ของหน้า /cart (เป็นโครงให้เติมในแบบฝึกหัด)
// locator ด้านล่างเขียนไว้ให้แล้ว ส่วน method ที่โยน Error อยู่คือสิ่งที่ต้องเขียนเอง (ข้อ 2-5 ใน cart-page.spec.ts)
export class CartPage {
  readonly page: Page;
  readonly items: Locator;
  readonly couponInput: Locator;
  readonly applyCouponButton: Locator;
  readonly subtotal: Locator;
  readonly discount: Locator;
  readonly total: Locator;

  constructor(page: Page) {
    this.page = page;
    this.items = page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem");
    this.couponInput = page.getByLabel("โค้ดส่วนลด");
    this.applyCouponButton = page.getByRole("button", { name: "ใช้โค้ด" });
    this.subtotal = page.getByTestId("subtotal");
    this.discount = page.getByTestId("discount");
    this.total = page.getByTestId("total");
  }

  // ข้อ 2: เปิดหน้า /cart
  async goto(): Promise<void> {
    throw new Error("👉 ยังไม่ได้เขียน method นี้");
  }

  // ข้อ 3: กรอกโค้ดส่วนลดแล้วกด "ใช้โค้ด"
  async applyCoupon(_code: string): Promise<void> {
    throw new Error("👉 ยังไม่ได้เขียน method นี้");
  }

  // ข้อ 4: ลบสินค้าชื่อ productName ออกจากตะกร้า (ปุ่ม "ลบ" ของรายการนั้น และต้องกดยืนยัน dialog confirm)
  async remove(_productName: string): Promise<void> {
    throw new Error("👉 ยังไม่ได้เขียน method นี้");
  }

  // ข้อ 5: กดปุ่ม "เพิ่มจำนวน" ของสินค้าชื่อ productName หนึ่งครั้ง
  async increase(_productName: string): Promise<void> {
    throw new Error("👉 ยังไม่ได้เขียน method นี้");
  }
}
