import type { Locator, Page } from "@playwright/test";

// Page Object ของหน้า /login (เขียนเสร็จแล้ว ใช้เป็นตัวอย่าง)
// หน้าที่ของ class นี้: รู้ว่า "หน้า login หน้าตาเป็นอย่างไร" และ "ทำอะไรบนหน้านี้ได้บ้าง"
// ส่วน test ที่ใช้ class นี้ มีหน้าที่บอกว่า "ต้องการตรวจอะไร" เท่านั้น
export class LoginPage {
  // locator เป็น readonly property: ตั้งค่าครั้งเดียวใน constructor แล้วแก้ไม่ได้
  // (locator ไม่ได้ค้นหา element ทันที จึงสร้างไว้ล่วงหน้าได้ ค้นหาตอนใช้งานจริง)
  readonly page: Page;
  readonly email: Locator;
  readonly password: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.email = page.getByLabel("อีเมล");
    this.password = page.getByLabel("รหัสผ่าน");
    this.submitButton = page.getByRole("button", { name: "เข้าสู่ระบบ" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  // ข้อความ error: Next.js มี role="alert" ว่างๆ อยู่ทุกหน้า จึงต้อง filter ด้วยข้อความ (อธิบายในหัวข้อ 5 ของ README)
  errorMessage(text: string): Locator {
    return this.page.getByRole("alert").filter({ hasText: text });
  }

  async login(email: string, password: string): Promise<void> {
    // ปุ่ม "เข้าสู่ระบบ" เป็น disabled จนกว่าทั้งสองช่องจะมีค่า click() จึงรอให้ปุ่ม enabled ก่อนกดให้เอง (auto-wait บท 24)
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitButton.click();
  }
}
