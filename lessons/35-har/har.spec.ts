import { test, expect } from "@playwright/test";
import fs from "node:fs";

// ================================================
// บทที่ 35: บันทึกและเล่นซ้ำ network ด้วยไฟล์ HAR
// ฝึก: page.routeFromHAR (เล่นซ้ำ), notFound, update: true (บันทึก)
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// HAR (HTTP Archive) คือไฟล์ JSON ที่เก็บคำขอและคำตอบของ network
// ไฟล์ lessons/35-har/hars/products.har ถูกอัดมาจากแอปจริง (ตอนเปิด /products และ /products?category=books)
// มีคำตอบของ GET /api/products? และ GET /api/products?category=books อยู่ข้างใน
//
// หมายเหตุ: path ของไฟล์ HAR นับจากโฟลเดอร์ที่รัน test (ตอนเราใช้ pnpm test จากรากโปรเจกต์) ไม่ใช่จากโฟลเดอร์ของไฟล์นี้
// ไฟล์ที่อัดเองในแบบฝึกหัดตั้งชื่อลงท้าย .local.har (อยู่ใน .gitignore ไม่ถูก commit)
const HAR = "lessons/35-har/hars/products.har";


// ------------------------------------------------
// ตัวอย่างที่ 1: เล่นซ้ำรายการสินค้าจากไฟล์ HAR
// ------------------------------------------------
test("หน้า products: เล่นซ้ำรายการสินค้าจากไฟล์ HAR", async ({ page }) => {
  // routeFromHAR ต้องเรียกก่อน goto (เหมือน page.route)
  // url จำกัดให้ใช้ HAR เฉพาะคำขอที่ตรง pattern นี้ คำขออื่น (หน้าเว็บ, รูป, /api/cart ...) ไปถึง server จริงตามปกติ
  await page.routeFromHAR(HAR, { url: "**/api/products*" });

  await page.goto("/products");

  // ข้อมูลในไฟล์ HAR มีสินค้า 10 ชิ้น (เหมือนที่ server ตอบตอนอัด)
  await expect(page.getByText("พบสินค้า 10 รายการ")).toBeVisible();
  await expect(page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem")).toHaveCount(10);
});


// ------------------------------------------------
// ตัวอย่างที่ 2: คำขอที่ไม่มีในไฟล์ HAR จะถูก abort (ค่าเริ่มต้นของ notFound)
// ------------------------------------------------
test("หน้า products: คำขอที่ไม่อยู่ใน HAR ทำให้โหลดไม่สำเร็จ", async ({ page }) => {
  // ไม่ระบุ notFound = "abort": คำขอที่หาไม่เจอในไฟล์จะล้มเหลว
  await page.routeFromHAR(HAR, { url: "**/api/products*" });

  // ใน HAR ไม่มีคำตอบของ /api/products?q=... (เราไม่ได้อัดตอนค้นหาคำว่า "เมาส์")
  await page.goto("/products?q=เมาส์");

  // หน้าจึงแสดงว่าโหลดไม่สำเร็จ (ใช้ filter กับ alert เหมือนบท 33)
  await expect(page.getByRole("alert").filter({ hasText: "โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: เล่นซ้ำ HAR แล้วตรวจชื่อสินค้าชิ้นแรกกับชิ้นสุดท้ายในลำดับ "แนะนำ"
// แนวทาง: เหมือนตัวอย่างที่ 1 รอ "พบสินค้า 10 รายการ" แล้วตรวจว่า heading ในรายการสินค้า
//        ชิ้นแรกคือ "หูฟังไร้สาย DN Buds" (first()) และชิ้นสุดท้ายคือ "สมุดโน้ตลายจุด" (last())
// ------------------------------------------------
test.fixme("หน้า products: เล่นซ้ำ HAR แล้วตรวจชื่อสินค้าแรกและสุดท้าย", async ({ page }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: เล่นซ้ำคำตอบของหมวดหนังสือที่อยู่ใน HAR
// แนวทาง: routeFromHAR(HAR, { url: "**/api/products*" }) แล้ว goto("/products?category=books")
//        ตรวจ "พบสินค้า 3 รายการ" และว่ารายการสินค้ามีข้อความ "หนังสือ TypeScript เบื้องต้น"
// ------------------------------------------------
test.fixme("หน้า products: เล่นซ้ำคำตอบของหมวดหนังสือจาก HAR", async ({ page }) => {
  // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: ให้คำขอที่ไม่อยู่ใน HAR ไปถึง server จริงด้วย notFound: "fallback"
// แนวทาง: routeFromHAR(HAR, { url: "**/api/products*", notFound: "fallback" }) แล้ว goto("/products?q=เมาส์")
//        คราวนี้ไม่มี alert แต่หน้าแสดง "พบสินค้า 1 รายการ" และมีสินค้า "เมาส์ไร้สาย" (มาจาก server จริง)
// ------------------------------------------------
test.fixme("หน้า products: คำขอที่ไม่อยู่ใน HAR ไปถึง server จริงเมื่อใช้ fallback", async ({ page }) => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 4: อัด HAR ของคุณเองด้วย update: true
// แนวทาง: ตั้งชื่อไฟล์ const MY_HAR = `lessons/35-har/hars/my-products-${testInfo.parallelIndex}.local.har`
//        (testInfo คือ argument ตัวที่สองของ test ใส่ parallelIndex เพื่อไม่ให้ชื่อชนกันถ้ารันหลายรอบพร้อมกันด้วย --repeat-each)
//        page.routeFromHAR(MY_HAR, { url: "**/api/products*", update: true, updateContent: "embed" }) ก่อน goto
//        goto("/products") รอ "พบสินค้า 10 รายการ" แล้วเรียก await page.context().close() (ไฟล์ถูกเขียนตอน context ปิด)
//        อ่านไฟล์ด้วย JSON.parse(fs.readFileSync(MY_HAR, "utf8")) แล้วตรวจว่า log.entries มี 1 รายการ และ url มี "/api/products"
// ------------------------------------------------
test.fixme("หน้า products: อัด HAR ของตัวเองด้วย update true", async ({ page }, testInfo) => {
  // 👉 เขียน test ของข้อ 4 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 5: แก้ไฟล์ HAR แล้วเล่นซ้ำ เพื่อพิสูจน์ว่าข้อมูลมาจากไฟล์จริงๆ
// แนวทาง: อ่าน HAR (JSON.parse(fs.readFileSync(HAR, "utf8"))) หา entry ที่ request.url ลงท้ายด้วย "/api/products?"
//        ข้อความคำตอบอยู่ใน entry.response.content.text (เป็น JSON ในรูปข้อความ) แปลงด้วย JSON.parse แก้ price ของ
//        products[0] เป็น 1 แล้ว JSON.stringify กลับ เขียนไฟล์ใหม่ชื่อ lessons/35-har/hars/edited-<parallelIndex>.local.har ด้วย fs.writeFileSync
//        (ใส่ ${testInfo.parallelIndex} ในชื่อไฟล์เหมือนข้อ 4)
//        เล่นซ้ำไฟล์ใหม่นั้น goto("/products") ตรวจว่าการ์ดหูฟังไร้สาย DN Buds แสดง "1 บาท"
// ------------------------------------------------
test.fixme("หน้า products: แก้ไฟล์ HAR แล้วเล่นซ้ำ ราคาต้องเปลี่ยนตาม", async ({ page }, testInfo) => {
  // 👉 เขียน test ของข้อ 5 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
