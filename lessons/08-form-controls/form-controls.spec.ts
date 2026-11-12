import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 08: checkbox, radio และ select
// ฝึก: check, uncheck, selectOption, toBeChecked, toHaveValue
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: ติ๊ก "รับข่าวสารทางอีเมล" ไว้ก่อน ยกเลิกแล้วต้องไม่ติ๊ก (uncheck + toBeChecked)
// ------------------------------------------------
test("หน้า /register ยกเลิกการรับข่าวสารแล้วต้องไม่ถูกติ๊ก", async ({ page }) => {
  await page.goto("/register");
  const newsletter = page.getByRole("checkbox", { name: "รับข่าวสารทางอีเมล" });
  // หน้านี้ติ๊กช่องนี้ไว้ให้ก่อน ตรวจว่าเป็นอย่างนั้นจริง
  await expect(newsletter).toBeChecked();
  // uncheck เอาเครื่องหมายถูกออก (ถ้าไม่ได้ติ๊กอยู่แล้ว uncheck ก็ไม่ทำอะไร ต่างจาก click ที่สลับค่า)
  await newsletter.uncheck();
  // .not ตรวจกลับด้าน: ต้อง "ไม่" ถูกติ๊ก
  await expect(newsletter).not.toBeChecked();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: เลือกจังหวัดจากรายการ (selectOption)
// ------------------------------------------------
test("หน้า /register เลือกจังหวัดเชียงใหม่", async ({ page }) => {
  await page.goto("/register");
  // <select> มี label "จังหวัด" จึงหาด้วย role "combobox" ชื่อ "จังหวัด"
  const province = page.getByRole("combobox", { name: "จังหวัด" });
  // selectOption("...") ส่งข้อความเดียว Playwright จะลองจับคู่ทั้ง value และข้อความ (label) ของตัวเลือก
  await province.selectOption("เชียงใหม่");
  await expect(province).toHaveValue("เชียงใหม่");
});


// ------------------------------------------------
// ข้อ 1: ติ๊ก "ฉันยอมรับเงื่อนไขการใช้งาน" แล้วต้องถูกติ๊ก
// แนวทาง: ก่อนติ๊ก ช่องนี้ยังว่าง ตรวจด้วย not.toBeChecked() แล้วเรียก check() แล้วตรวจ toBeChecked()
// ------------------------------------------------
test("หน้า /register ติ๊กยอมรับเงื่อนไขแล้วต้องถูกติ๊ก", async ({ page }) => {
  await page.goto("/register");
  const terms = page.getByRole("checkbox", { name: "ฉันยอมรับเงื่อนไขการใช้งาน" });
  await expect(terms).not.toBeChecked();
  // ทำไมใช้ check ไม่ใช่ click: check รับประกันว่าผลลัพธ์คือ "ติ๊กอยู่" ไม่ว่าค่าเริ่มต้นเป็นอะไร
  await terms.check();
  await expect(terms).toBeChecked();
});


// ------------------------------------------------
// ข้อ 2: เลือก radio "โซเชียลมีเดีย" ในกลุ่ม "รู้จักเราจากช่องทางไหน" แล้วต้องถูกเลือก และ "เพื่อนแนะนำ" ต้องไม่ถูกเลือก
// แนวทาง: radio ใช้ role "radio" ชื่อ "โซเชียลมีเดีย" เรียก check() ได้เลย (radio เลือกแล้วยกเลิกด้วย uncheck ไม่ได้ ต้องเลือกตัวอื่นแทน)
//        ตรวจด้วย toBeChecked และ not.toBeChecked
// ------------------------------------------------
test("หน้า /register เลือกช่องทางที่รู้จักเรา", async ({ page }) => {
  await page.goto("/register");
  const social = page.getByRole("radio", { name: "โซเชียลมีเดีย" });
  const friend = page.getByRole("radio", { name: "เพื่อนแนะนำ" });
  await social.check();
  await expect(social).toBeChecked();
  // ทำไมตรวจตัวอื่นด้วย: จุดสำคัญของ radio คือ "เลือกได้ตัวเดียวในกลุ่ม"
  await expect(friend).not.toBeChecked();
});


// ------------------------------------------------
// ข้อ 3: ติ๊กหมวดที่สนใจ "หนังสือ" และ "เสื้อผ้า" พร้อมกันได้ (checkbox เลือกได้หลายตัว)
// แนวทาง: checkbox ชื่อ "หนังสือ" และ "เสื้อผ้า" เรียก check() ทั้งคู่ แล้วตรวจ toBeChecked ทั้งสองตัว
//        ส่วน "ของใช้ในบ้าน" ต้องไม่ถูกติ๊ก
// ------------------------------------------------
test("หน้า /register ติ๊กหมวดที่สนใจได้หลายหมวด", async ({ page }) => {
  await page.goto("/register");
  const books = page.getByRole("checkbox", { name: "หนังสือ" });
  const fashion = page.getByRole("checkbox", { name: "เสื้อผ้า" });
  await books.check();
  await fashion.check();
  // ทำไมตรวจทั้งสองตัว: checkbox ต่างจาก radio ตรงที่ติ๊กได้พร้อมกันหลายตัว
  await expect(books).toBeChecked();
  await expect(fashion).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "ของใช้ในบ้าน" })).not.toBeChecked();
});


// ------------------------------------------------
// ข้อ 4: หน้า /checkout เลือกวิธีชำระเงิน "โอนผ่านธนาคาร" ด้วยข้อความ (label) แล้วเปลี่ยนเป็น "เก็บเงินปลายทาง" ด้วย value ("cod")
// แนวทาง: เตรียมของก่อน: goto("/products") กดปุ่ม "เพิ่มลงตะกร้า" ปุ่มแรก (.first())
//        แล้ว goto("/checkout") (ถ้าตะกร้าว่างหน้านี้จะเด้งกลับ /cart)
//        select ชื่อ "วิธีชำระเงิน": selectOption({ label: "โอนผ่านธนาคาร" }) ตรวจ toHaveValue("transfer")
//        แล้ว selectOption({ value: "cod" }) ตรวจ toHaveValue("cod")
// ------------------------------------------------
test("หน้า /checkout เลือกวิธีชำระเงินด้วย label และ value", async ({ page }) => {
  // เตรียมของ: /checkout จะเด้งกลับ /cart ถ้าตะกร้าว่าง
  await page.goto("/products");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "ลงตะกร้าแล้ว" })).toBeVisible();
  await page.goto("/checkout");

  const payment = page.getByRole("combobox", { name: "วิธีชำระเงิน" });
  // เลือกด้วย label = ข้อความที่ผู้ใช้เห็น
  await payment.selectOption({ label: "โอนผ่านธนาคาร" });
  // toHaveValue ตรวจ value ในโค้ด ("transfer") ไม่ใช่ข้อความที่เห็น
  await expect(payment).toHaveValue("transfer");
  // เลือกด้วย value = ค่าในโค้ด HTML
  await payment.selectOption({ value: "cod" });
  await expect(payment).toHaveValue("cod");
});


// ------------------------------------------------
// ข้อ 5: หน้า /checkout วิธีจัดส่ง "ส่งธรรมดา (50 บาท)" ถูกเลือกไว้ก่อน เลือก "ส่งด่วน (100 บาท)" แล้วสลับกัน
// แนวทาง: เตรียมของแบบข้อ 4 แล้วตรวจ radio ทั้งสองตัวด้วย toBeChecked / not.toBeChecked ก่อนและหลัง check()
// ------------------------------------------------
test("หน้า /checkout สลับวิธีจัดส่งเป็นส่งด่วน", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "ลงตะกร้าแล้ว" })).toBeVisible();
  await page.goto("/checkout");

  const standard = page.getByRole("radio", { name: "ส่งธรรมดา (50 บาท)" });
  const express = page.getByRole("radio", { name: "ส่งด่วน (100 บาท)" });
  // ค่าเริ่มต้น: ส่งธรรมดา
  await expect(standard).toBeChecked();
  await expect(express).not.toBeChecked();
  await express.check();
  // เลือกตัวใหม่แล้ว ตัวเดิมถูกยกเลิกเองเพราะอยู่กลุ่มเดียวกัน
  await expect(express).toBeChecked();
  await expect(standard).not.toBeChecked();
});
