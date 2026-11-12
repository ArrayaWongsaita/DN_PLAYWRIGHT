import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 25: dialog (alert, confirm, prompt)
// ฝึก: page.once("dialog"), accept, dismiss, message, ตั้ง handler ก่อนกดปุ่มเสมอ
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: alert รับด้วย accept() และเก็บข้อความ dialog ไปตรวจนอก handler
// ------------------------------------------------
test("หน้า dialogs: กดแสดง alert แล้วข้อความต้องเป็น นี่คือ alert", async ({ page }) => {
  await page.goto("/playground/dialogs");

  // ตัวแปรสำหรับเก็บข้อความที่ dialog แสดง เอาไว้ตรวจทีหลังข้างนอก handler
  let message = "";

  // ต้องตั้ง handler ก่อนกดปุ่ม ถ้ากดก่อน dialog จะเด้งโดยไม่มีใครตอบ (Playwright ปิดให้เองแบบ dismiss)
  // once = ทำงานครั้งเดียว (dialog แรกที่เด้ง) แล้วเลิกฟัง
  page.once("dialog", async (dialog) => {
    message = dialog.message(); // อ่านข้อความ
    await dialog.accept(); // กด OK
  });

  await page.getByRole("button", { name: "แสดง alert" }).click();

  // ตรวจข้อความนอก handler: ถ้า assert ใน handler แล้วไม่ผ่าน error จะหายไปกับ event และ test อาจดูเหมือนผ่าน
  expect(message).toBe("นี่คือ alert");
});


// ------------------------------------------------
// ตัวอย่างที่ 2: confirm ตอน "ลบสินค้าในตะกร้า" กดตกลงแล้วของหายจากตะกร้า
// ------------------------------------------------
test("ตะกร้า: ลบเมาส์ไร้สายแล้วกดตกลงใน confirm ตะกร้าว่าง", async ({ page }) => {
  // เตรียมของในตะกร้าก่อน
  await page.goto("/products");
  const card = page.getByRole("listitem").filter({ hasText: "เมาส์ไร้สาย" });
  await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(page.getByRole("link", { name: "ตะกร้า (1)" })).toBeVisible();

  await page.goto("/cart");
  const item = page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem").filter({ hasText: "เมาส์ไร้สาย" });

  let message = "";
  page.once("dialog", async (dialog) => {
    message = dialog.message();
    await dialog.accept(); // accept = กดตกลง ของจะถูกลบ
  });
  await item.getByRole("button", { name: "ลบ" }).click();

  // ตรวจข้อความที่ถามผู้ใช้ และผลที่เกิดตามมา
  expect(message).toBe('ต้องการลบ "เมาส์ไร้สาย" ออกจากตะกร้าใช่ไหม?');
  await expect(page.getByText("ตะกร้าของคุณยังว่างอยู่")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: เหมือนตัวอย่างที่ 1 แต่ใช้ confirm: กด "แสดง confirm" แล้ว accept ผลลัพธ์ต้องเป็น "ผลลัพธ์: ตกลง"
// แนวทาง: ตั้ง page.once("dialog", ...) ก่อน click เก็บ message() ไว้ตรวจว่าเป็น "ยืนยันใช่ไหม?"
//        แล้วตรวจ role="status" ข้อความ "ผลลัพธ์: ตกลง"
// ------------------------------------------------
test("หน้า dialogs: confirm กดตกลง", async ({ page }) => {
  await page.goto("/playground/dialogs");

  let message = "";
  // ทำไม: ตั้ง handler ก่อนกดปุ่ม ไม่งั้น dialog เด้งโดยไม่มีใครตอบ
  page.once("dialog", async (dialog) => {
    message = dialog.message();
    await dialog.accept(); // กดตกลง
  });
  await page.getByRole("button", { name: "แสดง confirm" }).click();

  // ทำไม: ตรวจข้อความนอก handler เพื่อให้ถ้าไม่ตรง test fail ที่นี่ชัดเจน
  expect(message).toBe("ยืนยันใช่ไหม?");
  await expect(page.getByRole("status").filter({ hasText: "ผลลัพธ์: ตกลง" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: confirm เหมือนข้อ 1 แต่ใช้ dismiss() (กดยกเลิก) ผลลัพธ์ต้องเป็น "ผลลัพธ์: ยกเลิก"
// แนวทาง: เปลี่ยนจาก dialog.accept() เป็น dialog.dismiss() ที่เหลือเหมือนเดิม
// ------------------------------------------------
test("หน้า dialogs: confirm กดยกเลิก", async ({ page }) => {
  await page.goto("/playground/dialogs");

  let message = "";
  page.once("dialog", async (dialog) => {
    message = dialog.message();
    await dialog.dismiss(); // ทำไม: dismiss = กดยกเลิก confirm จึงได้ false
  });
  await page.getByRole("button", { name: "แสดง confirm" }).click();

  expect(message).toBe("ยืนยันใช่ไหม?");
  await expect(page.getByRole("status").filter({ hasText: "ผลลัพธ์: ยกเลิก" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 3: prompt ที่ต้องพิมพ์คำตอบ: กด "แสดง prompt" ตอบด้วยชื่อ "สมชาย" ผลลัพธ์ต้องเป็น "สวัสดี, สมชาย"
// แนวทาง: dialog.accept("สมชาย") ส่งข้อความเข้าช่อง prompt แล้วกด OK
//        dialog.message() ของ prompt ต้องเป็น "กรุณาใส่ชื่อของคุณ"
// ------------------------------------------------
test("หน้า dialogs: prompt ตอบชื่อ", async ({ page }) => {
  await page.goto("/playground/dialogs");

  let message = "";
  page.once("dialog", async (dialog) => {
    message = dialog.message();
    await dialog.accept("สมชาย"); // ทำไม: accept(ข้อความ) ใส่คำตอบให้ prompt ก่อนกด OK
  });
  await page.getByRole("button", { name: "แสดง prompt" }).click();

  expect(message).toBe("กรุณาใส่ชื่อของคุณ");
  await expect(page.getByRole("status").filter({ hasText: "สวัสดี, สมชาย" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: prompt แล้วกดยกเลิก: dismiss() ผลลัพธ์ต้องเป็น "ผลลัพธ์: ยกเลิก"
// แนวทาง: เหมือนข้อ 3 แต่ใช้ dismiss() และไม่ต้องส่งข้อความ
// ------------------------------------------------
test("หน้า dialogs: prompt กดยกเลิก", async ({ page }) => {
  await page.goto("/playground/dialogs");

  let message = "";
  page.once("dialog", async (dialog) => {
    message = dialog.message();
    await dialog.dismiss(); // ทำไม: prompt ที่ถูกยกเลิกให้ค่า null แอปจึงแสดง "ผลลัพธ์: ยกเลิก"
  });
  await page.getByRole("button", { name: "แสดง prompt" }).click();

  expect(message).toBe("กรุณาใส่ชื่อของคุณ");
  await expect(page.getByRole("status").filter({ hasText: "ผลลัพธ์: ยกเลิก" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 5: ลบของในตะกร้าแต่กดยกเลิกใน confirm: ของต้องยังอยู่ในตะกร้า
// แนวทาง: เตรียมตะกร้าเหมือนตัวอย่างที่ 2 (แต่ใช้ "หมวกแก๊ป" ไม่ได้เพราะหมด ใช้ "แก้วกาแฟเซรามิก")
//        ตั้ง handler ที่ dismiss() เก็บ message ไว้ ตรวจว่าเป็น 'ต้องการลบ "แก้วกาแฟเซรามิก" ออกจากตะกร้าใช่ไหม?'
//        แล้วตรวจว่าสินค้ายังเห็นอยู่ในรายการสินค้าในตะกร้า
// ------------------------------------------------
test("ตะกร้า: ลบแก้วกาแฟแต่กดยกเลิก ของยังอยู่", async ({ page }) => {
  // เตรียมของในตะกร้า
  await page.goto("/products");
  const card = page.getByRole("listitem").filter({ hasText: "แก้วกาแฟเซรามิก" });
  await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(page.getByRole("link", { name: "ตะกร้า (1)" })).toBeVisible();

  await page.goto("/cart");
  const item = page
    .getByRole("list", { name: "สินค้าในตะกร้า" })
    .getByRole("listitem")
    .filter({ hasText: "แก้วกาแฟเซรามิก" });

  let message = "";
  page.once("dialog", async (dialog) => {
    message = dialog.message();
    await dialog.dismiss(); // ทำไม: ยกเลิก = ไม่ลบ
  });
  // ทำไม: หาปุ่ม "ลบ" ภายในรายการของสินค้านั้น เผื่อมีสินค้าอื่นในตะกร้า
  await item.getByRole("button", { name: "ลบ" }).click();

  expect(message).toBe('ต้องการลบ "แก้วกาแฟเซรามิก" ออกจากตะกร้าใช่ไหม?');
  // ทำไม: ตรวจผลที่ตามมา: สินค้ายังอยู่ ตะกร้ายังไม่ว่าง
  await expect(item).toBeVisible();
});
