import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 28: เมาส์ คีย์บอร์ด และลากวาง
// ฝึก: dragTo, mouse.move/down/up, keyboard.press, keyboard.type, ControlOrMeta+K, Escape, คีย์ลัด /
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: ลากการ์ด "แพ็กสินค้า" จากช่อง "ต้องทำ" ไปช่อง "กำลังทำ" ด้วย dragTo
// ------------------------------------------------
test("หน้า drag-drop: ลากการ์ดแพ็กสินค้าไปช่องกำลังทำ", async ({ page }) => {
  await page.goto("/playground/drag-drop");

  // แต่ละช่องเป็น <section aria-label="..."> ซึ่งมี role เป็น region
  const todo = page.getByRole("region", { name: "ต้องทำ" });
  const doing = page.getByRole("region", { name: "กำลังทำ" });
  const card = todo.getByRole("listitem").filter({ hasText: "แพ็กสินค้า" });

  // dragTo(เป้าหมาย): กดเมาส์ค้างที่การ์ด ลากไปกลางเป้าหมาย แล้วปล่อย
  await card.dragTo(doing);

  // การ์ดต้องไปอยู่ในช่องกำลังทำ
  await expect(doing.getByRole("listitem").filter({ hasText: "แพ็กสินค้า" })).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: คีย์ลัด ControlOrMeta+K เปิดกล่องค้นหาด่วน และ Escape ปิด
// ------------------------------------------------
test("หน้า keyboard: กด Ctrl/Cmd+K เปิดค้นหาด่วน แล้วกด Escape ปิด", async ({ page }) => {
  await page.goto("/playground/keyboard");
  const dialog = page.getByRole("dialog", { name: "ค้นหาด่วน" });
  await expect(dialog).toBeHidden();

  // "ControlOrMeta" = Control บน Windows/Linux และ Meta (Cmd) บน macOS เขียนครั้งเดียวใช้ได้ทุกเครื่อง
  await page.keyboard.press("ControlOrMeta+K");
  await expect(dialog).toBeVisible();

  // press ปล่อยคีย์ทันทีหลังกด: Escape ปิดกล่อง
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});


// ------------------------------------------------
// ข้อ 1: เหมือนตัวอย่างที่ 1 แต่ลากการ์ด "ส่งของ" ไปช่อง "กำลังทำ"
// แนวทาง: เปลี่ยนชื่อการ์ด ที่เหลือเหมือนตัวอย่าง
// ------------------------------------------------
test("หน้า drag-drop: ลากการ์ดส่งของไปช่องกำลังทำ", async ({ page }) => {
  await page.goto("/playground/drag-drop");

  const doing = page.getByRole("region", { name: "กำลังทำ" });
  const card = page.getByRole("region", { name: "ต้องทำ" }).getByRole("listitem").filter({ hasText: "ส่งของ" });

  await card.dragTo(doing);

  // ทำไม: ตรวจในช่องปลายทางเพื่อยืนยันว่าการ์ดย้ายไปจริง (ไม่ใช่แค่เห็นการ์ดที่ไหนสักแห่ง)
  await expect(doing.getByRole("listitem").filter({ hasText: "ส่งของ" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: ลากการ์ด "ตอบแชทลูกค้า" ไปช่อง "เสร็จแล้ว" และตรวจว่าช่อง "ต้องทำ" ไม่มีการ์ดนี้แล้ว
// แนวทาง: ตรวจ 2 ฝั่ง: ช่องเสร็จแล้วต้องเห็นการ์ด และช่องต้องทำ expect(...).toHaveCount(0) สำหรับการ์ดชื่อนี้
// ------------------------------------------------
test("หน้า drag-drop: การ์ดย้ายจากช่องต้องทำไปช่องเสร็จแล้ว", async ({ page }) => {
  await page.goto("/playground/drag-drop");

  const todo = page.getByRole("region", { name: "ต้องทำ" });
  const done = page.getByRole("region", { name: "เสร็จแล้ว" });
  const cardName = "ตอบแชทลูกค้า";

  await todo.getByRole("listitem").filter({ hasText: cardName }).dragTo(done);

  await expect(done.getByRole("listitem").filter({ hasText: cardName })).toBeVisible();
  // ทำไม: ต้องตรวจฝั่งต้นทางด้วยว่าการ์ดหายไป (ย้าย ไม่ใช่คัดลอก)
  await expect(todo.getByRole("listitem").filter({ hasText: cardName })).toHaveCount(0);
});


// ------------------------------------------------
// ข้อ 3: ลากการ์ด "แพ็กสินค้า" ไปช่อง "กำลังทำ" ด้วย mouse.move / mouse.down / mouse.up แทน dragTo
// แนวทาง: หา boundingBox() ของการ์ดและของช่อง (ผลลัพธ์อาจเป็น null จึงต้องตรวจก่อนใช้ ถ้า null ให้ throw error)
//        mouse.move ไปกลางการ์ด -> mouse.down() -> mouse.move ไปกลางช่องเป้าหมาย ใส่ { steps: 10 } ให้เมาส์เคลื่อนทีละนิด
//        -> mouse.up() แล้วตรวจว่าการ์ดอยู่ในช่องกำลังทำ
// ------------------------------------------------
test("หน้า drag-drop: ลากด้วย mouse.move/down/up", async ({ page }) => {
  await page.goto("/playground/drag-drop");

  const doing = page.getByRole("region", { name: "กำลังทำ" });
  const card = page.getByRole("region", { name: "ต้องทำ" }).getByRole("listitem").filter({ hasText: "แพ็กสินค้า" });

  // ทำไม: boundingBox() ให้พิกัดบนหน้า และเป็น null ได้ถ้า element ไม่ปรากฏ จึงต้องตรวจก่อนใช้
  const from = await card.boundingBox();
  const to = await doing.boundingBox();
  if (!from || !to) throw new Error("หาการ์ดหรือช่องปลายทางไม่เจอ");

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2); // ไปกลางการ์ด
  await page.mouse.down(); // กดค้าง
  // ทำไม: steps: 10 ให้เมาส์เคลื่อนทีละนิด เพราะการลากต้องมี mousemove ต่อเนื่องหลายครั้ง
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 });
  await page.mouse.up(); // ปล่อย

  await expect(doing.getByRole("listitem").filter({ hasText: "แพ็กสินค้า" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: พิมพ์ข้อความด้วย keyboard.type และตรวจ "คีย์ล่าสุด"
// แนวทาง: goto("/playground/keyboard") กดที่ช่อง "พิมพ์ที่นี่" (click ให้โฟกัส) แล้ว page.keyboard.type("abc")
//        ตรวจ toHaveValue("abc") ของช่อง และ role="status" ข้อความ "คีย์ล่าสุด: c"
//        จากนั้น page.keyboard.press("Enter") แล้วตรวจ "คีย์ล่าสุด: Enter"
// ------------------------------------------------
test("หน้า keyboard: พิมพ์ข้อความแล้วดูคีย์ล่าสุด", async ({ page }) => {
  await page.goto("/playground/keyboard");

  // ทำไม: keyboard.type พิมพ์ลงสิ่งที่โฟกัสอยู่ จึงต้องคลิกช่องก่อน
  const input = page.getByLabel("พิมพ์ที่นี่");
  await input.click();
  await page.keyboard.type("abc");

  await expect(input).toHaveValue("abc");
  // ทำไม: type ส่ง keydown ทีละตัวอักษร คีย์สุดท้ายคือ c
  const lastKey = page.getByRole("status").filter({ hasText: "คีย์ล่าสุด" });
  await expect(lastKey).toHaveText("คีย์ล่าสุด: c");

  await page.keyboard.press("Enter");
  await expect(lastKey).toHaveText("คีย์ล่าสุด: Enter");
});


// ------------------------------------------------
// ข้อ 5: เปิดกล่องค้นหาด่วนด้วย ControlOrMeta+K แล้วพิมพ์คำค้นเข้าช่องที่โฟกัสอยู่ก่อนปิดด้วย Escape
// แนวทาง: หลังกล่องเปิด ช่อง "ค้นหา" ถูกโฟกัสให้อัตโนมัติ จึงใช้ page.keyboard.type("หูฟัง") ได้เลย
//        ตรวจ dialog.getByLabel("ค้นหา") toHaveValue("หูฟัง") แล้วกด Escape ตรวจว่า dialog ปิด
// ------------------------------------------------
test("หน้า keyboard: พิมพ์ในกล่องค้นหาด่วนแล้วปิดด้วย Escape", async ({ page }) => {
  await page.goto("/playground/keyboard");
  const dialog = page.getByRole("dialog", { name: "ค้นหาด่วน" });

  await page.keyboard.press("ControlOrMeta+K");
  await expect(dialog).toBeVisible();

  // ทำไม: แอปโฟกัสช่อง "ค้นหา" ให้เมื่อกล่องเปิด จึงพิมพ์ต่อได้เลยโดยไม่ต้องคลิก
  await page.keyboard.type("หูฟัง");
  await expect(dialog.getByLabel("ค้นหา")).toHaveValue("หูฟัง");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});


// ------------------------------------------------
// ข้อ 6: กดคีย์ "/" บนหน้า /products แล้วโฟกัสไปที่ช่องค้นหา
// แนวทาง: goto("/products") รอให้ข้อความ "พบสินค้า 10 รายการ" ขึ้นก่อน (หน้าพร้อมแล้ว)
//        ตอนนี้โฟกัสอยู่ที่ body (ไม่ได้อยู่ในช่องกรอก) กด page.keyboard.press("/")
//        ตรวจ getByRole("searchbox", { name: "ค้นหาสินค้า" }) ว่า toBeFocused()
// ------------------------------------------------
test("หน้าสินค้า: กด / เพื่อโฟกัสช่องค้นหา", async ({ page }) => {
  await page.goto("/products");
  // ทำไม: คีย์ลัดทำงานด้วย JavaScript ของหน้า จึงรอให้หน้าพร้อม (รายการโหลดแล้ว) ก่อนกด
  await expect(page.getByText("พบสินค้า 10 รายการ")).toBeVisible();

  const search = page.getByRole("searchbox", { name: "ค้นหาสินค้า" });
  await expect(search).not.toBeFocused();

  // ทำไม: ตอนนี้โฟกัสอยู่ที่ body ไม่ใช่ในช่องกรอก คีย์ / จึงเป็นคีย์ลัด
  await page.keyboard.press("/");
  await expect(search).toBeFocused();
});
