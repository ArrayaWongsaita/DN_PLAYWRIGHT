import type { Locator, Page } from "@playwright/test";

// หัวเว็บที่มีทุกหน้า แยกเป็นคลาสของตัวเองเพราะหลาย Page Object ต้องใช้ (จำนวนในตะกร้า, ลิงก์บัญชี)
export class Header {
  readonly nav: Locator;
  readonly cartCount: Locator;
  readonly accountLink: Locator;
  readonly logoutButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.nav = page.getByRole("navigation", { name: "เมนูหลัก" });
    // data-testid="cart-count" อยู่ในลิงก์ "ตะกร้า (N)" ใช้ testid เพราะอ่านตัวเลขล้วนได้ง่ายกว่าชื่อลิงก์ทั้งก้อน
    this.cartCount = page.getByTestId("cart-count");
    this.accountLink = this.nav.getByRole("link", { name: "บัญชีของฉัน" });
    this.logoutButton = page.getByRole("button", { name: "ออกจากระบบ" });
    this.loginLink = this.nav.getByRole("link", { name: "เข้าสู่ระบบ" });
  }
}
