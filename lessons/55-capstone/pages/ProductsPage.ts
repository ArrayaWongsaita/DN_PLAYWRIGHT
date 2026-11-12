import { expect, type Locator, type Page } from "@playwright/test";

// หน้า /products: ค้นหาและเพิ่มลงตะกร้า (หน้านี้ดึงรายการจาก API ฝั่ง browser)
export class ProductsPage {
  readonly page: Page;
  readonly searchBox: Locator;
  readonly searchButton: Locator;
  readonly items: Locator;
  readonly resultCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.getByRole("search").getByLabel("ค้นหาสินค้า");
    this.searchButton = page.getByRole("button", { name: "ค้นหา" });
    this.items = page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem");
    this.resultCount = page.getByText(/^พบสินค้า \d+ รายการ$/);
  }

  async goto(): Promise<void> {
    await this.page.goto("/products");
  }

  async search(term: string): Promise<void> {
    await this.searchBox.fill(term);
    // ถ้ากรอกก่อนที่หน้าจะ hydrate ค่าอาจถูกล้าง ตรวจค่าเพื่อให้ล้มตรงจุดนี้ ไม่ใช่ไปล้มที่ผลการค้นหา
    await expect(this.searchBox).toHaveValue(term);
    await this.searchButton.click();
  }

  card(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  async addToCart(name: string): Promise<void> {
    await this.card(name).getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
    // รอข้อความสถานะของสินค้าชิ้นนี้ก่อนจบ method (เป็นส่วนของ action ไม่ใช่การตัดสินผลของ test)
    // ถ้าไม่รอ การกดชิ้นถัดไปทันทีอาจแข่งกับ request ของชิ้นก่อน แล้วข้อความสถานะของชิ้นก่อนก็จะถูกทับ
    await expect(this.page.getByRole("status").filter({ hasText: `เพิ่ม "${name}" ลงตะกร้าแล้ว` })).toBeVisible();
  }
}
