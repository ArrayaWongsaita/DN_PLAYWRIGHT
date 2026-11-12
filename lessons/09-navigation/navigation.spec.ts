import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 09: เปลี่ยนหน้า ย้อนกลับ และ reload
// ฝึก: toHaveURL (string และ regex), goBack, goForward, reload
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: คลิกเมนู "สินค้า" แล้ว URL ต้องเป็น /products (toHaveURL แบบ string)
// ------------------------------------------------
test("หน้าแรก คลิกเมนูสินค้าแล้ว URL ต้องเป็น /products", async ({ page }) => {
  await page.goto("/");
  // เมนูหลักอยู่ใน <nav aria-label="เมนูหลัก"> ใช้ getByRole("navigation") ระบุก่อนค่อยหาลิงก์ข้างใน
  await page.getByRole("navigation", { name: "เมนูหลัก" }).getByRole("link", { name: "สินค้า" }).click();
  // toHaveURL รอจน URL ตรง (การเปลี่ยนหน้าไม่ได้เกิดทันที) string แบบสั้นจะต่อกับ baseURL ให้
  await expect(page).toHaveURL("/products");
});


// ------------------------------------------------
// ตัวอย่างที่ 2: คลิกการ์ดสินค้าแล้ว URL ต้องมี id ของสินค้า (toHaveURL แบบ regex) และ goBack
// ------------------------------------------------
test("หน้าแรก คลิกการ์ดสินค้า p01 แล้วย้อนกลับได้", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "หูฟังไร้สาย DN Buds" }).click();
  // regex ใช้เมื่อ URL มีส่วนที่ไม่ตายตัว หรือแค่ต้องการตรวจบางส่วน (/ ใน regex ต้องใส่ \ นำหน้า)
  await expect(page).toHaveURL(/\/products\/p01$/);
  await expect(page.getByRole("heading", { name: "หูฟังไร้สาย DN Buds" })).toBeVisible();

  // goBack = กดปุ่มย้อนกลับของ browser
  await page.goBack();
  await expect(page).toHaveURL("/");
});


// ------------------------------------------------
// ข้อ 1: จากหน้าแรกคลิกเมนู "ตะกร้า" แล้ว URL ต้องเป็น /cart และเห็น heading "ตะกร้าสินค้า"
// แนวทาง: เหมือนตัวอย่างที่ 1 ชื่อลิงก์ในเมนูคือ "ตะกร้า" แต่มีตัวเลขต่อท้าย ("ตะกร้า (0)")
//        getByRole แบบ name เป็นสตริงจับคู่แบบ "มีคำนี้" อยู่แล้ว จึงใช้ { name: "ตะกร้า" } ได้
// ------------------------------------------------
test("หน้าแรก คลิกเมนูตะกร้าแล้ว URL ต้องเป็น /cart", async ({ page }) => {
  await page.goto("/");
  // name เป็นสตริง: จับคู่แบบ "มีคำนี้" จึงจับ "ตะกร้า (0)" ได้ แม้จำนวนในวงเล็บเปลี่ยน
  await page.getByRole("navigation", { name: "เมนูหลัก" }).getByRole("link", { name: "ตะกร้า" }).click();
  await expect(page).toHaveURL("/cart");
  await expect(page.getByRole("heading", { name: "ตะกร้าสินค้า" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: จากหน้า /products คลิกชื่อสินค้า "คีย์บอร์ดเครื่องกล" แล้ว URL ต้องตรงกับ regex /products/p02
//        จากนั้นคลิกลิงก์ "← กลับไปหน้าสินค้า" แล้ว URL ต้องกลับเป็น /products
// แนวทาง: ใช้ toHaveURL(/\/products\/p02$/) ตามตัวอย่างที่ 2 แต่กลับด้วยการคลิกลิงก์ในหน้า (ไม่ใช่ goBack)
// ------------------------------------------------
test("หน้า /products คลิกคีย์บอร์ดแล้วกลับด้วยลิงก์ในหน้า", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("link", { name: "คีย์บอร์ดเครื่องกล" }).click();
  // ทำไมใช้ regex: เน้นตรวจว่าเป็นหน้าของ p02 โดยไม่ผูกกับโดเมน
  await expect(page).toHaveURL(/\/products\/p02$/);

  await page.getByRole("link", { name: "← กลับไปหน้าสินค้า" }).click();
  await expect(page).toHaveURL("/products");
});


// ------------------------------------------------
// ข้อ 3: เปิดหน้าแรก → คลิกเมนู "สินค้า" → goBack แล้วอยู่หน้าแรก → goForward แล้วอยู่หน้า /products อีกครั้ง
// แนวทาง: goBack ย้อนกลับ goForward ไปข้างหน้า ตรวจ toHaveURL หลังทุกครั้งที่เปลี่ยนหน้า
// ------------------------------------------------
test("ย้อนกลับและไปข้างหน้าด้วย goBack และ goForward", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "เมนูหลัก" }).getByRole("link", { name: "สินค้า" }).click();
  await expect(page).toHaveURL("/products");

  await page.goBack();
  await expect(page).toHaveURL("/");

  // goForward ใช้ได้เพราะเพิ่งย้อนกลับ (ถ้าไม่ได้ย้อน จะไม่มีหน้าถัดไปให้ไป)
  await page.goForward();
  await expect(page).toHaveURL("/products");
});


// ------------------------------------------------
// ข้อ 4: กด "เพิ่มลงตะกร้า" สินค้าบนหน้า /products แล้วไปหน้า /cart จากนั้น reload ของในตะกร้าต้องยังอยู่
// แนวทาง: ตะกร้าเก็บอยู่กับ session ฝั่งเซิร์ฟเวอร์ (cookie) จึงไม่หายหลัง reload
//        ตรวจรายการด้วย getByRole("list", { name: "สินค้าในตะกร้า" }) ก่อนและหลัง await page.reload()
//        ปุ่ม "เพิ่มลงตะกร้า" ปุ่มแรกใช้ .first()
// ------------------------------------------------
test("หน้า /cart โหลดใหม่แล้วของในตะกร้ายังอยู่", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "ลงตะกร้าแล้ว" })).toBeVisible();

  await page.goto("/cart");
  const cartItems = page.getByRole("list", { name: "สินค้าในตะกร้า" });
  await expect(cartItems).toBeVisible();

  await page.reload();
  // ทำไมของยังอยู่: ตะกร้าเก็บฝั่งเซิร์ฟเวอร์ผูกกับ cookie ของ session ไม่ได้อยู่แค่ในหน้า
  await expect(cartItems).toBeVisible();
  await expect(page.getByRole("link", { name: "ตะกร้า (1)" })).toBeVisible();
});
