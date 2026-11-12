import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 15: Debug test ทีละขั้น
// ฝึก: --debug (Playwright Inspector), page.pause(), VS Code extension (breakpoint, Pick locator)
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================
//
// รูปแบบของบทนี้ไม่เหมือนบทอื่น:
//   - ตัวอย่างที่ 1 เป็น test ที่ผ่าน ไว้ฝึกใช้เครื่องมือ debug กับ test ที่ไม่มีอะไรพัง
//   - ข้อ 1–3 เป็น test ที่ "ตั้งใจให้พัง" อยู่ใน test.fixme (บน main ต้องไม่มี failed)
//     ผู้เรียนเปลี่ยนเป็น test ทีละข้อ รันด้วย --debug หรือ VS Code เดินทีละขั้น หาว่าพังเพราะอะไร แล้วแก้ให้ผ่าน
//   - ข้อ 3 มี await page.pause() อยู่แล้ว (ตอนรันแบบ headless ปกติ page.pause() ไม่ทำอะไร ไม่ทำให้ test ค้าง)


// ------------------------------------------------
// ตัวอย่างที่ 1: test ที่ผ่าน ไว้ฝึกเดินทีละขั้นด้วย Inspector
// (รัน: pnpm test 15-debugging -g "ตัวอย่างที่ 1" --debug)
// ------------------------------------------------
test("ตัวอย่างที่ 1: เข้าสู่ระบบแล้วไปหน้าบัญชีของฉัน", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("user@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("password123");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByRole("heading", { name: "บัญชีของฉัน" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: test นี้พัง เดินทีละขั้นด้วย --debug (หรือ VS Code) ดูว่าหน้าเป็นอย่างไรในแต่ละขั้น แล้วแก้ให้ผ่าน
// อาการ: ยอดสุทธิไม่ใช่ 1,161 บาท
// เป้าหมายของ test: ใส่หูฟัง 1 ชิ้น (ราคา 1,290 บาท) ลงตะกร้า ใช้โค้ด DN10 แล้วยอดสุทธิต้องเป็น 1,161 บาท
// แนวทาง: รัน pnpm test 15-debugging -g "ข้อ 1" --debug แล้วกด Step over (F10) ทีละบรรทัด
//        ดูในหน้าต่างเบราว์เซอร์ว่าหลังขั้น goto("/cart") ในตะกร้ามีสินค้าหรือไม่
//        (เติมขั้นที่ขาดก่อนเปิดหน้า /cart: เปิด /products/p01 และกดเพิ่มลงตะกร้า แล้วรอข้อความยืนยันก่อนไปต่อ)
// ------------------------------------------------
test.fixme("ข้อ 1: ใช้โค้ด DN10 กับหูฟัง 1 ชิ้นแล้วยอดสุทธิต้องเป็น 1,161 บาท", async ({ page }) => {
  await page.goto("/cart");
  await page.getByLabel("โค้ดส่วนลด").fill("DN10");
  await page.getByRole("button", { name: "ใช้โค้ด" }).click();
  await expect(page.getByTestId("total")).toHaveText("1,161 บาท");
});


// ------------------------------------------------
// ข้อ 2: test นี้พัง ใช้ Pick locator (ใน Inspector หรือ VS Code) เลือก locator ที่ถูกต้อง แล้วแก้ให้ผ่าน
// อาการ: ข้อความ error บอกว่า locator ตรงกับ 2 element
// เป้าหมายของ test: ในหน้าสมัครสมาชิก กรอกอีเมลลงในช่อง "อีเมล" (ช่องกรอก ไม่ใช่ checkbox)
// แนวทาง: รัน pnpm test 15-debugging -g "ข้อ 2" --debug เมื่อหยุดที่บรรทัด fill ให้ดูว่า Inspector ไฮไลต์ element ไหนบ้าง
//        กด Pick locator แล้วคลิกที่ช่องอีเมล จะได้ locator ที่เจาะจงกว่า เอาไปแทนที่ใน test
// ------------------------------------------------
test.fixme("ข้อ 2: หน้า /register กรอกอีเมลในช่องอีเมล", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("อีเมล").fill("somchai@example.com");
  await expect(page.getByRole("textbox", { name: "อีเมล" })).toHaveValue("somchai@example.com");
});


// ------------------------------------------------
// ข้อ 3: test นี้พัง ใช้ page.pause() ที่ใส่ไว้ให้ หยุดดูหน้าเว็บตอนนั้น แล้วแก้ให้ผ่าน
// อาการ: หลังกดปุ่มเข้าสู่ระบบ URL ไม่ใช่ /account
// เป้าหมายของ test: ผู้ใช้ user@dnshop.test เข้าสู่ระบบแล้วต้องไปหน้า /account
// แนวทาง: รัน pnpm test 15-debugging -g "ข้อ 3" --debug แล้วกด Resume (F8) ใน Inspector
//        test จะรันต่อจนถึงบรรทัด page.pause() แล้วหยุด ดูในหน้าต่างเบราว์เซอร์ว่าหน้าตอนนี้เป็นอย่างไร มีข้อความอะไรขึ้น
//        รันแบบ headed ได้เช่นกัน: pnpm test 15-debugging -g "ข้อ 3" --headed
//        แก้เสร็จแล้วลบบรรทัด page.pause() ออก (ของที่ค้างอยู่ใน test ที่ส่งเข้า repo ถือเป็นนิสัยที่ไม่ดี)
// ------------------------------------------------
test.fixme("ข้อ 3: เข้าสู่ระบบแล้วต้องไปหน้า /account", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("user@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("password12");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await page.pause();
  await expect(page).toHaveURL("/account");
});
