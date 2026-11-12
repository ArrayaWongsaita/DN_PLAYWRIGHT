import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 53: seed test ของ Test Agents
// seed test คือ test เล็กๆ ที่เตรียม "จุดเริ่มต้น" ให้ planner และ generator
// agent จะรัน test นี้ก่อน เพื่อให้ได้หน้า (page) ที่พร้อมใช้ แล้วค่อยสำรวจ/อัดขั้นตอนต่อจากตรงนี้
// ไฟล์นี้ผ่านบน main: เปิด /products แล้วตรวจว่าหน้าพร้อม
// ================================================

test.describe("Seed", () => {
  test("seed: เปิดหน้าสินค้าและรอจนรายการสินค้าพร้อม", async ({ page }) => {
    // เปิดหน้าที่ agent จะเริ่มสำรวจ (baseURL มาจาก config จึงใช้ path สั้นๆ)
    await page.goto("/products");

    // ตรวจว่าหน้าพร้อมแล้ว (ไม่ใช่แค่โหลดเสร็จ): เห็นหัวข้อและรายการสินค้า
    // ถ้า seed ไม่รอให้หน้าพร้อม agent อาจเริ่มสำรวจตอนหน้ายังว่างแล้วเขียนแผนผิด
    await expect(page.getByRole("heading", { name: "สินค้าทั้งหมด", level: 1 })).toBeVisible();
    await expect(page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem")).toHaveCount(10);
  });
});
