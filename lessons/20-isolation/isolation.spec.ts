import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 20: แต่ละ test แยกจากกัน (isolation)
// ฝึก: browser context ต่อ test, cookie dn_sid, ตะกร้าไม่ปนกัน
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: สอง test เพิ่มของคนละชิ้น แต่ละ test เห็นตะกร้ามี 1 ชิ้นของตัวเอง
// สองตัวนี้รันพร้อมกันได้ (หลาย worker) และไม่รบกวนกัน เพราะต่างคนต่าง browser context
// ------------------------------------------------
test.describe("ตะกร้าของแต่ละ test แยกกัน", () => {
  test("ผู้ใช้ A: เพิ่มหูฟัง แล้วตะกร้ามี 1 ชิ้น", async ({ page }) => {
    await page.goto("/products");
    const card = page.getByRole("listitem").filter({ hasText: "หูฟังไร้สาย DN Buds" });
    await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
    await expect(page.getByRole("link", { name: "ตะกร้า (1)" })).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem")).toHaveCount(1);
    await expect(page.getByText("หูฟังไร้สาย DN Buds")).toBeVisible();
  });

  test("ผู้ใช้ B: เพิ่มเมาส์ แล้วตะกร้ามี 1 ชิ้น (ไม่เห็นหูฟังของผู้ใช้ A)", async ({ page }) => {
    await page.goto("/products");
    const card = page.getByRole("listitem").filter({ hasText: "เมาส์ไร้สาย" });
    await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
    await expect(page.getByRole("link", { name: "ตะกร้า (1)" })).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem")).toHaveCount(1);
    await expect(page.getByText("เมาส์ไร้สาย")).toBeVisible();
    await expect(page.getByText("หูฟังไร้สาย DN Buds")).toBeHidden();
  });
});


// ------------------------------------------------
// ตัวอย่างที่ 2: cookie dn_sid คือกลไกที่แอปใช้แยกข้อมูลของแต่ละ context
// ------------------------------------------------
test("เปิดหน้าแล้ว context ได้ cookie dn_sid และล้างแล้วตะกร้าเริ่มใหม่", async ({ page, context }) => {
  await page.goto("/products");
  // เป็น cookie แบบ httpOnly เลยอ่านจากหน้าเว็บไม่ได้ แต่อ่านจาก context ได้
  const sid = (await context.cookies()).find((c) => c.name === "dn_sid");
  expect(sid?.value).toBeTruthy();

  const card = page.getByRole("listitem").filter({ hasText: "หูฟังไร้สาย DN Buds" });
  await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(page.getByRole("link", { name: "ตะกร้า (1)" })).toBeVisible();

  // ลบ cookie = แอปมองว่าเป็นผู้ใช้ใหม่ ได้ session ใหม่และตะกร้าว่าง
  await context.clearCookies();
  await page.reload();
  await expect(page.getByRole("link", { name: "ตะกร้า (0)" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: เพิ่มเสื้อยืด DN สีขาว ใน test หนึ่ง และเพิ่มแก้วกาแฟเซรามิก ใน อีก test หนึ่ง แต่ละ test เห็นตะกร้า 1 ชิ้นของตัวเอง
// แนวทาง: เหมือนตัวอย่างที่ 1 สองตัวนี้ต้องเขียนเป็นสอง test แยกกัน (ไม่ใช่ test เดียว)
//        กดปุ่ม "เพิ่มลงตะกร้า" ในการ์ดที่ filter ด้วยชื่อสินค้า แล้วตรวจลิงก์ "ตะกร้า (1)"
// ------------------------------------------------
test.fixme("เสื้อยืด: ตะกร้ามี 1 ชิ้น", async ({ page }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});

test.fixme("แก้วกาแฟ: ตะกร้ามี 1 ชิ้น", async ({ page }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: เปิด context ใหม่เองสอง context ใน test เดียว ให้ dn_sid ต่างกัน
// แนวทาง: รับ { browser } แล้ว await browser.newContext() สองครั้ง (baseURL จาก config ใช้ได้เลย)
//        เปิด page ของแต่ละ context ด้วย context.newPage() แล้ว goto "/products"
//        อ่าน cookie จาก context.cookies() แล้ว expect ว่าค่า dn_sid ของสองฝั่งไม่เท่ากัน
//        อย่าลืม await context.close() ท้าย test เมื่อเปิดเอง
// ------------------------------------------------
test.fixme("สอง context ได้ dn_sid คนละค่า", async ({ browser }) => {
  // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: ในสอง context ของ test เดียว context แรกเพิ่มหูฟัง แต่ context ที่สองยังเห็นตะกร้า 0 ชิ้น
// แนวทาง: ต่อจากข้อ 2 ใน context แรกกด "เพิ่มลงตะกร้า" ที่หูฟัง ตรวจ "ตะกร้า (1)"
//        แล้ว page ของ context ที่สอง reload (หรือ goto "/products" ใหม่) ตรวจ "ตะกร้า (0)"
// ------------------------------------------------
test.fixme("context ที่สองไม่เห็นตะกร้าของ context แรก", async ({ browser }) => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
