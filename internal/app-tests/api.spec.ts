import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";
import { baseURL } from "../../playwright.shared";

async function loginAs(request: APIRequestContext, email: string, password: string) {
  return request.post("/api/auth/login", { data: { email, password } });
}

test("รายการสินค้ามี 10 ชิ้นเรียงแบบแนะนำ", async ({ request }) => {
  const body = await (await request.get("/api/products")).json();
  expect(body.total).toBe(10);
  expect(body.products.map((p: { id: string }) => p.id)).toEqual([
    "p01", "p04", "p07", "p02", "p03", "p05", "p06", "p08", "p09", "p10",
  ]);
});

test("ค้นหาคำว่า หนังสือ ได้ p08 p09", async ({ request }) => {
  const body = await (await request.get("/api/products?q=" + encodeURIComponent("หนังสือ"))).json();
  expect(body.products.map((p: { id: string }) => p.id)).toEqual(["p08", "p09"]);
});

test("กรองหมวด books เรียงราคาต่ำไปสูง", async ({ request }) => {
  const body = await (await request.get("/api/products?category=books&sort=price-asc")).json();
  expect(body.products.map((p: { id: string }) => p.id)).toEqual(["p10", "p08", "p09"]);
});

test("สินค้าที่ไม่มีได้ 404", async ({ request }) => {
  const res = await request.get("/api/products/p99");
  expect(res.status()).toBe(404);
  expect(await res.json()).toEqual({ message: "ไม่พบสินค้า" });
});

test("เพิ่มสินค้าหมด stock ได้ 409", async ({ request }) => {
  const res = await request.post("/api/cart", { data: { productId: "p05" } });
  expect(res.status()).toBe(409);
  expect(await res.json()).toEqual({ message: "สินค้าในสต็อกไม่พอ" });
});

test("ตะกร้าคิดยอดพร้อมคูปอง", async ({ request }) => {
  await request.post("/api/cart", { data: { productId: "p01" } });
  await request.post("/api/cart", { data: { productId: "p04", quantity: 2 } });
  const cart = await (await request.get("/api/cart")).json();
  expect(cart.subtotal).toBe(1870);
  const res = await request.post("/api/cart/coupon", { data: { code: "DN10" } });
  expect(res.status()).toBe(200);
  const summary = await res.json();
  expect(summary).toMatchObject({ subtotal: 1870, discount: 187, total: 1683, count: 3, coupon: "DN10" });
});

test("คูปองผิดได้ 400", async ({ request }) => {
  const res = await request.post("/api/cart/coupon", { data: { code: "WRONG" } });
  expect(res.status()).toBe(400);
  expect(await res.json()).toEqual({ message: "โค้ดส่วนลดไม่ถูกต้อง" });
});

test("สั่งซื้อแล้วได้ DN-0001 และตะกร้าว่าง", async ({ request }) => {
  await request.post("/api/cart", { data: { productId: "p01" } });
  await request.post("/api/cart", { data: { productId: "p04", quantity: 2 } });
  const cart = await (await request.post("/api/cart/coupon", { data: { code: "DN10" } })).json();
  const res = await request.post("/api/orders", {
    data: {
      customer: { name: "สมชาย", address: "1 ถนนสุขุมวิท", phone: "0812345678" },
      shipping: "standard",
      payment: "cod",
    },
  });
  expect(res.status()).toBe(201);
  const order = await res.json();
  expect(order.id).toBe("DN-0001");
  expect(order.shippingFee).toBe(50);
  expect(order.total).toBe(cart.total + 50);

  expect((await (await request.get("/api/cart")).json()).count).toBe(0);
  expect((await (await request.get("/api/products/p01")).json()).stock).toBe(14);
});

test("สั่งซื้อโดยตะกร้าว่างได้ 400", async ({ request }) => {
  const res = await request.post("/api/orders", {
    data: { customer: { name: "ก", address: "ข", phone: "1" }, shipping: "standard", payment: "cod" },
  });
  expect(res.status()).toBe(400);
  expect(await res.json()).toEqual({ message: "ตะกร้าว่าง" });
});

test("ใบเสร็จดาวน์โหลดเป็นไฟล์", async ({ request }) => {
  await request.post("/api/cart", { data: { productId: "p03" } });
  await request.post("/api/orders", {
    data: {
      customer: { name: "สมชาย", address: "1 ถนนสุขุมวิท", phone: "0812345678" },
      shipping: "express",
      payment: "transfer",
    },
  });
  const res = await request.get("/api/orders/DN-0001/receipt");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-disposition"]).toContain("receipt-DN-0001.txt");
  expect(await res.text()).toMatch(/^DN Shop - ใบเสร็จ/);
  expect((await request.get("/api/orders/DN-9999/receipt")).status()).toBe(404);
});

test("login ผิดได้ 401", async ({ request }) => {
  const res = await loginAs(request, "user@dnshop.test", "wrong");
  expect(res.status()).toBe(401);
  expect(await res.json()).toEqual({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  expect((await request.get("/api/auth/me")).status()).toBe(401);
});

test("login ถูกแล้ว me คืนผู้ใช้", async ({ request }) => {
  const res = await loginAs(request, "user@dnshop.test", "password123");
  expect(res.status()).toBe(200);
  const me = await (await request.get("/api/auth/me")).json();
  expect(me).toEqual({
    user: { id: "u1", name: "สมชาย ใจดี", email: "user@dnshop.test", role: "user" },
  });
  expect(JSON.stringify(me)).not.toContain("password");
  await request.post("/api/auth/logout");
  expect((await request.get("/api/auth/me")).status()).toBe(401);
});

test("สมัครสมาชิกแล้ว login ให้ทันที และอีเมลซ้ำได้ 409", async ({ request }) => {
  const res = await request.post("/api/auth/register", {
    data: { name: "ทดสอบ", email: "new@example.com", password: "secret123" },
  });
  expect(res.status()).toBe(201);
  expect((await (await request.get("/api/auth/me")).json()).user.email).toBe("new@example.com");
  const dup = await request.post("/api/auth/register", {
    data: { name: "ทดสอบ", email: "user@dnshop.test", password: "secret123" },
  });
  expect(dup.status()).toBe(409);
  const bad = await request.post("/api/auth/register", {
    data: { name: "ทดสอบ", email: "not-an-email", password: "secret123" },
  });
  expect(bad.status()).toBe(400);
  expect((await bad.json()).field).toBe("email");
});

test("user ทั่วไปเพิ่มสินค้าไม่ได้ 403", async ({ request }) => {
  const input = { name: "ของใหม่", price: 100, category: "home", stock: 3 };
  expect((await request.post("/api/products", { data: input })).status()).toBe(401);
  await loginAs(request, "user@dnshop.test", "password123");
  const res = await request.post("/api/products", { data: input });
  expect(res.status()).toBe(403);
  expect(await res.json()).toEqual({ message: "ไม่มีสิทธิ์" });
});

test("admin เพิ่มสินค้าได้ p11 201", async ({ request }) => {
  await loginAs(request, "admin@dnshop.test", "admin123");
  const res = await request.post("/api/products", {
    data: { name: "ของใหม่", price: 100, category: "home", stock: 3 },
  });
  expect(res.status()).toBe(201);
  expect((await res.json()).id).toBe("p11");
  expect((await request.delete("/api/products/p11")).status()).toBe(204);
  expect((await request.get("/api/products/p11")).status()).toBe(404);
});

test("อัปโหลดอวาตาร์ต้อง login และรับเฉพาะ PNG/JPG", async ({ request }) => {
  const png = { name: "me.png", mimeType: "image/png", buffer: Buffer.from("x") };
  expect((await request.post("/api/account/avatar", { multipart: { avatar: png } })).status()).toBe(401);
  await loginAs(request, "user@dnshop.test", "password123");
  const ok = await request.post("/api/account/avatar", { multipart: { avatar: png } });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toEqual({ fileName: "me.png" });
  const bad = await request.post("/api/account/avatar", {
    multipart: { avatar: { name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("x") } },
  });
  expect(bad.status()).toBe(400);
  expect(await bad.json()).toEqual({ message: "รองรับเฉพาะไฟล์ PNG หรือ JPG ขนาดไม่เกิน 1MB" });
});

test("ตะกร้าของสอง context แยกกัน", async () => {
  const a = await pwRequest.newContext({ baseURL });
  const b = await pwRequest.newContext({ baseURL });
  try {
    await Promise.all([
      a.post("/api/cart", { data: { productId: "p01" } }),
      b.post("/api/cart", { data: { productId: "p03", quantity: 2 } }),
    ]);
    const [cartA, cartB] = await Promise.all([
      a.get("/api/cart").then((r) => r.json()),
      b.get("/api/cart").then((r) => r.json()),
    ]);
    expect(cartA.count).toBe(1);
    expect(cartA.items.map((i: { productId: string }) => i.productId)).toEqual(["p01"]);
    expect(cartB.count).toBe(2);
    expect(cartB.items.map((i: { productId: string }) => i.productId)).toEqual(["p03"]);
  } finally {
    await a.dispose();
    await b.dispose();
  }
});

test("delay ทำให้ช้าลง", async ({ request }) => {
  const start = Date.now();
  const res = await request.get("/api/products?delay=500");
  expect(res.status()).toBe(200);
  expect(Date.now() - start).toBeGreaterThanOrEqual(450);
});

test("export CSV", async ({ request }) => {
  const res = await request.get("/api/products/export");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  expect(res.headers()["content-disposition"]).toContain("products.csv");
  const lines = (await res.text()).trim().split("\n");
  expect(lines[0]).toBe("id,name,category,price,stock");
  expect(lines).toHaveLength(11);
});
