import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 19: จัดกลุ่มด้วย describe และ hooks
// ฝึก: test.describe, beforeEach, afterEach (ใช้ testInfo), describe ซ้อนกัน
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: describe + beforeEach ที่ goto หน้าเดียวกันก่อนทุก test
// ------------------------------------------------
test.describe("หน้าสินค้า หูฟังไร้สาย DN Buds", () => {
  // beforeEach ทำงานก่อนทุก test ใน describe นี้ และรับ fixture ได้เหมือนใน test (ที่นี่ใช้ { page })
  // page เป็นของ test นั้นๆ โดยเฉพาะ จึงเปิดหน้าใหม่สะอาดทุกครั้ง
  test.beforeEach(async ({ page }) => {
    await page.goto("/products/p01");
  });

  test("แสดงชื่อสินค้าเป็น heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("หูฟังไร้สาย DN Buds");
  });

  test("แสดงราคา 1,290 บาท", async ({ page }) => {
    await expect(page.getByText("1,290 บาท")).toBeVisible();
  });
});


// ------------------------------------------------
// ตัวอย่างที่ 2: afterEach ที่ใช้ testInfo (ข้อมูลของ test ที่เพิ่งรันจบ)
// ------------------------------------------------
test.describe("หน้าสินค้า เสื้อยืด DN สีขาว", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products/p04");
  });

  // อาร์กิวเมนต์ที่สองของ hook คือ testInfo มี title, status, duration, expectedStatus ฯลฯ
  // afterEach ทำงานแม้ test จะ fail ใช้เก็บข้อมูลประกอบ เช่น แนบ URL ที่หน้าค้างอยู่ตอนจบ
  test.afterEach(async ({ page }, testInfo) => {
    await testInfo.attach("url-ตอนจบ", { body: page.url(), contentType: "text/plain" });
    console.log(`[จบ] ${testInfo.title} -> ${testInfo.status}`);
  });

  test("แสดงชื่อสินค้าเป็น heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("เสื้อยืด DN สีขาว");
  });

  test("แสดงลิงก์กลับไปหน้าสินค้า", async ({ page }) => {
    await expect(page.getByRole("link", { name: "← กลับไปหน้าสินค้า" })).toBeVisible();
  });
});


// ------------------------------------------------
// ข้อ 1: describe "หน้าสินค้า คีย์บอร์ดเครื่องกล" ที่ใช้ beforeEach goto("/products/p02") ร่วมกันทั้ง 2 test
// แนวทาง: เหมือนตัวอย่างที่ 1 เพิ่ม test.beforeEach ที่ goto ไว้ในกลุ่มนี้ แล้วเขียนสอง test
//        test แรกตรวจ heading ระดับ 1 มีข้อความ "คีย์บอร์ดเครื่องกล" test ที่สองตรวจว่าเห็นข้อความราคา "2,490 บาท"
//        (goto อยู่ใน beforeEach เท่านั้น ไม่ใส่ซ้ำในตัว test)
// ------------------------------------------------
test.describe("หน้าสินค้า คีย์บอร์ดเครื่องกล", () => {
  // goto อยู่ที่เดียวใน beforeEach: ทุก test ในกลุ่มนี้เริ่มจากหน้า p02 ที่เปิดไว้แล้ว (page ตัวเดียวกับที่ test ได้รับ)
  test.beforeEach(async ({ page }) => {
    await page.goto("/products/p02");
  });

  test("แสดงชื่อสินค้าเป็น heading", async ({ page }) => {
    // ไม่มี goto ในนี้ เพราะ beforeEach เปิดหน้าให้แล้ว
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("คีย์บอร์ดเครื่องกล");
  });

  test("แสดงราคา 2,490 บาท", async ({ page }) => {
    await expect(page.getByText("2,490 บาท")).toBeVisible();
  });
});


// ------------------------------------------------
// ข้อ 2: describe ซ้อนกัน หน้า /products/p03 (เมาส์ไร้สาย) ตรวจปุ่มจำนวน
// แนวทาง: describe ด้านนอกมี beforeEach goto("/products/p03") ด้านในมี describe "ปุ่มจำนวน" อีกชั้น
//        test ที่ 1: ปุ่ม "ลดจำนวน" ต้อง disabled (toBeDisabled) ตอนเริ่ม
//        test ที่ 2: กด "เพิ่มจำนวน" หนึ่งครั้ง แล้วช่อง "จำนวน" (getByLabel) ต้องมีค่า "2" (toHaveValue)
//        beforeEach ของชั้นนอกจะทำงานก่อนทุก test ของชั้นใน
// ------------------------------------------------
test.describe("หน้าสินค้า เมาส์ไร้สาย", () => {
  // beforeEach ของกลุ่มนอกทำงานก่อนทุก test ของกลุ่มในด้วย (ลำดับ: นอก -> ใน -> test)
  test.beforeEach(async ({ page }) => {
    await page.goto("/products/p03");
  });

  test.describe("ปุ่มจำนวน", () => {
    test("ปุ่มลดจำนวนกดไม่ได้ตอนเริ่ม", async ({ page }) => {
      // จำนวนเริ่มที่ 1 จึงลดไม่ได้ (disabled)
      await expect(page.getByRole("button", { name: "ลดจำนวน" })).toBeDisabled();
    });

    test("กดเพิ่มจำนวนแล้วช่องจำนวนเป็น 2", async ({ page }) => {
      await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
      // ช่องจำนวนเป็น input จึงตรวจค่าด้วย toHaveValue (ค่าเป็น string เสมอ)
      await expect(page.getByLabel("จำนวน")).toHaveValue("2");
    });
  });
});


// ------------------------------------------------
// ข้อ 3: เพิ่ม afterEach ที่ใช้ testInfo ให้หน้า /products/p07 (หมอนอิงลายแมว)
// แนวทาง: ในกลุ่มนี้มี beforeEach goto และ afterEach รับ ({ page }, testInfo)
//        ใน afterEach เรียก testInfo.attach("หัวข้อหน้า", { body: await page.title(), contentType: "text/plain" })
//        ตัว test ตรวจแค่ว่า heading ระดับ 1 คือ "หมอนอิงลายแมว" (ดูผลที่แนบใน HTML report: pnpm report)
// ------------------------------------------------
test.describe("หน้าสินค้า หมอนอิงลายแมว", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products/p07");
  });

  // อาร์กิวเมนต์ที่สองคือ testInfo: attach แนบข้อมูลเข้า HTML report (pnpm report) afterEach ทำงานแม้ test fail
  test.afterEach(async ({ page }, testInfo) => {
    await testInfo.attach("หัวข้อหน้า", { body: await page.title(), contentType: "text/plain" });
  });

  test("แสดงชื่อสินค้าเป็น heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("หมอนอิงลายแมว");
  });
});
