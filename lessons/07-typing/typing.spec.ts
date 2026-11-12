import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 07: พิมพ์ข้อความและกดคีย์
// ฝึก: fill, clear, pressSequentially, press, getByRole("alert") + filter, toHaveValue
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: ค้นหา "หูฟัง" ที่หน้า /products แล้วต้องพบสินค้า 1 รายการ (fill + press)
// ------------------------------------------------
test("หน้า /products ค้นหาหูฟังแล้วต้องพบสินค้า 1 รายการ", async ({ page }) => {
  await page.goto("/products");
  // ช่องค้นหาคือ <input type="search"> ที่มี label "ค้นหาสินค้า" จึงมี role "searchbox"
  const searchBox = page.getByRole("searchbox", { name: "ค้นหาสินค้า" });
  // fill ล้างช่องแล้วใส่ข้อความทั้งก้อนในครั้งเดียว (วิธีมาตรฐานสำหรับกรอกช่อง)
  await searchBox.fill("หูฟัง");
  // press กดคีย์หนึ่งปุ่มบน element นั้น ที่นี่กด Enter เพื่อส่งการค้นหา
  await searchBox.press("Enter");
  await expect(page.getByText("พบสินค้า 1 รายการ")).toBeVisible();
  await expect(page.getByRole("link", { name: "หูฟังไร้สาย DN Buds" })).toBeVisible();
});


// ------------------------------------------------
// ตัวอย่างที่ 2: ล้างช่องค้นหาด้วย clear (clear + toHaveValue)
// ------------------------------------------------
test("หน้า /products ล้างช่องค้นหาแล้วช่องต้องว่าง", async ({ page }) => {
  await page.goto("/products");
  const searchBox = page.getByRole("searchbox", { name: "ค้นหาสินค้า" });
  await searchBox.fill("เมาส์");
  await expect(searchBox).toHaveValue("เมาส์");
  // clear ล้างค่าในช่องให้ว่าง
  await searchBox.clear();
  // toHaveValue("") ตรวจว่าช่องว่างจริง
  await expect(searchBox).toHaveValue("");
});


// ------------------------------------------------
// ข้อ 1: ค้นหา "เมาส์" ที่หน้า /products แล้วต้องพบสินค้า 1 รายการ และเห็นลิงก์ "เมาส์ไร้สาย"
// แนวทาง: เหมือนตัวอย่างที่ 1 เปลี่ยนคำค้นหา และชื่อลิงก์ที่ตรวจ
// ------------------------------------------------
test("หน้า /products ค้นหาเมาส์แล้วต้องพบสินค้า 1 รายการ", async ({ page }) => {
  await page.goto("/products");
  const searchBox = page.getByRole("searchbox", { name: "ค้นหาสินค้า" });
  await searchBox.fill("เมาส์");
  await searchBox.press("Enter");
  await expect(page.getByText("พบสินค้า 1 รายการ")).toBeVisible();
  // ตรวจลิงก์ชื่อสินค้าด้วยด้วย เพราะ "พบ 1 รายการ" อย่างเดียวไม่บอกว่าเป็นรายการไหน
  await expect(page.getByRole("link", { name: "เมาส์ไร้สาย" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: ค้นหาคำที่ไม่มีสินค้า ("กล้อง") แล้วต้องเห็นข้อความ "ไม่พบสินค้าที่ค้นหา"
// แนวทาง: ค้นหาแบบข้อ 1 แต่ตรวจข้อความ "ไม่พบสินค้าที่ค้นหา" ด้วย getByText
// ------------------------------------------------
test("หน้า /products ค้นหาคำที่ไม่มีแล้วต้องไม่พบสินค้า", async ({ page }) => {
  await page.goto("/products");
  const searchBox = page.getByRole("searchbox", { name: "ค้นหาสินค้า" });
  await searchBox.fill("กล้อง");
  await searchBox.press("Enter");
  // ทำไมตรวจข้อความนี้: เป็นสิ่งที่ผู้ใช้เห็นเมื่อค้นไม่เจอ (กรณีไม่พบก็ควรมี test)
  await expect(page.getByText("ไม่พบสินค้าที่ค้นหา")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 3: พิมพ์ "คีย์" ทีละตัวอักษรด้วย pressSequentially แล้วช่องต้องมีค่า "คีย์" และพบ "คีย์บอร์ดเครื่องกล"
// แนวทาง: pressSequentially("คีย์") พิมพ์ทีละตัวเหมือนคนพิมพ์จริง (fill ใส่ทีเดียว) ใช้เมื่อหน้าเว็บต้องตอบสนองทุกตัวอักษร
//        จากนั้นกด Enter ด้วย press("Enter") แล้วตรวจลิงก์ชื่อ "คีย์บอร์ดเครื่องกล"
// ------------------------------------------------
test("หน้า /products พิมพ์ทีละตัวอักษรแล้วต้องพบคีย์บอร์ด", async ({ page }) => {
  await page.goto("/products");
  const searchBox = page.getByRole("searchbox", { name: "ค้นหาสินค้า" });
  // ทำไมใช้ pressSequentially ที่นี่: เพื่อฝึก ปกติ fill ดีกว่า ใช้ตัวนี้เมื่อหน้าต้องรับ event ทุกตัวอักษร
  await searchBox.pressSequentially("คีย์");
  await expect(searchBox).toHaveValue("คีย์");
  await searchBox.press("Enter");
  await expect(page.getByRole("link", { name: "คีย์บอร์ดเครื่องกล" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: ใส่โค้ดส่วนลด DN10 ในตะกร้าแล้วต้องเห็นข้อความ "ใช้โค้ด DN10 แล้ว ลด 10%"
// แนวทาง: เตรียมของก่อน: ไปที่ /products แล้วกดปุ่ม "เพิ่มลงตะกร้า" ปุ่มแรก (.first()) ของสินค้า
//        แล้ว goto("/cart") กรอกช่อง getByLabel("โค้ดส่วนลด") ด้วย "DN10" กดปุ่ม "ใช้โค้ด"
//        ข้อความผลลัพธ์อยู่ใน role="status" ใช้ getByRole("status").filter({ hasText: "..." })
// ------------------------------------------------
test("หน้า /cart ใช้โค้ด DN10 แล้วต้องลด 10%", async ({ page }) => {
  // เตรียมของด้วยการกดบนหน้าเหมือนผู้ใช้จริง (ยังไม่ได้เรียนการเรียก API จึงไม่ข้ามขั้นนี้)
  await page.goto("/products");
  // .first() เพราะทุกการ์ดสินค้ามีปุ่มนี้ getByRole จึงเจอหลายตัว
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
  // รอข้อความยืนยันก่อนไปต่อ เพื่อให้แน่ใจว่าบันทึกลงตะกร้าเสร็จ (filter เพราะอาจมี status อื่นบนหน้า)
  await expect(page.getByRole("status").filter({ hasText: "ลงตะกร้าแล้ว" })).toBeVisible();

  await page.goto("/cart");
  await page.getByLabel("โค้ดส่วนลด").fill("DN10");
  await page.getByRole("button", { name: "ใช้โค้ด" }).click();
  await expect(page.getByRole("status").filter({ hasText: "ใช้โค้ด DN10 แล้ว ลด 10%" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 5: ใส่โค้ดผิด ("WRONG") ในตะกร้า แล้วต้องเห็น alert "โค้ดส่วนลดไม่ถูกต้อง"
// แนวทาง: เตรียมของและกรอกโค้ดแบบข้อ 4 แต่ใช้โค้ดที่ไม่มีอยู่จริง
//        ข้อความ error อยู่ใน role="alert" ให้ใช้ page.getByRole("alert").filter({ hasText: "โค้ดส่วนลดไม่ถูกต้อง" })
//        (ทำไมต้อง filter: อ่านหัวข้อ "role alert กับ route announcer" ใน README)
// ------------------------------------------------
test("หน้า /cart ใส่โค้ดผิดแล้วต้องเห็นข้อความ error", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "ลงตะกร้าแล้ว" })).toBeVisible();

  await page.goto("/cart");
  await page.getByLabel("โค้ดส่วนลด").fill("WRONG");
  await page.getByRole("button", { name: "ใช้โค้ด" }).click();
  // ทำไมต้อง filter: Next.js มี role="alert" ว่างๆ ทุกหน้า (route announcer) getByRole("alert") เดี่ยวๆ จึงเจอ 2 ตัว
  await expect(page.getByRole("alert").filter({ hasText: "โค้ดส่วนลดไม่ถูกต้อง" })).toBeVisible();
});
