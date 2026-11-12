import { test, expect, ADMIN } from "./fixtures";

// ================================================
// บทที่ 39: custom fixture ด้วย test.extend
// ฝึก: สร้าง fixture ที่ setup/teardown ให้, fixture ที่พึ่งพา fixture อื่น, option fixture, auto fixture
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// แนวคิด: fixture คือ "ของที่ test ขอใน argument แล้ว Playwright จัดเตรียมให้" เหมือน page หรือ request
// เราสร้างของเราเองได้ด้วย test.extend (ดูไฟล์ fixtures.ts) แทนการเขียน beforeEach ซ้ำในทุกไฟล์
// ข้อดีเมื่อเทียบกับ beforeEach/afterEach (บท 19): setup และ teardown อยู่ที่เดียวกัน, ใช้เฉพาะ test ที่ขอ,
// และ fixture ต่อกันเป็นลูกโซ่ได้
// สังเกต: import test กับ expect จาก "./fixtures" ไม่ใช่ "@playwright/test"
// ลองรันบทนี้แล้วดูบรรทัด [loggedInPage], [cartWithItem], [auto] ที่พิมพ์ใน terminal เพื่อดูลำดับการทำงาน


// ------------------------------------------------
// ตัวอย่างที่ 1: ใช้ fixture loggedInPage (login แล้วก่อน test เริ่ม)
// ------------------------------------------------
test("loggedInPage เปิดหน้าบัญชีของฉันได้ทันที", async ({ loggedInPage }) => {
  // loggedInPage คือ page ตัวเดียวกับที่ fixture login ผ่าน API ไว้แล้ว จึงไม่ต้องกรอกฟอร์ม login
  await loggedInPage.goto("/account");
  await expect(loggedInPage.getByRole("heading", { name: "บัญชีของฉัน" })).toBeVisible();
  await expect(loggedInPage.getByText("อีเมล: user@dnshop.test")).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: ใช้ fixture cartWithItem (ซึ่งขอ loggedInPage ต่ออีกชั้น)
// ------------------------------------------------
test("cartWithItem มีหูฟังอยู่ในตะกร้าแล้ว", async ({ cartWithItem }) => {
  await cartWithItem.goto("/cart");
  const items = cartWithItem.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem");
  await expect(items).toHaveCount(1);
  await expect(items).toContainText("หูฟังไร้สาย DN Buds");
  await expect(cartWithItem.getByTestId("subtotal")).toHaveText("1,290 บาท");
});


// ------------------------------------------------
// ข้อ 1: ใช้ loggedInPage ตรวจเมนูของคนที่ login แล้ว
// แนวทาง: เหมือนตัวอย่างที่ 1 แต่เปิดหน้าแรก "/" ตรวจว่าใน nav "เมนูหลัก" มีลิงก์ "บัญชีของฉัน"
//        และมีปุ่ม "ออกจากระบบ" แต่ไม่มีลิงก์ "เข้าสู่ระบบ"
// ------------------------------------------------
test("loggedInPage เห็นเมนูของคนที่ login แล้ว", async ({ loggedInPage }) => {
  // goto หลังจากที่ fixture login เสร็จแล้ว เพราะ fixture ทำงานเสร็จก่อนเนื้อ test เริ่ม จึงไม่มีทางเห็นหน้าก่อน login
  await loggedInPage.goto("/");
  const nav = loggedInPage.getByRole("navigation", { name: "เมนูหลัก" });
  await expect(nav.getByRole("link", { name: "บัญชีของฉัน" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "ออกจากระบบ" })).toBeVisible();
  // ตรวจว่า "ไม่มี" ลิงก์เข้าสู่ระบบ ด้วย toHaveCount(0) ซึ่งรอ (retry) จนจำนวนเป็น 0
  await expect(nav.getByRole("link", { name: "เข้าสู่ระบบ" })).toHaveCount(0);
});


// ------------------------------------------------
// ข้อ 2: ใช้ cartWithItem แล้วไปหน้าชำระเงิน
// แนวทาง: เปิด /cart กดปุ่ม "ไปชำระเงิน" ตรวจว่า URL เป็น /checkout และ heading "ชำระเงิน" ขึ้น
//        ช่อง "ชื่อ-นามสกุล" ถูกเติมด้วย "สมชาย ใจดี" เพราะ fixture login ไว้แล้ว (toHaveValue)
// ------------------------------------------------
test("cartWithItem ไปหน้าชำระเงินแล้วชื่อถูกเติมให้", async ({ cartWithItem }) => {
  await cartWithItem.goto("/cart");
  await cartWithItem.getByRole("button", { name: "ไปชำระเงิน" }).click();

  await expect(cartWithItem).toHaveURL("/checkout");
  await expect(cartWithItem.getByRole("heading", { name: "ชำระเงิน" })).toBeVisible();
  // หน้าเติมชื่อให้เพราะ fixture login ไว้แล้ว (ถ้าไม่ login ช่องนี้จะว่าง) นี่คือประโยชน์ของ fixture ที่ต่อกัน
  await expect(cartWithItem.getByLabel("ชื่อ-นามสกุล")).toHaveValue("สมชาย ใจดี");
});


// ------------------------------------------------
// ข้อ 3: เขียน fixture adminPage เอง
// แนวทาง: เปิด fixtures.ts หา adminPage แล้วแทนที่ throw ด้วยโค้ดแบบ loggedInPage:
//        page.request.post("/api/auth/login", { data: ADMIN }) ตรวจ res.ok() แล้ว await use(page)
//        (ADMIN เตรียมไว้ใน fixtures.ts แล้ว และ import มาในไฟล์นี้แล้ว)
//        ใน test: เปิด /admin/products ตรวจ heading "เพิ่มสินค้าใหม่" (ระดับ 2) และตาราง "ตารางสินค้า" ขึ้น
// ------------------------------------------------
test("adminPage เข้าหน้าจัดการสินค้าได้", async ({ adminPage }) => {
  await adminPage.goto("/admin/products");
  // ถ้า login เป็น user ธรรมดา หน้านี้จะแสดง "คุณไม่มีสิทธิ์เข้าหน้านี้" แทน การเห็นตารางจึงพิสูจน์ว่า fixture login เป็น admin จริง
  await expect(adminPage.getByRole("table", { name: "ตารางสินค้า" })).toBeVisible();
  await expect(adminPage.getByRole("heading", { name: "เพิ่มสินค้าใหม่", level: 2 })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: เปลี่ยนค่า option fixture ด้วย test.use
// แนวทาง: ใช้ test.describe ครอบ แล้วเรียก test.use({ account: ADMIN }) ในนั้น (ADMIN ถูก import ไว้แล้ว)
//        ใน test ใช้ loggedInPage เปิด /account ตรวจ "สิทธิ์: ผู้ดูแลระบบ" (fixture เดิมแต่ login เป็น admin)
// ------------------------------------------------
test.describe("account เป็น admin", () => {
  // test.use ในนี้เปลี่ยนค่า option fixture account เฉพาะ test ที่อยู่ใน describe นี้
  // (test อื่นนอก describe ยังได้ USER ตามค่าเริ่มต้น ลองดูตัวอย่างที่ 1)
  test.use({ account: ADMIN });

  test("loggedInPage login เป็น admin ตาม option", async ({ loggedInPage }) => {
    await loggedInPage.goto("/account");
    await expect(loggedInPage.getByText("สิทธิ์: ผู้ดูแลระบบ")).toBeVisible();
    await expect(loggedInPage.getByText("อีเมล: admin@dnshop.test")).toBeVisible();
  });
});
