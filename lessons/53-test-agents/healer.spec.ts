import { test, expect, type Page } from "@playwright/test";

// ================================================
// บทที่ 53: ฝึกแบบ healer: test ที่เคยผ่าน แต่หน้าเว็บเปลี่ยน
// ฝึก: อ่านข้อความผิดพลาด, ดูว่าหน้าตอนนี้เป็นอย่างไร (snapshot/trace), แก้ test ให้ตรงกับหน้าใหม่
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// เราไม่แก้โค้ดแอปจริง แต่ "จำลอง" ว่าทีมพัฒนาเปลี่ยนสินค้า p01 ด้วย page.route (บท 33, 34):
//   - ชื่อเปลี่ยนจาก "หูฟังไร้สาย DN Buds" เป็น "หูฟังไร้สาย DN Buds Pro"
//   - ราคาเปลี่ยนจาก 1,290 เป็น 1,490 บาท
// route.fetch() ขอข้อมูลจริงจาก server มาก่อน แล้วเราแก้ข้อมูลเฉพาะ p01 แล้วค่อยส่งให้หน้าเว็บ
// (ตั้ง route ก่อน goto เสมอ) ตัวช่วยนี้เขียนให้แล้ว ไม่ต้องแก้
async function mockRenamedHeadphones(page: Page) {
  await page.route("**/api/products*", async (route) => {
    const response = await route.fetch();
    const data = (await response.json()) as { products: { id: string; name: string; price: number }[] };
    for (const product of data.products) {
      if (product.id === "p01") {
        product.name = "หูฟังไร้สาย DN Buds Pro";
        product.price = 1490;
      }
    }
    await route.fulfill({ response, json: data });
  });
}


// ------------------------------------------------
// ตัวอย่างที่ 1: test ที่ "รักษาแล้ว" (healed) ตรงกับหน้าใหม่
// ก่อนหน้านี้ test นี้ตรวจชื่อ "หูฟังไร้สาย DN Buds" กับราคา "1,290 บาท" พอหน้าเปลี่ยนก็ล้ม
// healer จะดูหน้าปัจจุบันแล้วอัปเดตเฉพาะค่าที่เปลี่ยน ไม่เปลี่ยนความหมายของ test
// ------------------------------------------------
test("หน้า /products การ์ดหูฟังต้องแสดงชื่อและราคาใหม่", async ({ page }) => {
  await mockRenamedHeadphones(page);
  await page.goto("/products");

  // ใช้ exact: true เพราะชื่อเดิมเป็นส่วนหนึ่งของชื่อใหม่ ถ้าไม่ใส่ จะผ่านด้วยชื่อเก่าโดยไม่ได้ตรวจชื่อใหม่จริง
  await expect(page.getByRole("link", { name: "หูฟังไร้สาย DN Buds Pro", exact: true })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "หูฟังไร้สาย DN Buds Pro" })).toContainText("1,490 บาท");
});


// ------------------------------------------------
// วิธีทำข้อ 1 ถึง 3: เปลี่ยน test.fixme เป็น test, รันดู test ล้ม, อ่านข้อความผิดพลาดและดูหน้า
// (ในข้อความผิดพลาดมี path ของไฟล์ error-context.md ที่เก็บ snapshot ของหน้าตอนล้มไว้ หรือรันด้วย --ui ก็ดูหน้าได้) หาว่าหน้าตอนนี้เป็นอย่างไร
// แล้วแก้ "โค้ด test" ให้ตรงกับหน้าใหม่ (ห้ามแก้ mockRenamedHeadphones)
// ------------------------------------------------

// ------------------------------------------------
// ข้อ 1: test เดิมหาลิงก์ชื่อเก่าแบบตรงตัวเป๊ะ แต่ชื่อเปลี่ยนแล้ว
// แนวทาง: อ่าน error (Locator expected to be visible / element(s) not found) แล้วดู snapshot ว่าลิงก์ชื่ออะไรตอนนี้ แก้ชื่อใน locator
// ------------------------------------------------
test.fixme("ลิงก์สินค้าหูฟังบนหน้า /products ต้องแสดงอยู่", async ({ page }) => {
  await mockRenamedHeadphones(page);
  await page.goto("/products");

  // โค้ดนี้ล้ม: ชื่อเปลี่ยนไปแล้ว
  await expect(page.getByRole("link", { name: "หูฟังไร้สาย DN Buds", exact: true })).toBeVisible();
  // 👉 แก้บรรทัดด้านบน แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: test เดิมตรวจราคาเก่า
// แนวทาง: ดูข้อความที่หน้าแสดงจริงใน error (Expected / Received) แล้วแก้ค่าที่คาดหวัง
//        คิดด้วยว่า "ราคาเปลี่ยน" เป็นการเปลี่ยนที่ตั้งใจ (แก้ test) หรือเป็นบั๊ก (ควรปล่อยให้ล้มแล้วแจ้งทีม) ข้อนี้ถือว่าตั้งใจ
// ------------------------------------------------
test.fixme("การ์ดหูฟังต้องแสดงราคา", async ({ page }) => {
  await mockRenamedHeadphones(page);
  await page.goto("/products");

  const card = page.getByRole("listitem").filter({ hasText: "หูฟังไร้สาย DN Buds" });
  // โค้ดนี้ล้ม: ราคาเปลี่ยนแล้ว
  await expect(card).toContainText("1,290 บาท");
  // 👉 แก้บรรทัดด้านบน แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: test เดิมรอข้อความสถานะหลังกดเพิ่มลงตะกร้า แต่ข้อความมีชื่อสินค้า (ชื่อเปลี่ยนแล้ว)
// แนวทาง: ทำตามขั้นข้อ 1 ดูข้อความ status ที่หน้าแสดงจริง แล้วแก้ข้อความที่รอ
//        สังเกตว่า locator ของปุ่ม (getByRole + filter) ยังใช้ได้ แก้เฉพาะจุดที่ผิด (healer ที่ดีแก้น้อยที่สุด)
// ------------------------------------------------
test.fixme("กดเพิ่มหูฟังลงตะกร้าแล้วต้องเห็นข้อความสถานะ", async ({ page }) => {
  await mockRenamedHeadphones(page);
  await page.goto("/products");

  await page
    .getByRole("listitem")
    .filter({ hasText: "หูฟังไร้สาย DN Buds" })
    .getByRole("button", { name: "เพิ่มลงตะกร้า" })
    .click();

  // โค้ดนี้ล้ม: ข้อความมีชื่อสินค้าใหม่
  await expect(page.getByRole("status").filter({ hasText: 'เพิ่ม "หูฟังไร้สาย DN Buds" ลงตะกร้าแล้ว' })).toBeVisible();
  // 👉 แก้บรรทัดด้านบน แล้วเปลี่ยน test.fixme เป็น test
});
