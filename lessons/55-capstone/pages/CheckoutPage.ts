import { expect, type FrameLocator, type Locator, type Page } from "@playwright/test";

// หน้า /checkout: ข้อมูลผู้รับ, ชำระเงินด้วยบัตรผ่าน iframe, ยืนยันคำสั่งซื้อ
export class CheckoutPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly addressInput: Locator;
  readonly phoneInput: Locator;
  readonly paymentSelect: Locator;
  readonly acceptTerms: Locator;
  readonly orderTotal: Locator;
  readonly submitButton: Locator;
  readonly cardFrame: FrameLocator;
  readonly cardConfirmed: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel("ชื่อ-นามสกุล");
    this.addressInput = page.getByLabel("ที่อยู่");
    this.phoneInput = page.getByLabel("เบอร์โทรศัพท์");
    this.paymentSelect = page.getByLabel("วิธีชำระเงิน");
    this.acceptTerms = page.getByLabel("ฉันยอมรับเงื่อนไขการสั่งซื้อ");
    this.orderTotal = page.getByTestId("order-total");
    this.submitButton = page.getByRole("button", { name: "ยืนยันคำสั่งซื้อ" });
    // ฟอร์มบัตรอยู่ใน iframe: ใช้ frameLocator แล้วหา element ข้างในต่อได้ตามปกติ (บท 29)
    this.cardFrame = page.frameLocator('iframe[title="ฟอร์มบัตรเครดิต"]');
    // ข้อความนี้อยู่ที่หน้าหลัก (นอก iframe) ขึ้นเมื่อ iframe ส่ง postMessage มาบอกว่าบัตรผ่าน
    this.cardConfirmed = page.getByRole("status").filter({ hasText: "ยืนยันบัตรแล้ว" });
  }

  async goto(): Promise<void> {
    // ตะกร้าต้องมีของก่อน ถ้าว่างแอปจะส่งกลับ /cart
    await this.page.goto("/checkout");
  }

  async fillRecipient(name: string, address: string, phone: string): Promise<void> {
    // fill ล้างค่าเดิมก่อนเสมอ (ช่องชื่อถูกเติมให้แล้วเพราะ login อยู่)
    await this.nameInput.fill(name);
    await this.addressInput.fill(address);
    await this.phoneInput.fill(phone);
    // ตรวจค่าหลังกรอก: ถ้าหน้ายังไม่ hydrate ค่าอาจถูกล้างทิ้ง จะได้ล้มตรงนี้ ไม่ใช่ไปล้มที่ปุ่มยืนยันที่ไม่ยอม enabled
    await expect(this.nameInput).toHaveValue(name);
    await expect(this.addressInput).toHaveValue(address);
    await expect(this.phoneInput).toHaveValue(phone);
  }

  // เลือกชำระด้วยบัตร กรอกบัตรใน iframe แล้วรอจนหน้าหลักขึ้น "ยืนยันบัตรแล้ว"
  async payWithCard(cardNumber: string): Promise<void> {
    await this.paymentSelect.selectOption("card");
    // รอให้ฟอร์มใน iframe ขึ้นก่อน (ลดความเสี่ยงที่กรอกก่อน iframe hydrate) แล้วตรวจค่าหลัง fill
    await expect(this.cardFrame.getByRole("button", { name: "ยืนยันบัตร" })).toBeVisible();
    await this.cardFrame.getByLabel("หมายเลขบัตร").fill(cardNumber);
    await expect(this.cardFrame.getByLabel("หมายเลขบัตร")).toHaveValue(cardNumber);
    await this.cardFrame.getByLabel("วันหมดอายุ").fill("12/30");
    await this.cardFrame.getByLabel("CVV").fill("123");
    await this.cardFrame.getByRole("button", { name: "ยืนยันบัตร" }).click();
    // ปุ่มยืนยันคำสั่งซื้อจะ enabled หลังข้อความนี้ขึ้น (หน้าหลักรับสัญญาณจาก iframe)
    await expect(this.cardConfirmed).toBeVisible();
  }

  async placeOrder(): Promise<void> {
    await this.acceptTerms.check();
    await this.submitButton.click();
  }
}
