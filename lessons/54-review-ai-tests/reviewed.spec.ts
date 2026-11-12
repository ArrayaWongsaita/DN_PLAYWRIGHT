import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 54: เขียนใหม่ให้ถูกตาม best practices (คู่กับ ai-written.spec.ts)
// ฝึก: แทน CSS selector ด้วย getByRole, แทน waitForTimeout ด้วย assertion ที่รอเอง,
//      แทน expect(await ...isVisible()) และ page.$, ใส่ assertion, ทำให้ test ไม่พึ่งลำดับ, ใช้ baseURL
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// เลขข้อตรงกับ "ข้อ N" ในคอมเมนต์ของ ai-written.spec.ts: ตัวอย่างเขียนใหม่ข้อ 1 และ 2 ให้ดู ส่วนแบบฝึกหัดคือข้อ 3 ถึง 7
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: เขียนใหม่ข้อ 1 (CSS selector) ให้หาด้วย role
// ------------------------------------------------
test("หน้า /products การ์ดสินค้าทุกใบต้องแสดงราคาเป็นบาท", async ({ page }) => {
  await page.goto("/products");

  // แทน ".product-card .price" ด้วยรายการ (list) และรายการย่อย (listitem) ตามความหมายของหน้า
  // class เปลี่ยนชื่อได้ตามใจนักพัฒนา แต่ role ของรายการเปลี่ยนยากกว่ามาก (และเปลี่ยนแปลว่าหน้าเปลี่ยนความหมาย)
  const cards = page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem");
  await expect(cards).toHaveCount(10);
  // ตรวจใบแรกและใบสุดท้ายด้วย regex ที่รับราคาได้ทุกตัว (เช่น "1,290 บาท" หรือ "120 บาท") ไม่ผูกกับราคาตายตัว
  await expect(cards.first()).toContainText(/\d[\d,]* บาท/);
  await expect(cards.last()).toContainText(/\d[\d,]* บาท/);
});


// ------------------------------------------------
// ตัวอย่างที่ 2: เขียนใหม่ข้อ 2 (waitForTimeout) ให้ assertion รอเอง
// ------------------------------------------------
test("ค้นหาเมาส์แล้วต้องเห็นผล 1 รายการ", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("searchbox", { name: "ค้นหาสินค้า" }).fill("เมาส์");
  await page.getByRole("button", { name: "ค้นหา" }).click();

  // ลบ waitForTimeout ออก: expect(...).toBeVisible() ลองซ้ำเองจนครบเวลา (ค่าเริ่มต้น 5 วินาที) แล้วจบทันทีที่เห็น
  await expect(page.getByText("พบสินค้า 1 รายการ")).toBeVisible();
  // ตรวจชื่อสินค้าด้วย เพื่อให้รู้ว่า "ผลที่เห็น" คือเมาส์จริงๆ
  await expect(page.getByRole("link", { name: "เมาส์ไร้สาย" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 3: เขียนใหม่ข้อ 3 (expect(await ...isVisible()))
// แนวทาง: ตรวจว่ามีรายการสินค้า 10 รายการ และข้อความ "พบสินค้า 10 รายการ" ด้วย toBeVisible ของ expect ตรงๆ
//        (expect(locator).toBeVisible() ไม่ต้องมี await ซ้อนข้างใน) ไม่ต้องมีบรรทัด toHaveCount คั่นเพื่อรอ
// ------------------------------------------------
test("หน้า /products ต้องแสดงรายการสินค้า 10 รายการ (เขียนใหม่)", async ({ page }) => {
  await page.goto("/products");

  // ทุกบรรทัดเป็น web-first assertion: รอเองและลองใหม่ ไม่ต้องมีบรรทัดอื่นมาคั่นเพื่อ "รอให้หน้าพร้อม"
  // ของเดิมผ่านเพราะบรรทัด toHaveCount ด้านบนรอแทน ส่วน isVisible() ตรวจแค่ชั่วขณะแล้วจบ ล้มด้วยข้อความ "expected true, received false" ที่บอกอะไรไม่ได้
  await expect(page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem")).toHaveCount(10);
  await expect(page.getByText("พบสินค้า 10 รายการ")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: เขียนใหม่ข้อ 4 (page.$ และ textContent)
// แนวทาง: หา heading ระดับ 1 ชื่อ "สินค้าทั้งหมด" ด้วย getByRole แล้วตรวจข้อความด้วย toHaveText (ไม่ต้องอ่านค่าเอง)
// ------------------------------------------------
test("หน้า /products หัวข้อหลักต้องเป็น สินค้าทั้งหมด (เขียนใหม่)", async ({ page }) => {
  await page.goto("/products");

  // page.$ คืน handle ที่ไม่รอและไม่ลองใหม่ แล้วเราต้องอ่านค่าเอง locator + toHaveText รอเองและบอกค่าที่ได้จริงเมื่อล้ม
  // level: 1 ระบุว่าเป็น h1 (ตรงกับ "h1" ของเดิม) และ name ระบุข้อความ
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("สินค้าทั้งหมด");
});


// ------------------------------------------------
// ข้อ 5: เขียนใหม่ข้อ 5 (test พึ่งลำดับกัน) ให้เหลือ test เดียวที่ทำงานคนเดียวได้
// แนวทาง: เพิ่มเมาส์ไร้สายลงตะกร้าใน test นี้เอง (ปุ่ม "เพิ่มลงตะกร้า" ใน listitem ของเมาส์ แล้วรอ role="status" ข้อความ เพิ่ม "เมาส์ไร้สาย" ลงตะกร้าแล้ว)
//        แล้ว goto("/cart") ตรวจว่า list "สินค้าในตะกร้า" มี 1 รายการและมีคำว่า "เมาส์ไร้สาย" ใช้ page ที่ fixture ให้ ไม่ต้องสร้างเอง ไม่ต้อง serial
//        ตรวจแล้วรันเฉพาะ test นี้ด้วย -g ต้องผ่าน
// ------------------------------------------------
test("ตะกร้า เพิ่มเมาส์แล้วเปิด /cart ต้องเห็นเมาส์ 1 ชิ้น (เขียนใหม่)", async ({ page }) => {
  // รวมสอง test เดิมเป็นหนึ่งเรื่องที่เล่าจบในตัว: เตรียมข้อมูลเอง แล้วตรวจผล
  // ใช้ page ของ fixture (แต่ละ test ได้ browser context ใหม่ที่ตะกร้าว่าง) จึงไม่ต้องใช้ serial หรือหน้าที่แชร์กัน
  await page.goto("/products");
  await page
    .getByRole("listitem")
    .filter({ hasText: "เมาส์ไร้สาย" })
    .getByRole("button", { name: "เพิ่มลงตะกร้า" })
    .click();
  // รอข้อความสำเร็จก่อนออกจากหน้า เพื่อให้แน่ใจว่าเซิร์ฟเวอร์รับของแล้ว
  await expect(page.getByRole("status").filter({ hasText: 'เพิ่ม "เมาส์ไร้สาย" ลงตะกร้าแล้ว' })).toBeVisible();

  await page.goto("/cart");
  const items = page.getByRole("list", { name: "สินค้าในตะกร้า" });
  await expect(items.getByRole("listitem")).toHaveCount(1);
  await expect(items).toContainText("เมาส์ไร้สาย");
});


// ------------------------------------------------
// ข้อ 6: เขียนใหม่ข้อ 6 (ไม่มี assertion)
// แนวทาง: เปิด /cart กดลิงก์ "เลือกซื้อสินค้า" แล้วตรวจว่าไปถึงหน้าสินค้าจริง:
//        toHaveURL(/\/products$/) และ heading ระดับ 1 "สินค้าทั้งหมด"
// ------------------------------------------------
test("ตะกร้าว่าง กดเลือกซื้อสินค้าแล้วต้องไปหน้าสินค้า (เขียนใหม่)", async ({ page }) => {
  await page.goto("/cart");
  await page.getByRole("link", { name: "เลือกซื้อสินค้า" }).click();

  // เติม assertion ที่บอก "ผลของการกด": URL เปลี่ยนเป็น /products และหน้านั้นแสดงหัวข้อของมัน
  // (ของเดิมจบตรงกดลิงก์ ผ่านทั้งที่พาไปผิดหน้า) toHaveURL รอเองเช่นกัน
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole("heading", { name: "สินค้าทั้งหมด", level: 1 })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 7: เขียนใหม่ข้อ 7 (URL เต็ม)
// แนวทาง: goto("/stores") ด้วย path สั้นๆ (ใช้ baseURL จาก config) ตรวจ heading ระดับ 1 "สาขาของเรา"
//        และตรวจว่าเห็นรายการ "สาขาสยาม"
// ------------------------------------------------
test("หน้าสาขาต้องมีหัวข้อและสาขาสยาม (เขียนใหม่)", async ({ page }) => {
  // path สั้นๆ ใช้ baseURL จาก config (playwright.shared.ts) ถ้าย้ายพอร์ตหรือรันบน CI แก้ที่เดียว
  await page.goto("/stores");
  await expect(page.getByRole("heading", { name: "สาขาของเรา", level: 1 })).toBeVisible();
  await expect(page.getByText("สาขาสยาม")).toBeVisible();
});
