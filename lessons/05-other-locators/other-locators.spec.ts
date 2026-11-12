import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 05: locator แบบอื่นนอกจาก getByRole
// ฝึก: getByText, getByLabel, getByPlaceholder, getByAltText, getByTitle, getByTestId, toHaveText, toContainText
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
//
// ลำดับที่ควรลองใช้ (บนลงล่าง): getByRole > getByLabel > getByPlaceholder > getByText
//                              > getByAltText / getByTitle > getByTestId (ทางสุดท้าย)
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: รูปสินค้าบนหน้ารายละเอียดต้องแสดงอยู่ (getByAltText)
// ------------------------------------------------
test("หน้าสินค้า p01 ต้องมีรูปของหูฟังไร้สาย DN Buds", async ({ page }) => {
  await page.goto("/products/p01");
  // getByAltText หา <img> จากข้อความ alt ของรูป
  await expect(page.getByAltText("หูฟังไร้สาย DN Buds")).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: จำนวนที่เหลือในคลังต้องเป็น "คงเหลือ 15 ชิ้น" (getByTitle + toHaveText)
// ------------------------------------------------
test("หน้าสินค้า p01 ต้องแสดงคงเหลือ 15 ชิ้น", async ({ page }) => {
  await page.goto("/products/p01");
  // getByTitle หา element จาก attribute title (เมาส์ชี้แล้วเห็นเป็น tooltip ของ browser)
  // toHaveText ตรวจว่าข้อความ "ตรงทั้งหมด" (ช่องว่างหน้าหลังไม่นับ)
  await expect(page.getByTitle("จำนวนที่เหลือในคลัง")).toHaveText("คงเหลือ 15 ชิ้น");
});


// ------------------------------------------------
// ข้อ 1: หน้าสินค้า p01 ต้องแสดงราคา "1,290 บาท"
// แนวทาง: ใช้ getByText("1,290 บาท") แล้ว toBeVisible
//        getByText หา element จากข้อความที่ผู้ใช้เห็น ใช้เมื่อไม่มี role หรือ label ที่เหมาะ
// ------------------------------------------------
test("หน้าสินค้า p01 ต้องแสดงราคา 1,290 บาท", async ({ page }) => {
  await page.goto("/products/p01");
  // ราคาเป็นแค่ข้อความใน <p> ไม่มี role/label ที่เหมาะ จึงใช้ getByText ได้
  await expect(page.getByText("1,290 บาท")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: หน้า /login ต้องมีช่อง "อีเมล" และ "รหัสผ่าน"
// แนวทาง: ช่องกรอกที่มี <label> ควรหาด้วย getByLabel("อีเมล") และ getByLabel("รหัสผ่าน")
//        เขียน expect สองบรรทัดด้วย toBeVisible
// ------------------------------------------------
test("หน้า /login ต้องมีช่อง อีเมล และ รหัสผ่าน", async ({ page }) => {
  await page.goto("/login");
  // ช่องกรอกที่มี <label> ควรหาด้วย getByLabel เพราะตรงกับที่ผู้ใช้เห็นข้างช่อง
  await expect(page.getByLabel("อีเมล")).toBeVisible();
  await expect(page.getByLabel("รหัสผ่าน")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 3: หน้า /products ต้องมีช่องค้นหาที่มี placeholder "พิมพ์ชื่อสินค้า แล้วกด Enter"
// แนวทาง: ใช้ getByPlaceholder("พิมพ์ชื่อสินค้า แล้วกด Enter") แล้ว toBeVisible
//        placeholder คือข้อความจางๆ ที่ขึ้นในช่องตอนยังไม่ได้พิมพ์
// ------------------------------------------------
test("หน้า /products ต้องมีช่องค้นหาที่มี placeholder", async ({ page }) => {
  await page.goto("/products");
  // ช่องค้นหามี label ด้วย (หาด้วย getByLabel ได้) แต่ข้อนี้ฝึก placeholder
  // ใช้ getByPlaceholder เมื่อช่องนั้นมีแต่ placeholder ไม่มี label
  await expect(page.getByPlaceholder("พิมพ์ชื่อสินค้า แล้วกด Enter")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: หน้าสินค้า p04 (เสื้อยืด DN สีขาว) ต้องมีรูป และแสดงคงเหลือ 30 ชิ้น
// แนวทาง: เหมือนตัวอย่างที่ 1 และ 2 รวมกัน เปลี่ยนเป็น /products/p04 และชื่อรูป "เสื้อยืด DN สีขาว"
//        ลองใช้ toContainText("30") แทน toHaveText ดู: toContainText ตรวจแค่ว่า "มีข้อความนี้อยู่ในนั้น"
// ------------------------------------------------
test("หน้าสินค้า p04 ต้องมีรูปและแสดงคงเหลือ 30 ชิ้น", async ({ page }) => {
  await page.goto("/products/p04");
  await expect(page.getByAltText("เสื้อยืด DN สีขาว")).toBeVisible();
  // toContainText ตรวจแค่ว่ามี "30" อยู่ในข้อความ ไม่ต้องเขียนทั้งประโยค
  // (ถ้าอยากเข้มงวดให้ใช้ toHaveText("คงเหลือ 30 ชิ้น") แทน)
  await expect(page.getByTitle("จำนวนที่เหลือในคลัง")).toContainText("30");
});


// ------------------------------------------------
// ข้อ 5: หน้าแรกต้องแสดงจำนวนสินค้าในตะกร้าเป็น "0" (getByTestId)
// แนวทาง: ตัวเลขในลิงก์ "ตะกร้า (0)" ไม่มี role/label/ข้อความของตัวเอง
//        แอปจึงใส่ data-testid="cart-count" ไว้ให้ ใช้ getByTestId("cart-count") แล้ว toHaveText("0")
//        อ่านใน README ว่าเมื่อไหร่ควรใช้ test id
// ------------------------------------------------
test("หน้าแรกต้องแสดงจำนวนในตะกร้าเป็น 0", async ({ page }) => {
  await page.goto("/");
  // ตัวเลขในลิงก์ "ตะกร้า (0)" ไม่มี role/label ของตัวเอง จึงใช้ test id ที่แอปใส่ไว้ให้
  // ตะกร้าเริ่มว่างเสมอเพราะแต่ละ test ได้ browser context ใหม่ (บท 20 จะอธิบาย)
  await expect(page.getByTestId("cart-count")).toHaveText("0");
});
