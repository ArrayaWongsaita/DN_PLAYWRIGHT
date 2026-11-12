import { test, expect, type Page } from "@playwright/test";

const alertWith = (page: Page, text: string) => page.getByRole("alert").filter({ hasText: text });

async function login(page: Page, email = "user@dnshop.test", password = "password123", next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByLabel("อีเมล").fill(email);
  await page.getByLabel("รหัสผ่าน").fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test("ปุ่ม login disabled จนกรอกครบ", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle("เข้าสู่ระบบ | DN Shop");
  await expect(page.getByRole("heading", { level: 1, name: "เข้าสู่ระบบ" })).toBeVisible();
  const submit = page.getByRole("button", { name: "เข้าสู่ระบบ" });
  await expect(submit).toBeDisabled();
  await page.getByLabel("อีเมล").fill("user@dnshop.test");
  await expect(submit).toBeDisabled();
  await page.getByLabel("รหัสผ่าน").fill("password123");
  await expect(submit).toBeEnabled();
  await expect(page.getByRole("link", { name: "สมัครสมาชิก" })).toBeVisible();
});

test("login ผิดแสดง alert", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("user@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("wrong-password");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(alertWith(page, "อีเมลหรือรหัสผ่านไม่ถูกต้อง")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("login แล้วไปบัญชีของฉันและ header เปลี่ยน", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/account$/);
  await expect(page).toHaveTitle("บัญชีของฉัน | DN Shop");
  await expect(page.getByRole("heading", { level: 1, name: "บัญชีของฉัน" })).toBeVisible();
  await expect(page.getByText("ชื่อ: สมชาย ใจดี")).toBeVisible();
  await expect(page.getByText("อีเมล: user@dnshop.test")).toBeVisible();
  await expect(page.getByText("สิทธิ์: ผู้ใช้ทั่วไป")).toBeVisible();
  const nav = page.getByRole("navigation", { name: "เมนูหลัก" });
  await expect(nav.getByRole("link", { name: "บัญชีของฉัน" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "ออกจากระบบ" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "เข้าสู่ระบบ" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "จัดการสินค้า" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "ประวัติคำสั่งซื้อ" })).toBeVisible();
  await expect(page.getByText("ยังไม่มีคำสั่งซื้อ")).toBeVisible();
});

test("next พากลับหน้าเดิม", async ({ page }) => {
  await login(page, "user@dnshop.test", "password123", "/products");
  await expect(page).toHaveURL(/\/products$/);
});

test("logout", async ({ page }) => {
  await login(page);
  const nav = page.getByRole("navigation", { name: "เมนูหลัก" });
  await nav.getByRole("button", { name: "ออกจากระบบ" }).click();
  await expect(nav.getByRole("link", { name: "เข้าสู่ระบบ" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "ออกจากระบบ" })).toHaveCount(0);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("account ต้อง login ก่อน", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount|\/login\?next=\/account/);
});

test("อัปโหลดรูปโปรไฟล์", async ({ page }) => {
  await login(page);
  await page.getByLabel("รูปโปรไฟล์").setInputFiles({ name: "me.png", mimeType: "image/png", buffer: png });
  await expect(page.getByText("ไฟล์ที่เลือก: me.png")).toBeVisible();
  await page.getByRole("button", { name: "บันทึกรูป" }).click();
  await expect(page.getByRole("status").filter({ hasText: "บันทึกรูปโปรไฟล์แล้ว" })).toBeVisible();
});

test("ไฟล์ผิดชนิดแสดง error", async ({ page }) => {
  await login(page);
  await page
    .getByLabel("รูปโปรไฟล์")
    .setInputFiles({ name: "note.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
  await page.getByRole("button", { name: "บันทึกรูป" }).click();
  await expect(alertWith(page, "รองรับเฉพาะไฟล์ PNG หรือ JPG ขนาดไม่เกิน 1MB")).toBeVisible();
});

test("สมัครสมาชิก: validation ทุกช่อง", async ({ page }) => {
  await page.goto("/register");
  await expect(page).toHaveTitle("สมัครสมาชิก | DN Shop");
  await expect(page.getByRole("heading", { level: 1, name: "สมัครสมาชิก" })).toBeVisible();
  await page.getByRole("button", { name: "สมัครสมาชิก" }).click();
  await expect(page.getByText("กรุณากรอกชื่อ")).toBeVisible();
  await expect(page.getByText("รูปแบบอีเมลไม่ถูกต้อง")).toBeVisible();
  await expect(page.getByText("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")).toBeVisible();
  await expect(page.getByText("กรุณายอมรับเงื่อนไขการใช้งาน")).toBeVisible();

  await page.getByLabel("ชื่อ-นามสกุล").fill("สมหมาย ทดสอบ");
  await page.getByLabel("อีเมล", { exact: true }).fill("somying@example.com");
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill("password123");
  await page.getByLabel("ยืนยันรหัสผ่าน").fill("password124");
  await page.getByRole("button", { name: "สมัครสมาชิก" }).click();
  await expect(page.getByText("รหัสผ่านไม่ตรงกัน")).toBeVisible();
  await expect(page.getByText("กรุณากรอกชื่อ")).toHaveCount(0);
});

test("ฟอร์มสมัครมีตัวเลือกครบ", async ({ page }) => {
  await page.goto("/register");
  const province = page.getByLabel("จังหวัด");
  await expect(province.getByRole("option")).toHaveText([
    "กรุงเทพมหานคร",
    "เชียงใหม่",
    "ขอนแก่น",
    "ภูเก็ต",
    "ชลบุรี",
  ]);
  const source = page.getByRole("group", { name: "รู้จักเราจากช่องทางไหน" });
  await expect(source.getByRole("radio")).toHaveCount(3);
  await expect(source.getByRole("radio", { name: "เพื่อนแนะนำ" })).toBeVisible();
  await expect(source.getByRole("radio", { name: "โซเชียลมีเดีย" })).toBeVisible();
  await expect(source.getByRole("radio", { name: "อื่นๆ" })).toBeVisible();
  const interests = page.getByRole("group", { name: "หมวดที่สนใจ" });
  await expect(interests.getByRole("checkbox")).toHaveCount(4);
  await expect(interests.getByRole("checkbox", { name: "อุปกรณ์ไอที" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "รับข่าวสารทางอีเมล" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "ฉันยอมรับเงื่อนไขการใช้งาน" })).not.toBeChecked();
});

async function fillRegister(page: Page, email: string) {
  await page.getByLabel("ชื่อ-นามสกุล").fill("สมหมาย ทดสอบ");
  await page.getByLabel("อีเมล", { exact: true }).fill(email);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill("password123");
  await page.getByLabel("ยืนยันรหัสผ่าน").fill("password123");
  await page.getByLabel("จังหวัด").selectOption("เชียงใหม่");
  await page.getByRole("radio", { name: "เพื่อนแนะนำ" }).check();
  await page.getByRole("checkbox", { name: "หนังสือ" }).check();
  await page.getByRole("checkbox", { name: "ฉันยอมรับเงื่อนไขการใช้งาน" }).check();
  await page.getByRole("button", { name: "สมัครสมาชิก" }).click();
}

test("อีเมลซ้ำ", async ({ page }) => {
  await page.goto("/register");
  await fillRegister(page, "user@dnshop.test");
  await expect(page.getByText("อีเมลนี้ถูกใช้แล้ว")).toBeVisible();
});

test("สมัครสมาชิกสำเร็จ", async ({ page }) => {
  await page.goto("/register");
  await fillRegister(page, "newbie@example.com");
  await expect(page.getByRole("heading", { level: 2, name: "สมัครสมาชิกสำเร็จ" })).toBeVisible();
  await expect(page.getByText("ยินดีต้อนรับ สมหมาย ทดสอบ")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" }).getByRole("button", { name: "ออกจากระบบ" })).toBeVisible();
});

test("รหัสผ่านมี accessible description", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByLabel("รหัสผ่าน", { exact: true })).toHaveAccessibleDescription("อย่างน้อย 8 ตัวอักษร");
});

test("user เข้า admin ไม่ได้", async ({ page }) => {
  await login(page);
  await page.goto("/admin/products");
  await expect(page.getByRole("heading", { level: 1, name: "คุณไม่มีสิทธิ์เข้าหน้านี้" })).toBeVisible();
  await expect(page.getByRole("table", { name: "ตารางสินค้า" })).toHaveCount(0);
});

test("admin ยังไม่ login ถูกส่งไป login", async ({ page }) => {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fproducts/);
});

test("admin เพิ่มและลบสินค้า (มี confirm)", async ({ page }) => {
  await login(page, "admin@dnshop.test", "admin123");
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" }).getByRole("link", { name: "จัดการสินค้า" })).toBeVisible();
  await page.goto("/admin/products");
  await expect(page).toHaveTitle("จัดการสินค้า | DN Shop");
  const table = page.getByRole("table", { name: "ตารางสินค้า" });
  await expect(table.getByRole("columnheader")).toHaveText(["ชื่อสินค้า", "หมวดหมู่", "ราคา", "คงเหลือ", "จัดการ"]);
  await expect(table.getByRole("row")).toHaveCount(11);
  await expect(page.getByRole("link", { name: "ส่งออกรายการสินค้า (CSV)" })).toHaveAttribute(
    "href",
    "/api/products/export",
  );

  await expect(page.getByRole("heading", { level: 2, name: "เพิ่มสินค้าใหม่" })).toBeVisible();
  await page.getByLabel("ชื่อสินค้า").fill("ที่ชาร์จไร้สาย");
  await page.getByLabel("ราคา").fill("890");
  await page.getByLabel("หมวดหมู่").selectOption("it");
  await page.getByLabel("จำนวนคงเหลือ").fill("7");
  await page.getByRole("button", { name: "เพิ่มสินค้า" }).click();
  await expect(page.getByRole("status").filter({ hasText: "เพิ่มสินค้าแล้ว" })).toBeVisible();
  const row = table.getByRole("row", { name: /ที่ชาร์จไร้สาย/ });
  await expect(row).toContainText("890 บาท");
  await expect(table.getByRole("row")).toHaveCount(12);

  page.once("dialog", (d) => {
    expect(d.message()).toBe('ต้องการลบสินค้า "ที่ชาร์จไร้สาย" ใช่ไหม?');
    return d.dismiss();
  });
  await row.getByRole("button", { name: "ลบ" }).click();
  await expect(row).toBeVisible();

  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "ลบ" }).click();
  await expect(row).toHaveCount(0);
  await expect(table.getByRole("row")).toHaveCount(11);
});

test("storageState ที่ลบ dn_sid แล้วยัง login อยู่แต่ตะกร้าใหม่", async ({ page, context, browser }) => {
  await login(page);
  await expect(page).toHaveURL(/\/account$/);
  const add = await page.request.post("/api/cart", { data: { productId: "p01", quantity: 1 } });
  expect(add.status()).toBe(201);
  await page.goto("/");
  await expect(page.getByTestId("cart-count")).toHaveText("1");

  await context.clearCookies({ name: "dn_sid" });
  const state = await context.storageState();
  expect(state.cookies.map((c) => c.name)).toContain("dn_auth");
  expect(state.cookies.map((c) => c.name)).not.toContain("dn_sid");

  const context2 = await browser.newContext({ storageState: state });
  const page2 = await context2.newPage();
  await page2.goto("/account");
  await expect(page2.getByText("ชื่อ: สมชาย ใจดี")).toBeVisible();
  await expect(page2.getByTestId("cart-count")).toHaveText("0");
  await context2.close();
});

test("account แสดงยอดคำสั่งซื้อครั้งเดียว ตรงกับหน้า orders", async ({ page }) => {
  await login(page);
  const cartRes = await page.request.post("/api/cart", { data: { productId: "p01", quantity: 1 } });
  expect(cartRes.status()).toBe(201);
  const orderRes = await page.request.post("/api/orders", {
    data: {
      customer: { name: "สมหมาย", address: "กรุงเทพ", phone: "0812345678" },
      shipping: "standard",
      payment: "cod",
    },
  });
  expect(orderRes.status()).toBe(201);

  await page.goto("/orders/DN-0001");
  await expect(page.getByText("1,340 บาท")).toBeVisible();

  await page.goto("/account");
  const history = page.getByRole("list", { name: "ประวัติคำสั่งซื้อ" });
  await expect(history.getByRole("listitem").filter({ hasText: "DN-0001" })).toContainText("1,340 บาท");
});
