import type { Locator, Page } from "@playwright/test";

// หน้า /account: ข้อมูลบัญชีและประวัติคำสั่งซื้อ
export class AccountPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly historyHeading: Locator;
  readonly emptyHistory: Locator;
  readonly historyItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "บัญชีของฉัน" });
    this.historyHeading = page.getByRole("heading", { name: "ประวัติคำสั่งซื้อ" });
    this.emptyHistory = page.getByText("ยังไม่มีคำสั่งซื้อ");
    this.historyItems = page.getByRole("list", { name: "ประวัติคำสั่งซื้อ" }).getByRole("listitem");
  }

  async goto(): Promise<void> {
    await this.page.goto("/account");
  }

  historyItem(orderId: string): Locator {
    return this.historyItems.filter({ hasText: orderId });
  }
}
