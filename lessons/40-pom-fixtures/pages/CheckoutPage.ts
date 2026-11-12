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

  // ข้อ 3: เปิดหน้า /checkout (ตะกร้าต้องมีของ ไม่อย่างนั้นแอปจะส่งกลับ /cart)
  async goto(): Promise<void> {
    throw new Error("👉 ยังไม่ได้เขียน method นี้");
  }

  // ข้อ 3: กรอกข้อมูลผู้รับทั้งสามช่อง
  async fillRecipient(_name: string, _address: string, _phone: string): Promise<void> {
    throw new Error("👉 ยังไม่ได้เขียน method นี้");
  }

  // ข้อ 3: เลือกวิธีชำระเงินจาก select (ค่าที่ใช้ได้: "card", "transfer", "cod") แล้วติ๊กยอมรับเงื่อนไข แล้วกดยืนยันคำสั่งซื้อ
  async placeOrderWith(_payment: "card" | "transfer" | "cod"): Promise<void> {
    throw new Error("👉 ยังไม่ได้เขียน method นี้");
  }
}
