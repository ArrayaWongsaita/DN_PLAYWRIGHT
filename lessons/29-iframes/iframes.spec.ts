import { test, expect, type Page } from "@playwright/test";

// ================================================
// บทที่ 29: iframe (หน้าเว็บซ้อนอยู่ในหน้าเว็บ)
// ฝึก: frameLocator, getByTitle(...).contentFrame(), ทำงานกับฟอร์มบัตรใน /checkout
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

const VALID_CARD = "4242 4242 4242 4242";

// เตรียมของในตะกร้าด้วยการกดบนหน้าสินค้า (การเตรียมข้อมูลผ่าน API จะสอนในบท 37)
// ฟังก์ชันนี้ใช้ในข้อที่ต้องเข้า /checkout เพราะถ้าตะกร้าว่าง หน้า checkout จะเด้งไป /cart
async function addFirstProductToCart(page: Page) {
  await page.goto("/products");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
  // ตัวเลขข้างลิงก์ "ตะกร้า" กลายเป็น 1 แปลว่าเพิ่มสำเร็จแล้ว (expect รอให้เอง)
  await expect(page.getByTestId("cart-count")).toHaveText("1");
}


// เปิด /checkout พร้อมของในตะกร้า แล้วรอให้หน้าหลักแสดงยอดที่ต้องชำระก่อนไปยุ่งกับ iframe
// หน้า checkout และฟอร์มบัตรเป็นหน้าที่ต้อง hydrate ก่อนถึงจะตอบสนอง (README หัวข้อ 7) ยอดที่ต้องชำระเป็นแค่เนื้อหาที่ขึ้นแล้ว
// ช่วยลดความเสี่ยง ไม่การันตี
async function openCheckout(page: Page) {
  await addFirstProductToCart(page);
  await page.goto("/checkout");
  await expect(page.getByTestId("order-total")).toBeVisible();
}


// ------------------------------------------------
// ตัวอย่างที่ 1: กล่องแชทช่วยเหลือใน iframe ใช้ page.frameLocator(...)
// ------------------------------------------------
test("หน้า iframe: กดเริ่มแชทในกล่องแชทช่วยเหลือ", async ({ page }) => {
  await page.goto("/playground/iframe");

  // frameLocator บอกว่า "ต่อจากนี้ให้หาของข้างใน iframe ตัวนี้" ตัว iframe เองต้องระบุด้วย selector (CSS ที่เรียนในบท 18) ว่า iframe ที่มี title ตรงกัน
  // ข้างในใช้ getByRole ได้ตามปกติ (เหมือน page) แต่ page.getByRole จะมองไม่เห็นของข้างใน iframe
  const chat = page.frameLocator('iframe[title="กล่องแชทช่วยเหลือ"]');

  // รอให้เนื้อหาใน iframe ขึ้นก่อนกดปุ่ม เพื่อลดความเสี่ยงที่จะกดก่อนหน้า iframe hydrate (ไม่การันตี ดู README หัวข้อ 7)
  await expect(chat.getByRole("heading", { level: 1, name: "ช่วยเหลือ" })).toBeVisible();
  await chat.getByRole("button", { name: "เริ่มแชท" }).click();

  // ข้อความนี้อยู่ใน iframe เช่นกัน ตรวจผ่าน chat ตัวเดิม
  await expect(chat.getByText("เจ้าหน้าที่จะตอบกลับภายใน 5 นาที")).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: ได้ผลเหมือนกัน แต่หา iframe ด้วย getByTitle แล้วเรียก contentFrame()
// ------------------------------------------------
test("หน้า iframe: ใช้ getByTitle กับ contentFrame ได้ผลเหมือน frameLocator", async ({ page }) => {
  await page.goto("/playground/iframe");

  // getByTitle หา element ตามแอตทริบิวต์ title ได้ iframe ที่เป็น Locator ธรรมดา
  // contentFrame() เปลี่ยน Locator ของ iframe ให้เป็น FrameLocator ที่ใช้หาของข้างในต่อได้
  const chat = page.getByTitle("กล่องแชทช่วยเหลือ").contentFrame();

  await expect(chat.getByRole("heading", { level: 1, name: "ช่วยเหลือ" })).toBeVisible();
  await chat.getByRole("button", { name: "เริ่มแชท" }).click();
  await expect(chat.getByText("เจ้าหน้าที่จะตอบกลับภายใน 5 นาที")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: เหมือนตัวอย่างที่ 1 แต่ตรวจข้อความตอบกลับว่ามี 1 รายการ (toHaveCount(1)) แทน toBeVisible
// แนวทาง: ใช้ frameLocator เหมือนตัวอย่างที่ 1 รอหัวข้อ "ช่วยเหลือ" ก่อน กด "เริ่มแชท" แล้ว expect(chat.getByText("เจ้าหน้าที่จะตอบกลับภายใน 5 นาที")).toHaveCount(1)
// ------------------------------------------------
test.fixme("หน้า iframe: หลังกดเริ่มแชทมีข้อความตอบกลับหนึ่งรายการ", async ({ page }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: ตรวจว่า "ก่อนกด" ยังไม่มีข้อความตอบกลับ และ "หลังกด" มีข้อความตอบกลับ ใช้ getByTitle(...).contentFrame()
// แนวทาง: รอหัวข้อ "ช่วยเหลือ" ใน iframe ก่อน แล้ว expect(...).toBeHidden() (ข้อความยังไม่ถูก render จึง hidden) จากนั้นกด "เริ่มแชท" และ expect(...).toBeVisible()
// ------------------------------------------------
test.fixme("หน้า iframe: ข้อความตอบกลับโผล่หลังกดเริ่มแชทเท่านั้น", async ({ page }) => {
  // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: ใส่บัตรที่ไม่ถูกต้องในฟอร์มบัตรเครดิตหน้า /checkout แล้วต้องเห็น "บัตรไม่ถูกต้อง"
// แนวทาง: เรียก openCheckout(page) (เตรียมตะกร้า เปิด /checkout และรอยอดที่ต้องชำระ) วิธีชำระเงินเริ่มที่ "บัตรเครดิต" จึงมี iframe เลย
//        เลือก iframe ด้วย page.frameLocator('iframe[title="ฟอร์มบัตรเครดิต"]') รอให้ปุ่ม "ยืนยันบัตร" ขึ้นใน iframe
//        กรอก "หมายเลขบัตร" "1234" แล้วตรวจ toHaveValue("1234") กรอก "วันหมดอายุ" "12/30", "CVV" "123"
//        แล้วกด "ยืนยันบัตร" และตรวจ alert ใน iframe ด้วย getByRole("alert").filter({ hasText: "บัตรไม่ถูกต้อง" })
//        (ในหน้า iframe ก็มี route announcer ว่างๆ ของ Next.js เหมือนหน้าหลัก จึงต้อง filter ตามข้อความ)
// ------------------------------------------------
test.fixme("หน้า checkout: บัตรที่ไม่ถูกต้องแสดง บัตรไม่ถูกต้อง", async ({ page }) => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 4: ใส่บัตรที่ถูกต้อง (VALID_CARD) แล้วต้องเห็นข้อความทั้งในและนอก iframe
// แนวทาง: เหมือนข้อ 3 (openCheckout, รอปุ่ม, กรอกแล้วตรวจ toHaveValue) แต่ใช้ getByTitle("ฟอร์มบัตรเครดิต").contentFrame() และกรอก VALID_CARD
//        ใน iframe ต้องเห็น "บัตรผ่านการตรวจสอบ" และหน้าหลัก (ใช้ page ปกติ) ต้องเห็น "ยืนยันบัตรแล้ว"
// ------------------------------------------------
test.fixme("หน้า checkout: บัตรที่ถูกต้องยืนยันได้ทั้งใน iframe และหน้าหลัก", async ({ page }) => {
  // 👉 เขียน test ของข้อ 4 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 5: ยืนยันบัตรแล้วกรอกข้อมูลผู้รับที่หน้าหลัก ปุ่ม "ยืนยันคำสั่งซื้อ" ต้องกดได้
// แนวทาง: ต่อจากข้อ 4 กรอก "ชื่อ-นามสกุล", "ที่อยู่", "เบอร์โทรศัพท์" (10 หลัก) และติ๊ก "ฉันยอมรับเงื่อนไขการสั่งซื้อ" ด้วย page ปกติ
//        แล้ว expect(ปุ่ม "ยืนยันคำสั่งซื้อ").toBeEnabled() (ยังไม่ต้องกดปุ่ม)
//        สังเกตว่าของนอก iframe ใช้ page ได้ตามปกติ ไม่ต้องผ่าน frameLocator
// ------------------------------------------------
test.fixme("หน้า checkout: ครบทุกอย่างแล้วปุ่มยืนยันคำสั่งซื้อกดได้", async ({ page }) => {
  // 👉 เขียน test ของข้อ 5 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
