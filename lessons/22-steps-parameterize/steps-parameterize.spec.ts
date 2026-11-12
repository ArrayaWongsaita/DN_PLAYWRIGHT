import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 22: test.step และสร้าง test จากข้อมูลหลายชุด
// ฝึก: test.step (ซ้อนกันได้), วน for...of สร้าง test จาก array ของ cases
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: test.step แบ่งขั้นตอนของ flow ยาวๆ (ซ้อน step ได้)
// ------------------------------------------------
test("ซื้อเสื้อยืดแล้วใช้โค้ด DN10 ได้ราคา 261 บาท", async ({ page }) => {
  // step รับ "ชื่อ" กับฟังก์ชัน ชื่อไปปรากฏใน report และ trace ทำให้อ่านได้ว่าพังที่ขั้นตอนไหน
  await test.step("เพิ่มเสื้อยืดลงตะกร้า", async () => {
    await page.goto("/products/p04");
    await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
    await expect(page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" })).toBeVisible();
  });

  await test.step("ใช้โค้ดส่วนลด", async () => {
    await page.goto("/cart");
    // step ซ้อนใน step ได้ จะแสดงเป็นลำดับชั้นใน report

    // eslint-disable-next-line playwright/no-nested-step -- บทนี้สอนซ้อน step โดยตั้งใจ
    await test.step("กรอกโค้ด DN10", async () => {
      await page.getByLabel("โค้ดส่วนลด").fill("DN10");
      await page.getByRole("button", { name: "ใช้โค้ด" }).click();
    });

    // eslint-disable-next-line playwright/no-nested-step -- บทนี้สอนซ้อน step โดยตั้งใจ
    await test.step("ตรวจข้อความสำเร็จ", async () => {
      await expect(page.getByRole("status").filter({ hasText: "ใช้โค้ด DN10 แล้ว ลด 10%" })).toBeVisible();
    });
  });

  await test.step("ตรวจยอดรวม", async () => {
    await expect(page.getByTestId("subtotal")).toHaveText("290 บาท");
    await expect(page.getByTestId("discount")).toHaveText("29 บาท");
    await expect(page.getByTestId("total")).toHaveText("261 บาท");
  });
});


// ------------------------------------------------
// ตัวอย่างที่ 2: วน for...of สร้าง test จากคำค้นหลายชุด (ชื่อ test ต้องไม่ซ้ำกัน)
// ------------------------------------------------
const searchCases = [
  { q: "หนังสือ", expected: 2 },
  { q: "DN", expected: 2 },
  { q: "ไม่มีสินค้านี้", expected: 0 },
];

for (const { q, expected } of searchCases) {
  // ชื่อ test ใส่ค่าจากข้อมูล จะได้เป็น 3 test ที่ชื่อต่างกันและเห็นใน report แยกกัน
  test(`ค้นหา "${q}" ได้ ${expected} รายการ`, async ({ page }) => {
    await page.goto("/products");
    // รอให้รายการเริ่มต้นโหลดครบก่อน เพื่อไม่ให้ไปอ่านจำนวนของรอบก่อนหน้าโหลดค้าง
    await expect(page.getByText("พบสินค้า 10 รายการ")).toBeVisible();

    await page.getByLabel("ค้นหาสินค้า").fill(q);
    await page.getByLabel("ค้นหาสินค้า").press("Enter");
    await expect(page.getByText(`พบสินค้า ${expected} รายการ`)).toBeVisible();
  });
}


// ------------------------------------------------
// ข้อ 1: เข้าสู่ระบบด้วย user@dnshop.test / password123 แล้วแบ่งเป็น step "เข้าสู่ระบบ" และ "ตรวจหน้าบัญชี" โดยใน step แรกมี step ย่อยกรอกข้อมูลกับกดปุ่ม
// แนวทาง: เหมือนตัวอย่างที่ 1 step "เข้าสู่ระบบ" มี step ย่อย "กรอกอีเมลและรหัสผ่าน" (getByLabel("อีเมล"), getByLabel("รหัสผ่าน"))
//        และ "กดปุ่มเข้าสู่ระบบ" ส่วน step ที่สองตรวจ heading ระดับ 1 "บัญชีของฉัน" และข้อความ "ชื่อ: สมชาย ใจดี"
// ------------------------------------------------
test.fixme("login แล้วเห็นหน้าบัญชี (แบ่งเป็น step)", async ({ page }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: สร้าง test จากหมวดสินค้า 4 หมวด: อุปกรณ์ไอที 3, เสื้อผ้า 2, ของใช้ในบ้าน 2, หนังสือ 3
// แนวทาง: ทำ array categoryCases เป็น { category, expected } แล้ววน for...of สร้าง test (ตั้งชื่อ test ใส่ชื่อหมวด)
//        ในแต่ละ test goto("/products") รอ "พบสินค้า 10 รายการ" แล้ว selectOption(category) และตรวจ "พบสินค้า N รายการ"
//        เขียน array กับลูปไว้ใต้บรรทัดนี้ ไม่ต้องอยู่ใน test.fixme (ลบ test.fixme ด้านล่างทิ้งเมื่อทำเสร็จ)
// ------------------------------------------------
test.fixme("กรองหมวดหมู่ (สร้างจาก cases)", async ({ page }) => {
  // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: สร้าง test จากสินค้า 3 ชิ้น พร้อม test.step ข้างใน ตรวจหน้ารายละเอียดของ p01, p02, p03
// แนวทาง: cases เป็น { id: "p01", name: "หูฟังไร้สาย DN Buds", price: "1,290 บาท" }, { id: "p02", name: "คีย์บอร์ดเครื่องกล", price: "2,490 บาท" },
//        { id: "p03", name: "เมาส์ไร้สาย", price: "590 บาท" } วนสร้าง test แต่ละอันมี step "เปิดหน้า", step "ตรวจชื่อ" (heading ระดับ 1),
//        step "ตรวจราคา" (getByText)
// ------------------------------------------------
test.fixme("หน้ารายละเอียดสินค้า (cases + step)", async ({ page }) => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
