import type { Locator, Page } from "@playwright/test";

// Page Object ของหน้า /checkout (เป็นโครงให้เติมในแบบฝึกหัดข้อ 3 ใน pom-fixtures.spec.ts)
// locator เขียนไว้ให้แล้ว ส่วน method ที่โยน Error อยู่ต้องเขียนเอง
export class CheckoutPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly addressInput: Locator;
  readonly phoneInput: Locator;
  readonly paymentSelect: Locator;
  readonly acceptTerms: Locator;
  readonly orderTotal: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel("ชื่อ-นามสกุล");
    this.addressInput = page.getByLabel("ที่อยู่");
    this.phoneInput = page.getByLabel("เบอร์โทรศัพท์");
    this.paymentSelect = page.getByLabel("วิธีชำระเงิน");
    this.acceptTerms = page.getByLabel("ฉันยอมรับเงื่อนไขการสั่งซื้อ");
    this.orderTotal = page.getByTestId("order-total");
    this.submitButton = page.getByRole("button", { name: "ยืนยันคำสั่งซื้อ" });
  }

  // ข้อ 3 (เฉลย): เปิดหน้า /checkout (ตะกร้าต้องมีของ ไม่อย่างนั้นแอปจะส่งกลับ /cart)
  async goto(): Promise<void> {
    await this.page.goto("/checkout");
  }

  // ข้อ 3: กรอกข้อมูลผู้รับทั้งสามช่อง
  async fillRecipient(name: string, address: string, phone: string): Promise<void> {
    // fill ล้างค่าเดิมก่อนเสมอ (ช่องชื่อถูกเติมให้ถ้า login อยู่) จึงใช้ได้ทั้งตอนช่องว่างและมีค่าอยู่
    await this.nameInput.fill(name);
    await this.addressInput.fill(address);
    await this.phoneInput.fill(phone);
  }

  // ข้อ 3: เลือกวิธีชำระเงินจาก select (ค่าที่ใช้ได้: "card", "transfer", "cod") แล้วติ๊กยอมรับเงื่อนไข แล้วกดยืนยันคำสั่งซื้อ
  async placeOrderWith(payment: "card" | "transfer" | "cod"): Promise<void> {
    // selectOption เลือกตามค่า value ของ <option> (card/transfer/cod) ไม่ใช่ข้อความที่เห็น
    await this.paymentSelect.selectOption(payment);
    // check() ติ๊ก checkbox และตรวจให้ว่าติ๊กแล้วจริง (ถ้าติ๊กอยู่แล้วก็ไม่ทำอะไร)
    await this.acceptTerms.check();
    // ปุ่มยืนยัน disabled จนกว่าฟอร์มครบ click() จึงรอให้ enabled ให้เอง (ถ้าเลือก card ต้องยืนยันบัตรใน iframe ด้วย ซึ่ง method นี้ไม่ได้ทำ)
    await this.submitButton.click();
  }
}
