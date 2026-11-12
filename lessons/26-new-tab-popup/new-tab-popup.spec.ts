import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 26: แท็บใหม่และหน้าต่างป๊อปอัป
// ฝึก: context.waitForEvent("page"), page.waitForEvent("popup"), ทำงานกับหลายหน้าพร้อมกัน
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: ลิงก์ที่เปิดแท็บใหม่ (target="_blank") ใช้ context.waitForEvent("page")
// ------------------------------------------------
test("หน้า new-tab: ลิงก์คู่มือเปิดแท็บใหม่ที่มีหัวข้อคู่มือการสั่งซื้อ", async ({ page, context }) => {
  await page.goto("/playground/new-tab");

  // สร้าง promise ที่รอ "หน้าใหม่" ก่อนกดลิงก์ (ห้ามใส่ await ตรงนี้ เพราะต้องกดลิงก์ก่อนจึงจะมีหน้าใหม่)
  // ถ้ากดก่อนค่อยสร้าง promise หน้าใหม่อาจเปิดไปแล้ว event หลุดมือ test ค้างจนหมดเวลา
  const pagePromise = context.waitForEvent("page");

  await page.getByRole("link", { name: "เปิดคู่มือการสั่งซื้อในแท็บใหม่" }).click();

  // ตอนนี้ค่อย await เพื่อรับหน้าใหม่ที่เปิดขึ้นมา
  const newPage = await pagePromise;

  // newPage ใช้ได้เหมือน page ปกติ (ตัวแปร page ยังชี้ที่แท็บเดิม)
  await expect(newPage).toHaveURL(/\/help\/ordering$/);
  await expect(newPage.getByRole("heading", { level: 1, name: "คู่มือการสั่งซื้อ" })).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: หน้าต่างแชทที่เปิดด้วย window.open ใช้ page.waitForEvent("popup") แล้วส่งข้อความ
// ------------------------------------------------
test("หน้า new-tab: เปิดหน้าต่างแชทแล้วส่งข้อความ", async ({ page }) => {
  await page.goto("/playground/new-tab");

  // popup = หน้าที่ถูกเปิดโดยหน้านี้ (window.open หรือ target=_blank) ตั้งรอก่อนกดเหมือนกัน
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "เปิดหน้าต่างแชท" }).click();
  const chat = await popupPromise;

  // event popup มาตั้งแต่ "เริ่ม" โหลดหน้าใหม่ ถ้ากด "ส่ง" ก่อน React hydrate ปุ่มจะ submit แบบ native
  // ซึ่งโหลดหน้าใหม่และล้างข้อความที่พิมพ์ไว้ รอ load ช่วย "ลดความเสี่ยง" (ไม่ได้การันตีว่า hydrate เสร็จ ดู README หัวข้อ 3)
  await chat.waitForLoadState("load");
  await expect(chat.getByRole("heading", { level: 1, name: "แชทกับร้าน" })).toBeVisible();

  // บนหน้านี้ aria-label "ข้อความแชท" มีคำว่า "ข้อความ" อยู่ด้วย จึงต้องใส่ exact: true ให้ตรงทั้งคำ
  await chat.getByLabel("ข้อความ", { exact: true }).fill("สวัสดีครับ");
  await chat.getByRole("button", { name: "ส่ง", exact: true }).click();

  await expect(chat.getByRole("list", { name: "ข้อความแชท" }).getByRole("listitem")).toHaveText("สวัสดีครับ");
});


// ------------------------------------------------
// ข้อ 1: เหมือนตัวอย่างที่ 1 แต่ตรวจเพิ่มว่าแท็บเดิมยังอยู่ที่ /playground/new-tab
// แนวทาง: ใช้ context.waitForEvent("page") สร้าง promise ก่อนกดลิงก์ ตรวจหัวข้อในหน้าใหม่ด้วย newPage
//        แล้วตรวจแท็บเดิม expect(page).toHaveURL(/\/playground\/new-tab$/)
// ------------------------------------------------
test.fixme("หน้า new-tab: แท็บเดิมยังอยู่ที่เดิมหลังเปิดคู่มือ", async ({ page, context }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: ลิงก์ target="_blank" ก็รับด้วย page.waitForEvent("popup") ได้ ลองใช้แทน context.waitForEvent("page")
// แนวทาง: const popupPromise = page.waitForEvent("popup") ก่อนกดลิงก์ "เปิดคู่มือการสั่งซื้อในแท็บใหม่"
//        แล้วตรวจ URL และหัวข้อ "คู่มือการสั่งซื้อ" ของหน้าที่ได้
// ------------------------------------------------
test.fixme("หน้า new-tab: รับแท็บคู่มือด้วย popup", async ({ page }) => {
  // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: เปิดหน้าต่างแชทแล้วส่งข้อความ "ขอสอบถามสินค้าหน่อยครับ"
// แนวทาง: เหมือนตัวอย่างที่ 2 เปลี่ยนข้อความ ตรวจว่ารายการข้อความแชทมีข้อความนั้น (toHaveText)
//        อย่าลืม chat.waitForLoadState("load") หลังได้หน้าต่างแชท และ getByLabel("ข้อความ", { exact: true })
// ------------------------------------------------
test.fixme("หน้า new-tab: ส่งข้อความในแชทอีกข้อความหนึ่ง", async ({ page }) => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 4: ส่งข้อความในแชท 2 ข้อความ แล้วตรวจว่ามี 2 รายการตามลำดับ
// แนวทาง: รอ chat.waitForLoadState("load") แล้ว fill + กด "ส่ง" สองรอบในหน้าต่างแชท
//        expect(รายการข้อความ).toHaveText(["ข้อความแรก", "ข้อความที่สอง"]) (ส่ง array ได้ ตรวจครบทุกรายการตามลำดับ)
// ------------------------------------------------
test.fixme("หน้า new-tab: ส่งสองข้อความในแชท", async ({ page }) => {
  // 👉 เขียน test ของข้อ 4 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 5: ปิดหน้าต่างแชทแล้วกลับมาใช้แท็บเดิมต่อ
// แนวทาง: หลังเปิดแชท (เหมือนตัวอย่างที่ 2) เรียก await chat.close() แล้วตรวจที่ page เดิมว่า
//        หัวข้อระดับ 1 "New tab" ยังมองเห็น และ chat.isClosed() เป็น true (ใช้ expect(chat.isClosed()).toBe(true))
// ------------------------------------------------
test.fixme("หน้า new-tab: ปิดแชทแล้วกลับมาแท็บเดิม", async ({ page }) => {
  // 👉 เขียน test ของข้อ 5 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
