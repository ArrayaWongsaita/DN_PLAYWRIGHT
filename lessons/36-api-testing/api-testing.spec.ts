import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 36: ทดสอบ API ตรงๆ ด้วย fixture request
// ฝึก: request.get/post/patch/delete, expect(res).toBeOK(), status 400/401/403/404/409, login ผ่าน API
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// test ในบทนี้ "ไม่เปิดหน้าเว็บ" เลย: fixture request ส่ง HTTP ถึง server ของแอปโดยตรง (เหมือน Supertest ในบท 16-17 ของ Jest)
// path ที่ขึ้นต้นด้วย / ถูกต่อท้าย baseURL ใน config (http://localhost:3100) ให้เอง
// แต่ละ test ได้ request context ใหม่ จึงมี session (cookie dn_sid) และตะกร้าเป็นของตัวเอง ไม่ปนกัน


// ------------------------------------------------
// ตัวอย่างที่ 1: GET ตรวจ status และ body
// ------------------------------------------------
test("GET /api/health และ /api/products ตอบสำเร็จ", async ({ request }) => {
  // ส่ง GET ไปที่ /api/health (ต้อง await เพราะเป็นการส่งคำขอจริง)
  const health = await request.get("/api/health");
  // toBeOK ผ่านเมื่อ status อยู่ในช่วง 200-299 (ถ้าไม่ผ่านจะแสดง status และ body ให้ดู)
  await expect(health).toBeOK();
  // status() เป็นเมธอด (ไม่ใช่ property เหมือน supertest) ส่วน json() อ่าน body เป็น object และต้อง await
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: "ok", app: "dn-shop" });

  // รายการสินค้า: ใช้ params ใส่ query string แทนการต่อสตริงเอง
  const res = await request.get("/api/products", { params: { category: "books" } });
  await expect(res).toBeOK();
  const body = await res.json();
  // หมวดหนังสือมี 3 ชิ้น และ total ตรงกับจำนวนใน products
  expect(body.total).toBe(3);
  expect(body.products).toHaveLength(3);
  // ตรวจเฉพาะบาง field ด้วย toMatchObject (ไม่ต้องเขียนครบทุก field)
  expect(body.products[0]).toMatchObject({ id: "p08", name: "หนังสือ TypeScript เบื้องต้น", price: 390 });
});


// ------------------------------------------------
// ตัวอย่างที่ 2: POST ส่ง body แล้วดูว่า cookie ถูกเก็บไว้ใน request context
// ------------------------------------------------
test("POST /api/cart เพิ่มสินค้า แล้ว GET /api/cart เห็นสินค้านั้น", async ({ request }) => {
  // data: object ถูกแปลงเป็น JSON และตั้ง content-type: application/json ให้อัตโนมัติ
  const add = await request.post("/api/cart", { data: { productId: "p03", quantity: 2 } });
  // เพิ่มสำเร็จ server ตอบ 201 (Created) ไม่ใช่ 200
  expect(add.status()).toBe(201);

  // คำขอแรกทำให้ server ตั้ง cookie dn_sid (session) request context เก็บไว้และส่งกลับให้ในคำขอถัดไปเอง
  // จึงเห็นตะกร้าเดียวกัน (ถ้าไม่มี cookie จะได้ตะกร้าว่างของ session ใหม่)
  const cart = await request.get("/api/cart");
  await expect(cart).toBeOK();
  const body = await cart.json();
  expect(body.count).toBe(2);
  expect(body.subtotal).toBe(1180); // เมาส์ไร้สาย 590 x 2
  expect(body.items[0]).toMatchObject({ productId: "p03", name: "เมาส์ไร้สาย", quantity: 2 });
});


// ------------------------------------------------
// ข้อ 1: GET สินค้าชิ้นเดียว
// แนวทาง: เหมือนตัวอย่างที่ 1 แต่เรียก request.get("/api/products/p02") ตรวจว่า toBeOK แล้วตรวจ body ด้วย toMatchObject
//        ว่า id เป็น "p02", name เป็น "คีย์บอร์ดเครื่องกล", price เป็น 2490 และ stock เป็น 8
// ------------------------------------------------
test.fixme("GET /api/products/p02 ได้ข้อมูลคีย์บอร์ดเครื่องกล", async ({ request }) => {
  // 👉 เขียน test ของข้อ 1 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 2: GET สินค้าที่ไม่มี ต้องได้ 404
// แนวทาง: request.get("/api/products/p99") ตรวจ res.status() เป็น 404 และ res.ok() เป็น false
//        ตรวจ body ว่าเท่ากับ { message: "ไม่พบสินค้า" } (toEqual) แล้วลองอีกอัน:
//        request.get("/api/products", { params: { q: "ไร้สาย" } }) ตรวจ total เป็น 2
// ------------------------------------------------
test.fixme("GET /api/products/p99 ได้ 404 และข้อความไม่พบสินค้า", async ({ request }) => {
  // 👉 เขียน test ของข้อ 2 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 3: POST /api/cart ด้วยข้อมูลที่ไม่ผ่าน ต้องได้ 400, 404 และ 409
// แนวทาง: ส่ง data สามแบบ ตรวจ status และ body.message:
//        { productId: "p03", quantity: 0 }  -> 400 "จำนวนไม่ถูกต้อง"
//        { productId: "p99" }               -> 404 "ไม่พบสินค้า"
//        { productId: "p05" }               -> 409 "สินค้าในสต็อกไม่พอ" (หมวกแก๊ป p05 สต็อกเป็น 0)
//        จากนั้น GET /api/cart ตรวจว่า count เป็น 0 (คำขอที่ล้มเหลวต้องไม่เปลี่ยนตะกร้า)
// ------------------------------------------------
test.fixme("POST /api/cart ข้อมูลไม่ถูกต้องได้ 400, 404 และ 409", async ({ request }) => {
  // 👉 เขียน test ของข้อ 3 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 4: PATCH และ DELETE รายการในตะกร้า
// แนวทาง: POST /api/cart เพิ่ม p01 จำนวน 1 แล้ว request.patch("/api/cart/p01", { data: { quantity: 3 } })
//        ตรวจ 200 และ subtotal เป็น 3870 จากนั้น request.delete("/api/cart/p01") ตรวจ 200 และ count เป็น 0
//        แล้ว DELETE ซ้ำอีกครั้งตรวจว่าได้ 404 กับข้อความ "ไม่พบสินค้าในตะกร้า"
// ------------------------------------------------
test.fixme("PATCH เปลี่ยนจำนวน และ DELETE ลบสินค้าออกจากตะกร้า", async ({ request }) => {
  // 👉 เขียน test ของข้อ 4 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 5: login ผ่าน API แล้ว cookie ค้างอยู่ใน request context
// แนวทาง: POST /api/auth/login ด้วย { email: "user@dnshop.test", password: "wrong" } ตรวจ 401 และข้อความ "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
//        แล้ว GET /api/auth/me ตรวจว่ายังได้ 401 (ยังไม่ login)
//        จากนั้น login ด้วยรหัส "password123" ตรวจ 200 แล้ว GET /api/auth/me ตรวจ 200 และ body.user.email เป็น "user@dnshop.test"
//        เรียก await request.storageState() ตรวจว่า cookies มี name "dn_auth" (cookie login ที่เก็บไว้)
//        สุดท้าย POST /api/auth/logout ตรวจ 204 และ GET /api/auth/me กลับมาเป็น 401
// ------------------------------------------------
test.fixme("login ผ่าน API แล้ว /api/auth/me ตอบ 200 จนกว่าจะ logout", async ({ request }) => {
  // 👉 เขียน test ของข้อ 5 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});


// ------------------------------------------------
// ข้อ 6: สิทธิ์ของแอดมิน: 401 -> 403 -> 201 -> 204
// แนวทาง: ใช้ข้อมูลสินค้า const newProduct = { name: "สินค้าทดสอบ API", price: 100, category: "it", stock: 3 }
//        ยังไม่ login: POST /api/products ตรวจ 401 "กรุณาเข้าสู่ระบบ"
//        login เป็น user@dnshop.test (password123): POST อีกครั้งตรวจ 403 "ไม่มีสิทธิ์"
//        login เป็น admin@dnshop.test (admin123) ใน request เดียวกัน: POST ตรวจ 201 และ body.id เป็น "p11"
//        ส่ง { name: "", price: -1 } ตรวจ 400 "ข้อมูลสินค้าไม่ครบ" แล้ว DELETE /api/products/p11 ตรวจ 204
//        แล้ว GET /api/products/p11 ตรวจ 404 (ข้อมูลอยู่ใน session ของ test นี้เท่านั้น ไม่กระทบ test อื่น)
// ------------------------------------------------
test.fixme("แอดมินเพิ่มและลบสินค้าได้ ส่วนผู้ใช้ทั่วไปทำไม่ได้", async ({ request }) => {
  // 👉 เขียน test ของข้อ 6 ตรงนี้ แล้วเปลี่ยน test.fixme เป็น test
});
