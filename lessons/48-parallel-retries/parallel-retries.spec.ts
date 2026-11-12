import { test, expect, type Page } from "@playwright/test";

// ================================================
// บทที่ 48: รันขนาน, retry และ test ที่ไม่นิ่ง (parallel, retries, flaky)
// ฝึก: mode serial/parallel, retries, --repeat-each, --fail-on-flaky-tests, workers
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// รันด้วย: pnpm test --config lessons/48-parallel-retries/playwright.config.ts
// ================================================

// แนวคิด: Playwright แจก test ให้หลาย worker รันพร้อมกัน แต่ละ test ได้ browser context ใหม่ของตัวเอง (ตะกร้าแยกกัน)
// ถ้ากลุ่ม test ต้องส่งต่อสถานะกัน ให้ใช้ mode "serial" และถ้า test ไม่นิ่ง retries ช่วยรันซ้ำแต่ไม่ได้ซ่อมให้


// ------------------------------------------------
// ตัวอย่างที่ 1: กลุ่ม serial ที่ใช้ page ร่วมกัน (ต้องรันตามลำดับ)
// ------------------------------------------------
test.describe("ตะกร้าที่ต่อเนื่องกันเป็นขั้นตอน", () => {
  // serial: test รันตามลำดับในไฟล์ ถ้าตัวใดล้ม ตัวที่เหลือถูกข้าม และถ้า retry จะรันทั้งกลุ่มใหม่ตั้งแต่ต้น
  test.describe.configure({ mode: "serial" });

  let page: Page;

  // page ปกติถูกสร้างใหม่ทุก test จึงส่งต่อสถานะไม่ได้ ในกลุ่ม serial เราสร้างเองครั้งเดียวแล้วใช้ร่วมกัน
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("ขั้นที่ 1: เพิ่มหูฟังลงตะกร้า", async () => {
    await page.goto("/products");
    await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
    await expect(page.getByRole("status").filter({ hasText: "ลงตะกร้าแล้ว" })).toBeVisible();
  });

  test("ขั้นที่ 2: ตะกร้ายังมีของจากขั้นที่ 1", async () => {
    // page ตัวเดิม จึงมี cookie ตะกร้าเดิม
    await page.goto("/cart");
    await expect(page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem")).toHaveCount(1);
  });
});


// ------------------------------------------------
// ตัวอย่างที่ 2: test ที่ไม่นิ่ง (สุ่มล้ม 30%) ติด tag @flaky-demo
// ------------------------------------------------
// tag นี้ทำให้เลือกรัน/ข้ามได้: pnpm test ... --grep @flaky-demo (เฉพาะตัวนี้) หรือ --grep-invert @flaky-demo (ข้ามตัวนี้)
// pnpm verify ข้าม test ที่ติด tag นี้ให้ เพราะผลสุ่ม ตัวอย่างนี้มีไว้ดู retry เท่านั้น
test("ผลลัพธ์สุ่มต้องสำเร็จ (ล้มเองบางรอบ)", { tag: "@flaky-demo" }, async ({ page }) => {
  await page.goto("/playground/flaky?failRate=0.3");
  // ถ้าหน้าสุ่มได้ "ล้มเหลว" บรรทัดนี้จะรอจนหมดเวลาแล้ว fail
  await expect(page.getByRole("status").filter({ hasText: "ผลลัพธ์: สำเร็จ" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: test ที่นิ่ง รันซ้ำกี่รอบก็ต้องผ่าน
// แนวทาง: goto("/") ตรวจ h1 "DN Shop" toBeVisible() แล้วลองรันด้วย --repeat-each=10 ผลต้องผ่านทั้ง 10 รอบ
// ------------------------------------------------
test.fixme("หน้าแรกนิ่ง รันซ้ำแล้วผ่านทุกรอบ", async ({ page }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: กลุ่ม mode parallel
// แนวทาง: ใน test.describe ใส่ test.describe.configure({ mode: "parallel" }) แล้วเขียน test สองตัวที่ไม่เกี่ยวกัน
//        ตัวหนึ่ง goto("/stores") ตรวจ h1 "สาขาของเรา" อีกตัว goto("/help/ordering") ตรวจ h1 "คู่มือการสั่งซื้อ"
//        รันด้วย --workers=2 แล้วดูใน README ว่าสองตัวนี้ไปอยู่คนละ worker ได้อย่างไร
// ------------------------------------------------
test.describe("สองหน้าที่ไม่เกี่ยวกัน", () => {
  // 👉 ใส่ test.describe.configure({ mode: "parallel" }) ที่นี่

  test.fixme("หน้าสาขามี h1 สาขาของเรา", async ({ page }) => {
    // 👉 เขียน test ของข้อ 2 (ตัวแรก) ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });

  test.fixme("หน้าคู่มือมี h1 คู่มือการสั่งซื้อ", async ({ page }) => {
    // 👉 เขียน test ของข้อ 2 (ตัวที่สอง) ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });
});


// ------------------------------------------------
// ข้อ 3: กลุ่ม serial ที่ส่งต่อสถานะผ่านตัวแปร
// แนวทาง: ใน test.describe.configure({ mode: "serial" }) ประกาศ let page: Page สร้างใน test.beforeAll ด้วย browser.newPage() ปิดใน afterAll
//        ขั้น 1: goto("/products") กดปุ่ม "เพิ่มลงตะกร้า" ตัวแรก รอ status "ลงตะกร้าแล้ว" (filter hasText)
//        ขั้น 2: goto("/cart") ตรวจว่า li ใน list "สินค้าในตะกร้า" มี 1 รายการ แล้วกด "ลบ" (ต้องรับ confirm ด้วย page.once("dialog", d => d.accept()))
//        ขั้น 3: ตรวจว่า "ตะกร้าของคุณยังว่างอยู่" เห็นอยู่
// ------------------------------------------------
test.describe("ใส่ ลบ แล้วตะกร้าว่าง", () => {
  // 👉 ใส่ test.describe.configure({ mode: "serial" }) และสร้าง page ที่นี่

  test.fixme("ขั้นที่ 1: เพิ่มของ", async () => {
    // 👉 เขียนขั้นที่ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });

  test.fixme("ขั้นที่ 2: ลบของ", async () => {
    // 👉 เขียนขั้นที่ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });

  test.fixme("ขั้นที่ 3: ตะกร้าว่าง", async () => {
    // 👉 เขียนขั้นที่ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
  });
});


// ------------------------------------------------
// ข้อ 4: ดูสถานะ flaky ด้วยตัวเอง
// แนวทาง: เขียน test ติด tag @flaky-demo (ใส่ { tag: "@flaky-demo" } เป็นอาร์กิวเมนต์ที่สอง) ที่ goto("/playground/flaky?failRate=0.5")
//        แล้วตรวจ status "ผลลัพธ์: สำเร็จ" จากนั้นรันด้วย --grep @flaky-demo --repeat-each=10 และรันอีกรอบด้วย --fail-on-flaky-tests
//        สังเกตบรรทัดสรุปและ exit code
// ------------------------------------------------
test.fixme("ผลลัพธ์สุ่มครึ่งต่อครึ่ง", { tag: "@flaky-demo" }, async ({ page }) => {
  // 👉 เขียน test ของข้อ 4 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
