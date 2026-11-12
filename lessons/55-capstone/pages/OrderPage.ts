import type { Download, Locator, Page } from "@playwright/test";

// หน้า /orders/{id}: ผลหลังสั่งซื้อสำเร็จและลิงก์ดาวน์โหลดใบเสร็จ
export class OrderPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly orderNumber: Locator;
  readonly netTotal: Locator;
  readonly receiptLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "สั่งซื้อสำเร็จ" });
    this.orderNumber = page.getByText(/^หมายเลขคำสั่งซื้อ: /);
    this.netTotal = page.getByText(/^ยอดสุทธิ:/);
    this.receiptLink = page.getByRole("link", { name: "ดาวน์โหลดใบเสร็จ" });
  }

  async goto(orderId: string): Promise<void> {
    await this.page.goto(`/orders/${orderId}`);
  }

  async downloadReceipt(): Promise<Download> {
    // สร้างตัวรอ event ก่อนกดลิงก์ ถ้ากดก่อนแล้วค่อยรอ อาจพลาด event ที่เกิดไปแล้ว (บท 27)
    const downloadPromise = this.page.waitForEvent("download");
    await this.receiptLink.click();
    return downloadPromise;
  }
}
