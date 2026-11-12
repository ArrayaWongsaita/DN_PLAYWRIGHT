// spec: lessons/53-test-agents/example-plan.md
// seed: lessons/53-test-agents/seed.spec.ts
import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 53: test ที่ generator agent เขียนจากแผน (example-plan.md)
// ฝึก: อ่านโครงของ test ที่ generator เขียน: comment บอกไฟล์แผนกับ seed, describe ตรงกับหัวข้อใหญ่ของแผน,
//      ชื่อ test ตรงกับสถานการณ์, มี comment ของแต่ละขั้นก่อนโค้ด
// ไฟล์ตัวอย่างนี้เขียนมือให้เป็นแบบเดียวกับที่ generator ผลิต แล้วตรวจและปรับให้ตรง best practices แล้ว
// ผลจริงของ generator จะต่างออกไป และต้องผ่านการตรวจแบบเดียวกันก่อนเก็บ (ดู README)
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: แผนข้อ 1.1 ค้นหาสินค้าที่มีอยู่
// ------------------------------------------------
test.describe("ค้นหาและกรองสินค้า", () => {
  test("ค้นหาสินค้าที่มีอยู่", async ({ page }) => {
    // seed: เปิดหน้า /products
    await page.goto("/products");

    // 1. เปิดหน้า /products ทำใน seed แล้ว
    // 2. พิมพ์ "เมาส์" ในช่อง "ค้นหาสินค้า"
    await page.getByRole("searchbox", { name: "ค้นหาสินค้า" }).fill("เมาส์");

    // 3. กดปุ่ม "ค้นหา"
    await page.getByRole("button", { name: "ค้นหา" }).click();

    // ผลที่คาดหวัง
    await expect(page.getByText("พบสินค้า 1 รายการ")).toBeVisible();
    await expect(page.getByRole("link", { name: "เมาส์ไร้สาย" })).toBeVisible();
  });


  // ------------------------------------------------
  // ตัวอย่างที่ 2: แผนข้อ 1.2 ค้นหาแล้วไม่พบสินค้า
  // ------------------------------------------------
  test("ค้นหาแล้วไม่พบสินค้า", async ({ page }) => {
    await page.goto("/products");

    // 2. พิมพ์ข้อความที่ไม่ตรงกับสินค้าใดเลย
    await page.getByRole("searchbox", { name: "ค้นหาสินค้า" }).fill("ไม่มีสินค้านี้แน่นอน");

    // 3. กดปุ่ม "ค้นหา"
    await page.getByRole("button", { name: "ค้นหา" }).click();

    await expect(page.getByText("พบสินค้า 0 รายการ")).toBeVisible();
    await expect(page.getByText("ไม่พบสินค้าที่ค้นหา")).toBeVisible();
  });


  // ------------------------------------------------
  // ข้อ 1: แผนข้อ 1.3 กรองตามหมวดเสื้อผ้า
  // แนวทาง: ทำเองหรือให้ generator เขียนก็ได้ (ดู README) ถ้าเขียนเอง ใช้ getByLabel("หมวดหมู่").selectOption({ label: "เสื้อผ้า" })
  //        แล้วตรวจข้อความ "พบสินค้า 2 รายการ" และลิงก์ "เสื้อยืด DN สีขาว" กับ "หมวกแก๊ป"
  //        รักษาโครงแบบ generator: comment ของแต่ละขั้น และชื่อ test ตรงกับแผน
  // ------------------------------------------------
  test("กรองตามหมวดเสื้อผ้า", async ({ page }) => {
    await page.goto("/products");

    // 2. เลือก "เสื้อผ้า" ใน "หมวดหมู่" (selectOption เลือกจากข้อความที่ผู้ใช้เห็น)
    await page.getByLabel("หมวดหมู่").selectOption({ label: "เสื้อผ้า" });

    // ผลที่คาดหวัง: มี 2 รายการ คือเสื้อยืดกับหมวก (ข้อมูล seed)
    await expect(page.getByText("พบสินค้า 2 รายการ")).toBeVisible();
    await expect(page.getByRole("link", { name: "เสื้อยืด DN สีขาว" })).toBeVisible();
    await expect(page.getByRole("link", { name: "หมวกแก๊ป" })).toBeVisible();
  });
});


test.describe("ตะกร้าและโค้ดส่วนลด", () => {
  // ------------------------------------------------
  // ข้อ 2: แผนข้อ 2.1 เพิ่มสินค้าลงตะกร้า
  // แนวทาง: เปิด /products กดปุ่ม "เพิ่มลงตะกร้า" ในรายการ (listitem) ของ "เมาส์ไร้สาย" (filter({ hasText }))
  //        ตรวจ role="status" ที่มีข้อความ เพิ่ม "เมาส์ไร้สาย" ลงตะกร้าแล้ว และลิงก์ชื่อ "ตะกร้า (1)" (หรือ /ตะกร้า/)
  // ------------------------------------------------
  test("เพิ่มสินค้าลงตะกร้า", async ({ page }) => {
    await page.goto("/products");

    // 2. กด "เพิ่มลงตะกร้า" ที่สินค้า "เมาส์ไร้สาย": ปุ่มชื่อซ้ำกันทุกการ์ด จึงต้องกรองจาก listitem ที่มีชื่อสินค้านั้นก่อน
    await page
      .getByRole("listitem")
      .filter({ hasText: "เมาส์ไร้สาย" })
      .getByRole("button", { name: "เพิ่มลงตะกร้า" })
      .click();

    // ผลที่คาดหวัง
    await expect(page.getByRole("status").filter({ hasText: 'เพิ่ม "เมาส์ไร้สาย" ลงตะกร้าแล้ว' })).toBeVisible();
    await expect(page.getByRole("link", { name: "ตะกร้า (1)" })).toBeVisible();
  });


  // ------------------------------------------------
  // ข้อ 3: แผนข้อ 2.2 ใช้โค้ดส่วนลด DN10 (ต้องเพิ่มของลงตะกร้าก่อนในตัว test เอง ห้ามพึ่ง test ข้อ 2)
  // แนวทาง: เพิ่มเมาส์ไร้สายลงตะกร้า รอข้อความ status แล้ว goto("/cart") กรอก "โค้ดส่วนลด" ด้วย DN10 กด "ใช้โค้ด"
  //        ตรวจ status "ใช้โค้ด DN10 แล้ว ลด 10%" และ getByTestId ของ subtotal, discount, total ตามผลที่คาดหวังในแผน
  // ------------------------------------------------
  test("ใช้โค้ดส่วนลด DN10", async ({ page }) => {
    // 1. เพิ่มเมาส์ไร้สายลงตะกร้าใน test นี้เอง (ไม่พึ่ง test ข้อ 2 เพราะ test รันขนานกันและแต่ละตัวมีตะกร้าของตัวเอง)
    await page.goto("/products");
    await page
      .getByRole("listitem")
      .filter({ hasText: "เมาส์ไร้สาย" })
      .getByRole("button", { name: "เพิ่มลงตะกร้า" })
      .click();
    // รอข้อความสำเร็จก่อนไปหน้าอื่น ไม่งั้นอาจออกจากหน้าก่อนที่เซิร์ฟเวอร์รับของเสร็จ
    await expect(page.getByRole("status").filter({ hasText: 'เพิ่ม "เมาส์ไร้สาย" ลงตะกร้าแล้ว' })).toBeVisible();

    // 2. ไปที่หน้า /cart
    await page.goto("/cart");

    // 3. กรอก "DN10" ในช่อง "โค้ดส่วนลด" และ 4. กดปุ่ม "ใช้โค้ด"
    await page.getByLabel("โค้ดส่วนลด").fill("DN10");
    await page.getByRole("button", { name: "ใช้โค้ด" }).click();

    // ผลที่คาดหวัง: 590 บาท ลด 10% = 59 บาท เหลือ 531 บาท
    await expect(page.getByRole("status").filter({ hasText: "ใช้โค้ด DN10 แล้ว ลด 10%" })).toBeVisible();
    await expect(page.getByTestId("subtotal")).toHaveText("590 บาท");
    await expect(page.getByTestId("discount")).toHaveText("59 บาท");
    await expect(page.getByTestId("total")).toHaveText("531 บาท");
  });
});
