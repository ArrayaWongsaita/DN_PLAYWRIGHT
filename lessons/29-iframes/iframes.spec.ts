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


// ------------------------------------------------
// ตัวอย่างที่ 1: กล่องแชทช่วยเหลือใน iframe ใช้ page.frameLocator(...)
// ------------------------------------------------
test("หน้า iframe: กดเริ่มแชทในกล่องแชทช่วยเหลือ", async ({ page }) => {
  await page.goto("/playground/iframe");

  // frameLocator บอกว่า "ต่อจากนี้ให้หาของข้างใน iframe ตัวนี้" ตัว iframe เองต้องระบุด้วย selector (CSS ที่เรียนในบท 18) ว่า iframe ที่มี title ตรงกัน
  // ข้างในใช้ getByRole ได้ตามปกติ (เหมือน page) แต่ page.getByRole จะมองไม่เห็นของข้างใน iframe
  const chat = page.frameLocator('iframe[title="กล่องแชทช่วยเหลือ"]');

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

  await chat.getByRole("button", { name: "เริ่มแชท" }).click();
  await expect(chat.getByText("เจ้าหน้าที่จะตอบกลับภายใน 5 นาที")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: เหมือนตัวอย่างที่ 1 แต่ตรวจเพิ่มว่าข้างใน iframe มีหัวข้อระดับ 1 "ช่วยเหลือ" ก่อนกดปุ่ม
// แนวทาง: ใช้ frameLocator เหมือนตัวอย่างที่ 1 แล้ว expect(chat.getByRole("heading", ...)).toBeVisible() ก่อนกด "เริ่มแชท"
// ------------------------------------------------
test("หน้า iframe: เห็นหัวข้อช่วยเหลือในกล่องแชทก่อนกดเริ่มแชท", async ({ page }) => {
  await page.goto("/playground/iframe");
  const chat = page.frameLocator('iframe[title="กล่องแชทช่วยเหลือ"]');

  // ปุ่มและหัวข้ออยู่ใน iframe ต้องหาผ่าน frameLocator ถ้าใช้ page.getByRole จะหาไม่เจอ
  await expect(chat.getByRole("heading", { level: 1, name: "ช่วยเหลือ" })).toBeVisible();
  await chat.getByRole("button", { name: "เริ่มแชท" }).click();
  await expect(chat.getByText("เจ้าหน้าที่จะตอบกลับภายใน 5 นาที")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: ตรวจว่า "ก่อนกด" ยังไม่มีข้อความตอบกลับ และ "หลังกด" มีข้อความตอบกลับ ใช้ getByTitle(...).contentFrame()
// แนวทาง: expect(...).toBeHidden() ก่อนกด (ข้อความยังไม่ถูก render จึง hidden) แล้วกด "เริ่มแชท" และ expect(...).toBeVisible()
// ------------------------------------------------
test("หน้า iframe: ข้อความตอบกลับโผล่หลังกดเริ่มแชทเท่านั้น", async ({ page }) => {
  await page.goto("/playground/iframe");
  const chat = page.getByTitle("กล่องแชทช่วยเหลือ").contentFrame();

  // ข้อความยังไม่ถูก render ก่อนกด จึงเป็น hidden (toBeHidden ผ่านทั้งกรณีไม่มี element และ element ถูกซ่อน)
  const reply = chat.getByText("เจ้าหน้าที่จะตอบกลับภายใน 5 นาที");
  await expect(reply).toBeHidden();

  await chat.getByRole("button", { name: "เริ่มแชท" }).click();
  await expect(reply).toBeVisible();
});


// ------------------------------------------------
// ข้อ 3: ใส่บัตรที่ไม่ถูกต้องในฟอร์มบัตรเครดิตหน้า /checkout แล้วต้องเห็น "บัตรไม่ถูกต้อง"
// แนวทาง: เรียก addFirstProductToCart(page) ก่อน แล้ว page.goto("/checkout") (วิธีชำระเงินเริ่มที่ "บัตรเครดิต" จึงมี iframe เลย)
//        เลือก iframe ด้วย page.frameLocator('iframe[title="ฟอร์มบัตรเครดิต"]') กรอก "หมายเลขบัตร" "1234", "วันหมดอายุ" "12/30", "CVV" "123"
//        แล้วกด "ยืนยันบัตร" และตรวจ alert ใน iframe ด้วย getByRole("alert").filter({ hasText: "บัตรไม่ถูกต้อง" })
//        (ในหน้า iframe ก็มี route announcer ว่างๆ ของ Next.js เหมือนหน้าหลัก จึงต้อง filter ตามข้อความ)
// ------------------------------------------------
test("หน้า checkout: บัตรที่ไม่ถูกต้องแสดง บัตรไม่ถูกต้อง", async ({ page }) => {
  // ต้องมีของในตะกร้าก่อน ไม่งั้น /checkout จะเด้งไป /cart
  await addFirstProductToCart(page);
  await page.goto("/checkout");

  const card = page.frameLocator('iframe[title="ฟอร์มบัตรเครดิต"]');
  await card.getByLabel("หมายเลขบัตร").fill("1234");
  await card.getByLabel("วันหมดอายุ").fill("12/30");
  await card.getByLabel("CVV").fill("123");
  await card.getByRole("button", { name: "ยืนยันบัตร" }).click();

  // iframe ก็มี route announcer ว่างๆ ของ Next.js (role=alert) ด้วย จึงต้อง filter ตามข้อความ ไม่งั้น strict mode violation
  await expect(card.getByRole("alert").filter({ hasText: "บัตรไม่ถูกต้อง" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: ใส่บัตรที่ถูกต้อง (VALID_CARD) แล้วต้องเห็นข้อความทั้งในและนอก iframe
// แนวทาง: เหมือนข้อ 3 แต่ใช้ getByTitle("ฟอร์มบัตรเครดิต").contentFrame() และกรอก VALID_CARD
//        ใน iframe ต้องเห็น "บัตรผ่านการตรวจสอบ" และหน้าหลัก (ใช้ page ปกติ) ต้องเห็น "ยืนยันบัตรแล้ว"
// ------------------------------------------------
test("หน้า checkout: บัตรที่ถูกต้องยืนยันได้ทั้งใน iframe และหน้าหลัก", async ({ page }) => {
  await addFirstProductToCart(page);
  await page.goto("/checkout");

  const card = page.getByTitle("ฟอร์มบัตรเครดิต").contentFrame();
  await card.getByLabel("หมายเลขบัตร").fill(VALID_CARD);
  await card.getByLabel("วันหมดอายุ").fill("12/30");
  await card.getByLabel("CVV").fill("123");
  await card.getByRole("button", { name: "ยืนยันบัตร" }).click();

  // ข้อความแรกอยู่ใน iframe (ใช้ card) ข้อความที่สองอยู่หน้าหลัก (ใช้ page) ฟอร์มส่งสัญญาณ postMessage ไปบอกหน้าหลัก
  await expect(card.getByRole("status")).toHaveText("บัตรผ่านการตรวจสอบ");
  await expect(page.getByText("ยืนยันบัตรแล้ว")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 5: ยืนยันบัตรแล้วกรอกข้อมูลผู้รับที่หน้าหลัก ปุ่ม "ยืนยันคำสั่งซื้อ" ต้องกดได้
// แนวทาง: ต่อจากข้อ 4 กรอก "ชื่อ-นามสกุล", "ที่อยู่", "เบอร์โทรศัพท์" (10 หลัก) และติ๊ก "ฉันยอมรับเงื่อนไขการสั่งซื้อ" ด้วย page ปกติ
//        แล้ว expect(ปุ่ม "ยืนยันคำสั่งซื้อ").toBeEnabled() (ยังไม่ต้องกดปุ่ม)
//        สังเกตว่าของนอก iframe ใช้ page ได้ตามปกติ ไม่ต้องผ่าน frameLocator
// ------------------------------------------------
test("หน้า checkout: ครบทุกอย่างแล้วปุ่มยืนยันคำสั่งซื้อกดได้", async ({ page }) => {
  await addFirstProductToCart(page);
  await page.goto("/checkout");

  const card = page.getByTitle("ฟอร์มบัตรเครดิต").contentFrame();
  await card.getByLabel("หมายเลขบัตร").fill(VALID_CARD);
  await card.getByLabel("วันหมดอายุ").fill("12/30");
  await card.getByLabel("CVV").fill("123");
  await card.getByRole("button", { name: "ยืนยันบัตร" }).click();
  // รอให้หน้าหลักรับรู้ว่าบัตรผ่านแล้ว ก่อนไปกรอกส่วนอื่น
  await expect(page.getByText("ยืนยันบัตรแล้ว")).toBeVisible();

  // ของนอก iframe ใช้ page ตามปกติ
  await page.getByLabel("ชื่อ-นามสกุล").fill("สมชาย ใจดี");
  await page.getByLabel("ที่อยู่").fill("1 ถนนสุขุมวิท กรุงเทพฯ");
  await page.getByLabel("เบอร์โทรศัพท์").fill("0812345678");
  await page.getByLabel("ฉันยอมรับเงื่อนไขการสั่งซื้อ").check();

  // ปุ่มจะกดได้ก็ต่อเมื่อ ข้อมูลครบ + ติ๊กยอมรับ + บัตรผ่าน (ไม่ต้องกดจริงในข้อนี้)
  await expect(page.getByRole("button", { name: "ยืนยันคำสั่งซื้อ" })).toBeEnabled();
});
