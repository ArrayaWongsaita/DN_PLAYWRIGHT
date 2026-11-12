import { test, expect, type Page } from "@playwright/test";

// ================================================
// บทที่ 54: test ที่ "ดูเหมือน AI เขียน" (รันแล้วผ่าน แต่มีนิสัยไม่ดี 7 อย่าง)
// ไฟล์นี้ตั้งใจให้มีปัญหา ESLint จึงลดกฎเป็น warn เฉพาะบทนี้ (eslint.config.mjs) ห้ามคัดลอกสไตล์นี้ไปใช้จริง
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้ แล้วหาปัญหาแต่ละ "ข้อ N" ตามคอมเมนต์ ลองรัน pnpm lint ดูคำเตือน
// ไฟล์นี้เป็นของที่ให้มา ไม่ต้องแก้ ให้ไปเขียนใหม่ใน reviewed.spec.ts
// ================================================


test("หน้า /products ราคาของสินค้าต้องมีคำว่าบาท", async ({ page }) => {
  await page.goto("/products");

  // ข้อ 1: ใช้ CSS selector (class "product-card" / "price") ที่ผูกกับโครงสร้างโค้ด ถ้านักพัฒนาเปลี่ยนชื่อ class test พังทั้งที่หน้าใช้งานได้เหมือนเดิม
  await expect(page.locator(".product-card .price").first()).toContainText("บาท");
});


test("ค้นหาเมาส์แล้วต้องเห็นผล 1 รายการ", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("searchbox", { name: "ค้นหาสินค้า" }).fill("เมาส์");
  await page.getByRole("button", { name: "ค้นหา" }).click();

  // ข้อ 2: หน่วงเวลาตายตัวด้วย waitForTimeout ช้าเกินจำเป็นเมื่อหน้าเร็ว และยังพังได้เมื่อหน้าช้ากว่าที่เดา ควรใช้ assertion ที่รอเอง
  await page.waitForTimeout(1500);
  await expect(page.getByText("พบสินค้า 1 รายการ")).toBeVisible();
});


test("หน้า /products ต้องแสดงรายการสินค้า 10 รายการ", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem")).toHaveCount(10);

  // ข้อ 3: expect(await ....isVisible()) ตรวจแค่ "ตอนนี้" ครั้งเดียว ไม่รอและไม่ลองใหม่
  // บรรทัดนี้ผ่านเพราะบรรทัดด้านบนรอให้หน้าพร้อมแล้ว ถ้าลบบรรทัดนั้นออก test จะผ่านบ้างล้มบ้าง และข้อความล้มก็บอกอะไรไม่ได้ ("expected true, received false")
  expect(await page.getByText("พบสินค้า 10 รายการ").isVisible()).toBe(true);
});


test("หน้า /products หัวข้อหลักต้องเป็น สินค้าทั้งหมด", async ({ page }) => {
  await page.goto("/products");

  // ข้อ 4: page.$ คืน ElementHandle (ไม่รอ ไม่ลองใหม่ และเป็น API ที่เอกสารแนะนำให้เลี่ยง) แล้วอ่านค่าเองด้วย textContent
  // ควรใช้ locator กับ expect(...).toHaveText(...)
  const heading = await page.$("h1");
  expect(await heading?.textContent()).toBe("สินค้าทั้งหมด");
});


test("เปิดหน้าตะกร้าแล้วกดเลือกซื้อสินค้า", async ({ page }) => {
  await page.goto("/cart");
  await page.getByRole("link", { name: "เลือกซื้อสินค้า" }).click();

  // ข้อ 6: test นี้ไม่มี assertion เลย "ผ่าน" ตราบเท่าที่ไม่มี error ระหว่างกด ต่อให้พาไปผิดหน้าก็ผ่าน
});


test("ใช้ URL เต็มของเซิร์ฟเวอร์ในหน้าสาขา", async ({ page }) => {
  // ข้อ 7: ใส่ URL เต็มพร้อมพอร์ต (http://localhost:3100) แทนที่จะใช้ baseURL จาก config ถ้าย้ายพอร์ตหรือรันบน CI ที่ URL ต่างไป ต้องแก้ทุกบรรทัด
  await page.goto("http://localhost:3100/stores");
  await expect(page.getByRole("heading", { name: "สาขาของเรา", level: 1 })).toBeVisible();
});


// ข้อ 5: test สองข้อนี้ต้องพึ่งลำดับกัน: ข้อที่สองใช้ตะกร้าที่ข้อแรกเพิ่มไว้ในหน้าเดียวกัน (sharedPage)
// จึงต้องบังคับ serial และถ้ารันเฉพาะข้อที่สอง (pnpm test 54-review-ai-tests -g "ตะกร้ามีเมาส์") จะล้ม
// test ที่ดีต้องเตรียมข้อมูลของตัวเองได้ครบ ไม่ฝากไว้กับ test ก่อนหน้า
test.describe("ตะกร้า (พึ่งลำดับ)", () => {
  test.describe.configure({ mode: "serial" });

  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
  });

  test.afterAll(async () => {
    await sharedPage.close();
  });

  test("เพิ่มเมาส์ไร้สายลงตะกร้า", async () => {
    await sharedPage.goto("/products");
    await sharedPage
      .getByRole("listitem")
      .filter({ hasText: "เมาส์ไร้สาย" })
      .getByRole("button", { name: "เพิ่มลงตะกร้า" })
      .click();
    await expect(sharedPage.getByRole("status").filter({ hasText: 'เพิ่ม "เมาส์ไร้สาย" ลงตะกร้าแล้ว' })).toBeVisible();
  });

  test("ตะกร้ามีเมาส์ไร้สายอยู่ 1 ชิ้น", async () => {
    // ไม่ได้เพิ่มของเอง เชื่อว่า test ก่อนหน้าเพิ่มไว้แล้ว
    await sharedPage.goto("/cart");
    await expect(sharedPage.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem")).toHaveCount(1);
    await expect(sharedPage.getByRole("list", { name: "สินค้าในตะกร้า" })).toContainText("เมาส์ไร้สาย");
  });
});
