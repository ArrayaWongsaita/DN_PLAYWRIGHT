import { test, expect, type Page } from "@playwright/test";

async function seedCart(page: Page, productId = "p01", quantity = 1) {
  const res = await page.request.post("/api/cart", { data: { productId, quantity } });
  expect(res.status()).toBe(201);
}

async function fillCustomer(page: Page) {
  await page.getByLabel("ชื่อ-นามสกุล").fill("สมหมาย ทดสอบ");
  await page.getByLabel("ที่อยู่").fill("99 ถนนสุขุมวิท กรุงเทพฯ");
  await page.getByLabel("เบอร์โทรศัพท์").fill("0812345678");
}

const alertWith = (page: Page, text: string) => page.getByRole("alert").filter({ hasText: text });

test("ตะกร้าว่าง", async ({ page }) => {
  await page.goto("/cart");
  await expect(page).toHaveTitle("ตะกร้าสินค้า | DN Shop");
  await expect(page.getByRole("heading", { level: 1, name: "ตะกร้าสินค้า" })).toBeVisible();
  await expect(page.getByText("ตะกร้าของคุณยังว่างอยู่")).toBeVisible();
  await expect(page.getByRole("link", { name: "เลือกซื้อสินค้า" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ไปชำระเงิน" })).toBeDisabled();
});

test("แก้จำนวนแล้วยอดรวมเปลี่ยน", async ({ page }) => {
  await seedCart(page);
  await page.goto("/cart");
  await expect(page.getByTestId("subtotal")).toHaveText("1,290 บาท");
  const item = page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem");
  await item.getByRole("button", { name: "เพิ่มจำนวน" }).click();
  await expect(item.getByLabel("จำนวน")).toHaveValue("2");
  await expect(page.getByTestId("subtotal")).toHaveText("2,580 บาท");
  await expect(page.getByTestId("total")).toHaveText("2,580 บาท");
  await expect(page.getByTestId("cart-count")).toHaveText("2");
  await item.getByRole("button", { name: "ลดจำนวน" }).click();
  await expect(page.getByTestId("subtotal")).toHaveText("1,290 บาท");
});

test("ลบแล้วมี confirm", async ({ page }) => {
  await seedCart(page);
  await page.goto("/cart");
  const items = page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem");

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe('ต้องการลบ "หูฟังไร้สาย DN Buds" ออกจากตะกร้าใช่ไหม?');
    void dialog.dismiss();
  });
  await items.getByRole("button", { name: "ลบ" }).click();
  await expect(items).toHaveCount(1);

  page.once("dialog", (dialog) => void dialog.accept());
  await items.getByRole("button", { name: "ลบ" }).click();
  await expect(page.getByText("ตะกร้าของคุณยังว่างอยู่")).toBeVisible();
});

test("คูปองถูกและผิด", async ({ page }) => {
  await seedCart(page);
  await page.goto("/cart");
  await page.getByLabel("โค้ดส่วนลด").fill("WRONG");
  await page.getByRole("button", { name: "ใช้โค้ด" }).click();
  await expect(alertWith(page, "โค้ดส่วนลดไม่ถูกต้อง")).toBeVisible();

  await page.getByLabel("โค้ดส่วนลด").fill("DN10");
  await page.getByRole("button", { name: "ใช้โค้ด" }).click();
  await expect(page.getByRole("status").filter({ hasText: "ใช้โค้ด DN10 แล้ว ลด 10%" })).toBeVisible();
  await expect(alertWith(page, "โค้ดส่วนลดไม่ถูกต้อง")).toHaveCount(0);
  await expect(page.getByTestId("discount")).toHaveText("129 บาท");
  await expect(page.getByTestId("total")).toHaveText("1,161 บาท");
});

test("ปุ่มใช้โค้ด disabled ตอนช่องว่าง", async ({ page }) => {
  await seedCart(page);
  await page.goto("/cart");
  const apply = page.getByRole("button", { name: "ใช้โค้ด" });
  await expect(apply).toBeDisabled();
  await page.getByLabel("โค้ดส่วนลด").fill("DN10");
  await expect(apply).toBeEnabled();
  await page.getByLabel("โค้ดส่วนลด").clear();
  await expect(apply).toBeDisabled();
});

test("checkout ว่างแล้ว redirect ไป cart", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page).toHaveURL("/cart");
});

test("ปุ่มไปชำระเงินพาไป checkout", async ({ page }) => {
  await seedCart(page);
  await page.goto("/cart");
  await page.getByRole("button", { name: "ไปชำระเงิน" }).click();
  await expect(page).toHaveURL("/checkout");
  await expect(page.getByRole("heading", { level: 1, name: "ชำระเงิน" })).toBeVisible();
});

test("ปุ่มยืนยัน disabled จนกรอกครบ", async ({ page }) => {
  await seedCart(page);
  await page.goto("/checkout");
  await expect(page).toHaveTitle("ชำระเงิน | DN Shop");
  const confirm = page.getByRole("button", { name: "ยืนยันคำสั่งซื้อ" });
  await page.getByLabel("วิธีชำระเงิน").selectOption("cod");
  await expect(confirm).toBeDisabled();
  await fillCustomer(page);
  await expect(confirm).toBeDisabled();
  await page.getByRole("checkbox", { name: "ฉันยอมรับเงื่อนไขการสั่งซื้อ" }).check();
  await expect(confirm).toBeEnabled();
});

test("เบอร์ผิดแสดง error", async ({ page }) => {
  await seedCart(page);
  await page.goto("/checkout");
  const phone = page.getByLabel("เบอร์โทรศัพท์");
  await expect(phone).toHaveAttribute("placeholder", "0812345678");
  await phone.fill("12345");
  await phone.blur();
  await expect(page.getByText("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก")).toBeVisible();
  await phone.fill("0812345678");
  await phone.blur();
  await expect(page.getByText("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก")).toHaveCount(0);
});

test("จ่ายด้วยบัตรผ่าน iframe", async ({ page }) => {
  await seedCart(page);
  await page.goto("/checkout");
  await fillCustomer(page);
  await page.getByRole("checkbox", { name: "ฉันยอมรับเงื่อนไขการสั่งซื้อ" }).check();
  await page.getByLabel("วิธีชำระเงิน").selectOption("card");
  const confirm = page.getByRole("button", { name: "ยืนยันคำสั่งซื้อ" });
  await expect(confirm).toBeDisabled();

  const card = page.frameLocator('iframe[title="ฟอร์มบัตรเครดิต"]');
  await card.getByLabel("หมายเลขบัตร").fill("1111 1111 1111 1111");
  await card.getByLabel("วันหมดอายุ").fill("12/30");
  await card.getByLabel("CVV").fill("123");
  await card.getByRole("button", { name: "ยืนยันบัตร" }).click();
  await expect(card.getByRole("alert").filter({ hasText: "บัตรไม่ถูกต้อง" })).toBeVisible();
  await expect(confirm).toBeDisabled();

  await card.getByLabel("หมายเลขบัตร").fill("4242 4242 4242 4242");
  await card.getByRole("button", { name: "ยืนยันบัตร" }).click();
  await expect(card.getByText("บัตรผ่านการตรวจสอบ")).toBeVisible();
  await expect(page.getByText("ยืนยันบัตรแล้ว")).toBeVisible();
  await expect(confirm).toBeEnabled();
});

test("สั่งซื้อแบบเก็บเงินปลายทางจนได้ใบเสร็จ DN-0001", async ({ page }) => {
  await seedCart(page);
  await page.goto("/checkout");
  await fillCustomer(page);
  await page.getByLabel("วิธีชำระเงิน").selectOption("cod");
  await page.getByRole("checkbox", { name: "ฉันยอมรับเงื่อนไขการสั่งซื้อ" }).check();
  await expect(page.getByTestId("order-total")).toHaveText("1,340 บาท");
  await page.getByRole("button", { name: "ยืนยันคำสั่งซื้อ" }).click();

  await expect(page).toHaveURL(/\/orders\/DN-0001$/);
  await expect(page).toHaveTitle("คำสั่งซื้อ DN-0001 | DN Shop");
  await expect(page.getByRole("heading", { level: 1, name: "สั่งซื้อสำเร็จ" })).toBeVisible();
  await expect(page.getByText("หมายเลขคำสั่งซื้อ: DN-0001")).toBeVisible();
  await expect(page.getByText("หูฟังไร้สาย DN Buds")).toBeVisible();
  await expect(page.getByText("1,340 บาท")).toBeVisible();
  await expect(page.getByTestId("cart-count")).toHaveText("0");
});

test("ส่งด่วนบวก 100 บาท", async ({ page }) => {
  await seedCart(page);
  await page.goto("/checkout");
  await expect(page.getByRole("radio", { name: "ส่งธรรมดา (50 บาท)" })).toBeChecked();
  await expect(page.getByTestId("order-total")).toHaveText("1,340 บาท");
  await page.getByRole("radio", { name: "ส่งด่วน (100 บาท)" }).check();
  await expect(page.getByTestId("order-total")).toHaveText("1,390 บาท");
});

test("ดาวน์โหลดใบเสร็จ", async ({ page }) => {
  await seedCart(page);
  const res = await page.request.post("/api/orders", {
    data: {
      customer: { name: "สมหมาย", address: "กรุงเทพ", phone: "0812345678" },
      shipping: "standard",
      payment: "cod",
    },
  });
  expect(res.status()).toBe(201);
  await page.goto("/orders/DN-0001");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "ดาวน์โหลดใบเสร็จ" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("receipt-DN-0001.txt");
});

test("หน้า embed card-form ไม่มี header และ footer", async ({ page }) => {
  await page.goto("/embed/card-form");
  await expect(page.getByLabel("หมายเลขบัตร")).toBeVisible();
  await expect(page.getByLabel("วันหมดอายุ")).toHaveAttribute("placeholder", "MM/YY");
  await expect(page.getByRole("banner")).toHaveCount(0);
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" })).toHaveCount(0);
});
