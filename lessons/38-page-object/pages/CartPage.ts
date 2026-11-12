import { expect, type Locator, type Page } from "@playwright/test";

// Page Object ของหน้า /cart (เฉลย)
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

  // ข้อ 2: แค่เปิด URL ของหน้านี้ เหมือน goto() ของ LoginPage
  // รู้ว่า path คือ "/cart" ที่เดียว ถ้า path เปลี่ยนแก้ตรงนี้ที่เดียว
  async goto(): Promise<void> {
    await this.page.goto("/cart");
  }

  // ข้อ 3: กรอกแล้วกด ปุ่ม "ใช้โค้ด" disabled จนกว่าช่องมีค่า click() รอให้ enabled ให้เอง จึงไม่ต้องรอเพิ่ม
  // ไม่ตรวจผลที่นี่ (ว่าโค้ดถูกหรือผิด) เพราะ test ผิดพลาดก็ต้องใช้ method นี้ได้ ให้ test ตรวจเอง
  async applyCoupon(code: string): Promise<void> {
    await this.couponInput.fill(code);
    await this.applyCouponButton.click();
  }

  // ข้อ 4: ปุ่ม "ลบ" เรียก window.confirm ถ้าไม่มีใครดัก Playwright จะ dismiss (เท่ากับกดยกเลิก) จึงต้องดักก่อนกดปุ่ม
  // ใช้ once เพื่อให้ handler ทำงานแค่ครั้งเดียว (ไม่ค้างไว้ให้ dialog อื่นถูก accept โดยไม่ตั้งใจ)
  // dialog.accept() คืน Promise: ใส่ void เพราะ callback ของ event ไม่ถูก await
  async remove(productName: string): Promise<void> {
    this.page.once("dialog", (dialog) => void dialog.accept());
    // filter หาเฉพาะรายการของสินค้านั้น แล้วหาปุ่ม "ลบ" ในรายการนั้น (ปุ่มลบมีทุกแถว จึงต้องจำกัดขอบเขตก่อน)
    await this.items.filter({ hasText: productName }).getByRole("button", { name: "ลบ" }).click();
  }

  // ข้อ 5: กดปุ่ม "เพิ่มจำนวน" ในรายการของสินค้านั้นหนึ่งครั้ง
  async increase(productName: string): Promise<void> {
    const item = this.items.filter({ hasText: productName });
    const quantity = item.getByLabel("จำนวน");
    const before = Number(await quantity.inputValue());
    await item.getByRole("button", { name: "เพิ่มจำนวน" }).click();
    // ทำไมต้องรอ: ปุ่มส่งจำนวนใหม่ (จำนวนเดิม + 1) ที่หน้าจำไว้ในขณะนั้น ถ้ากดครั้งที่สองก่อนที่หน้าจะรับจำนวนใหม่
    // จะส่งค่าเดิมซ้ำ (เพิ่มแค่ 1 แทนที่จะเป็น 2) เราลองกดสองครั้งติดกันโดยไม่รอแล้วล้ม 3 จาก 20 รอบ
    // การรอให้ action เสร็จจริงอยู่ใน Page Object ได้ เพราะเป็นส่วนของ action ไม่ใช่การตัดสินผลของ test
    await expect(quantity).toHaveValue(String(before + 1));
  }
}
