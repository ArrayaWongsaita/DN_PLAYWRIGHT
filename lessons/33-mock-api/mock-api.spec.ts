import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 33: จำลอง API ด้วย page.route และ route.fulfill
// ฝึก: page.route, route.fulfill, ตั้ง route ก่อน goto, จำลองข้อมูลว่าง / error 500 / สินค้าปลอม
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// หน้า /products ดึงรายการสินค้าจาก /api/products "ฝั่ง browser" (fetch หลังหน้าโหลด)
// เราจึงดักคำขอนั้นแล้วตอบข้อมูลที่เราอยากได้แทน server จริงได้
// ข้อสำคัญ: ต้องตั้ง page.route ก่อน page.goto เสมอ ไม่งั้นหน้าส่งคำขอไปแล้วโดยที่ยังไม่มีใครดัก

// สินค้าปลอมที่ไม่มีอยู่ในข้อมูล seed ของร้าน (รูปร่างข้อมูลตรงกับที่ /api/products ตอบจริง)
const fakeProduct = {
  id: "p99",
  name: "สินค้าทดลองจาก mock",
  category: "it",
  price: 999,
  stock: 5,
  featured: false,
  description: "สินค้านี้ไม่มีใน server จริง",
  image: "/products/default.svg",
};


// ------------------------------------------------
// ตัวอย่างที่ 1: จำลองว่าไม่มีสินค้าเลย
// ------------------------------------------------
test("หน้า products: API ตอบรายการว่าง ต้องแสดงไม่พบสินค้า", async ({ page }) => {
  // ตั้ง route ก่อน goto: ทุกคำขอที่ URL ตรงกับ pattern นี้จะเข้ามาที่ฟังก์ชันของเรา
  // ** หมายถึงโดเมน/พาธนำหน้าอะไรก็ได้, * ท้าย pattern ครอบคลุม query string เช่น ?q=...
  await page.route("**/api/products*", async (route) => {
    // fulfill = ตอบเองโดยไม่ส่งคำขอไปถึง server จริง ใส่ json แล้ว Playwright ตั้ง content-type เป็น JSON ให้
    await route.fulfill({ json: { products: [], total: 0 } });
  });

  // เปิดหน้า (ตอนนี้ fetch ของหน้าจะได้คำตอบจากเรา)
  await page.goto("/products");

  // หน้าแสดงข้อความตามที่ UI ออกแบบไว้เมื่อรายการว่าง
  await expect(page.getByText("ไม่พบสินค้าที่ค้นหา")).toBeVisible();
  await expect(page.getByText("พบสินค้า 0 รายการ")).toBeVisible();
  // ไม่มีการ์ดสินค้าเลย (listitem ภายในรายการสินค้า)
  await expect(page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem")).toHaveCount(0);
});


// ------------------------------------------------
// ตัวอย่างที่ 2: จำลอง server ล่ม (HTTP 500)
// ------------------------------------------------
test("หน้า products: API ตอบ 500 ต้องแสดง alert และปุ่มลองใหม่", async ({ page }) => {
  await page.route("**/api/products*", async (route) => {
    // status 500 = server error จำลอง body เป็น JSON ตามรูปแบบ error ของแอป
    await route.fulfill({ status: 500, json: { message: "เกิดข้อผิดพลาดภายในระบบ" } });
  });

  await page.goto("/products");

  // Next.js ใส่ role="alert" ว่างๆ ไว้ทุกหน้า (route announcer, ดูบท 07) จึงต้อง filter ด้วยข้อความเสมอ
  const alert = page.getByRole("alert").filter({ hasText: "โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่" });
  await expect(alert).toBeVisible();
  // ปุ่มลองใหม่อยู่ใน alert เดียวกัน
  await expect(alert.getByRole("button", { name: "ลองใหม่" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: จำลองให้ API ตอบสินค้าปลอมหนึ่งชิ้น
// แนวทาง: เหมือนตัวอย่างที่ 1 แต่ fulfill ด้วย json: { products: [fakeProduct], total: 1 } (ตัวแปร fakeProduct อยู่ด้านบนไฟล์)
//        goto("/products") แล้วตรวจว่าเห็นลิงก์ชื่อ "สินค้าทดลองจาก mock" และข้อความ "999 บาท" และ "พบสินค้า 1 รายการ"
// ------------------------------------------------
test("หน้า products: แสดงสินค้าปลอมที่ไม่มีใน seed", async ({ page }) => {
  // ตั้ง route ก่อน goto (ถ้าตั้งทีหลัง fetch ของหน้าไปถึง server จริงไปแล้ว)
  await page.route("**/api/products*", async (route) => {
    // ตอบสินค้าปลอมชิ้นเดียว total ต้องตรงกับจำนวนใน products เพื่อให้ข้อมูลสมจริง
    await route.fulfill({ json: { products: [fakeProduct], total: 1 } });
  });

  await page.goto("/products");

  // ชื่อสินค้าเป็นลิงก์ใน h2 ของการ์ด (ดูตาราง UI ใน README) ใช้ role link
  await expect(page.getByRole("link", { name: "สินค้าทดลองจาก mock" })).toBeVisible();
  // ราคาแสดงรูปแบบ "999 บาท" (formatBaht) ตรวจในรายการสินค้า
  await expect(page.getByRole("list", { name: "รายการสินค้า" })).toContainText("999 บาท");
  await expect(page.getByText("พบสินค้า 1 รายการ")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 2: จำลอง HTTP 503 (server ไม่พร้อม)
// แนวทาง: เหมือนตัวอย่างที่ 2 แต่ใช้ status: 503 ตรวจ alert "โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่"
//        แล้วตรวจเพิ่มว่าหน้าไม่แสดงข้อความ "พบสินค้า" (not.toBeVisible) เพราะโหลดไม่สำเร็จ
// ------------------------------------------------
test("หน้า products: API ตอบ 503 ต้องแสดง alert", async ({ page }) => {
  await page.route("**/api/products*", async (route) => {
    // หน้าเว็บดูแค่ว่า status ไม่ ok (>= 400) ไม่ว่า 500 หรือ 503 ก็เข้าทางเดียวกัน
    await route.fulfill({ status: 503, json: { message: "ระบบกำลังปรับปรุง" } });
  });

  await page.goto("/products");

  const alert = page.getByRole("alert").filter({ hasText: "โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่" });
  await expect(alert).toBeVisible();
  // เมื่อ alert ขึ้นแล้ว แสดงว่าหน้าจบการโหลด (state เป็น error) ข้อความ "พบสินค้า" จึงไม่ควรมี
  // ตรวจ "ไม่มี" หลังจากรอ alert แล้ว เพื่อไม่ให้ผ่านเพราะหน้ายังโหลดไม่เสร็จ
  await expect(page.getByText("พบสินค้า")).toHaveCount(0);
});


// ------------------------------------------------
// ข้อ 3: ตอบให้ต่างกันตามคำค้นหา (อ่าน query จาก URL ของคำขอ)
// แนวทาง: ใน handler อ่าน URL ด้วย new URL(route.request().url()).searchParams.get("q")
//        ถ้า q เป็น "เมาส์" ให้ fulfill ด้วยสินค้าปลอม 1 ชิ้น ถ้าไม่ใช่ให้ fulfill ด้วย products ว่าง
//        เปิด /products?q=เมาส์ แล้วตรวจว่าเจอสินค้าปลอม (ลอง ?q=อื่น ด้วยก็ได้ ควรเจอ "ไม่พบสินค้าที่ค้นหา")
// ------------------------------------------------
test("หน้า products: ตอบตามคำค้นหาในคำขอ", async ({ page }) => {
  await page.route("**/api/products*", async (route) => {
    // route.request() คือคำขอที่ถูกดัก ดึง URL ออกมาแล้วอ่านพารามิเตอร์ q
    const q = new URL(route.request().url()).searchParams.get("q");
    // ถ้าค้นหา "เมาส์" ตอบสินค้าปลอม ไม่งั้นตอบรายการว่าง
    const products = q === "เมาส์" ? [fakeProduct] : [];
    await route.fulfill({ json: { products, total: products.length } });
  });

  // หน้าอ่าน ?q จาก URL แล้วส่งต่อให้ API (ส่งผ่าน encodeURIComponent ให้เองตอน fetch)
  await page.goto("/products?q=เมาส์");
  await expect(page.getByRole("link", { name: "สินค้าทดลองจาก mock" })).toBeVisible();

  // เปลี่ยนคำค้นหาในหน้า: ครั้งนี้ handler เห็น q อื่น จึงตอบรายการว่าง
  await page.getByLabel("ค้นหาสินค้า").fill("คีย์บอร์ด");
  await page.getByLabel("ค้นหาสินค้า").press("Enter");
  await expect(page.getByText("ไม่พบสินค้าที่ค้นหา")).toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: พังครั้งแรก ครั้งที่สองใช้ server จริง แล้วกด "ลองใหม่"
// แนวทาง: ประกาศ let calls = 0 นอก handler ใน handler ทำ calls += 1 ก่อน แล้วถ้า calls === 1 ให้ fulfill status 500
//        ไม่งั้นเรียก await route.fallback() เพื่อปล่อยคำขอไปถึง server จริง
//        เปิดหน้า ตรวจ alert แล้วกดปุ่ม "ลองใหม่" ตรวจว่ารายการแสดง "พบสินค้า 10 รายการ"
// ------------------------------------------------
test("หน้า products: กดลองใหม่แล้วโหลดสำเร็จ", async ({ page }) => {
  // ตัวนับอยู่นอก handler เพื่อให้จำค่าข้ามหลายคำขอ
  let calls = 0;
  await page.route("**/api/products*", async (route) => {
    calls += 1;
    if (calls === 1) {
      // คำขอแรก: จำลอง server พัง
      await route.fulfill({ status: 500, json: { message: "เกิดข้อผิดพลาดภายในระบบ" } });
    } else {
      // คำขอถัดไป: ไม่ตอบเอง ส่งต่อไปที่ server จริง (fallback = ส่งต่อให้ handler ตัวถัดไป ถ้าไม่มีก็ไปที่ network)
      await route.fallback();
    }
  });

  await page.goto("/products");
  const alert = page.getByRole("alert").filter({ hasText: "โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่" });
  await expect(alert).toBeVisible();

  // กด "ลองใหม่": หน้าส่งคำขอครั้งที่สอง ซึ่งผ่านไปถึง server จริง
  await alert.getByRole("button", { name: "ลองใหม่" }).click();
  await expect(page.getByText("พบสินค้า 10 รายการ")).toBeVisible();
  await expect(alert).toBeHidden();
});


// ------------------------------------------------
// ข้อ 5: พิสูจน์ว่าหน้ารายละเอียดสินค้า mock ไม่ได้
// แนวทาง: ตั้ง route "**/api/products/**" ให้ fulfill สินค้าปลอม (นับจำนวนครั้งที่ handler ถูกเรียกด้วยตัวแปร)
//        เปิด /products/p01 แล้วตรวจว่า h1 ยังเป็น "หูฟังไร้สาย DN Buds" (ข้อมูลจริง) และ handler ถูกเรียก 0 ครั้ง
//        เหตุผลอยู่ในหัวข้อ "ทำไมหน้ารายละเอียดสินค้า mock ไม่ได้" ใน README
// ------------------------------------------------
test("หน้ารายละเอียดสินค้า: route ไม่มีผลเพราะ render ฝั่ง server", async ({ page }) => {
  let calls = 0;
  // pattern "**/api/products/**" ตรงกับ /api/products/p01 (ถ้ามีใครเรียก)
  await page.route("**/api/products/**", async (route) => {
    calls += 1;
    await route.fulfill({ json: { ...fakeProduct, id: "p01" } });
  });

  await page.goto("/products/p01");

  // หน้านี้ render ที่ server: HTML ที่ได้มามีชื่อสินค้าจริงอยู่แล้ว ไม่มี fetch จาก browser ให้ดัก
  await expect(page.getByRole("heading", { level: 1, name: "หูฟังไร้สาย DN Buds" })).toBeVisible();
  // handler ไม่เคยถูกเรียก (เช็กหลังเห็น h1 แล้ว ซึ่งแปลว่าหน้าโหลดเสร็จ)
  expect(calls).toBe(0);
});
