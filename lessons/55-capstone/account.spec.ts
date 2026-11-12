import { test, expect } from "./fixtures";

// ================================================
// บทที่ 55: โปรเจกต์ปิดท้าย (ส่วนที่ 2) ประวัติคำสั่งซื้อในหน้า /account (เฉลย)
// ฝึก: Page Object ของหน้าบัญชี, เตรียมคำสั่งซื้อผ่าน API
// ================================================

// แต่ละ test ได้ตะกร้าและประวัติคำสั่งซื้อของตัวเอง (ลบ cookie dn_sid ไว้ใน auth.setup.ts) จึงเริ่มจากว่างเสมอ
// และคำสั่งซื้อแรกของแต่ละ test ได้หมายเลข DN-0001


// ------------------------------------------------
// ข้อ 8: ผู้ใช้ที่ยังไม่เคยสั่งซื้อ
// ------------------------------------------------
test("บัญชีที่ยังไม่เคยสั่งซื้อไม่มีประวัติ", async ({ page, accountPage }) => {
  await accountPage.goto();

  await expect(accountPage.historyHeading).toBeVisible();
  await expect(accountPage.emptyHistory).toBeVisible();
  // ชื่อบัญชีที่ login ไว้ใน auth.setup.ts: ยืนยันว่า test นี้อยู่ในสถานะ login จริง ไม่ได้ผ่านเพราะถูกส่งไปหน้าอื่น
  await expect(page.getByText("ชื่อ: สมชาย ใจดี")).toBeVisible();
  // ไม่มีรายการประวัติสักรายการ
  await expect(accountPage.historyItems).toHaveCount(0);
});


// ------------------------------------------------
// ข้อ 9: คำสั่งซื้อที่สั่งแล้วขึ้นในประวัติ
// ------------------------------------------------
test("คำสั่งซื้อที่สั่งแล้วขึ้นในประวัติของบัญชี", async ({ page, shop, accountPage }) => {
  // เตรียมด้วย API ทั้งหมด: หน้าที่ทดสอบคือหน้า /account ไม่ใช่ขั้นตอนสั่งซื้อ
  await shop.addToCart("p06");
  const orderId = await shop.placeOrder();
  expect(orderId).toBe("DN-0001");

  await accountPage.goto();
  // 190 + ค่าส่งธรรมดา 50 = 240 (หน้าบัญชีแสดงยอดรวมค่าส่งแล้ว)
  await expect(accountPage.historyItems).toHaveCount(1);
  await expect(accountPage.historyItem("DN-0001")).toContainText("240 บาท");

  // ลิงก์ในรายการพาไปหน้าคำสั่งซื้อนั้น
  await accountPage.historyItem("DN-0001").getByRole("link", { name: "DN-0001" }).click();
  await expect(page).toHaveURL("/orders/DN-0001");
});
