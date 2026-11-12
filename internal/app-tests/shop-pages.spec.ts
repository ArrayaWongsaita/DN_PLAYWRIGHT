import { test, expect } from "@playwright/test";

const list = (page: import("@playwright/test").Page) => page.getByRole("list", { name: "รายการสินค้า" });

test("header มีเมนูหลักและจำนวนในตะกร้าเป็น 0", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "DN Shop", exact: true }).first()).toHaveAttribute("href", "/");
  const nav = page.getByRole("navigation", { name: "เมนูหลัก" });
  await expect(nav.getByRole("link", { name: "หน้าแรก" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "สินค้า" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "ตะกร้า" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "เข้าสู่ระบบ" })).toBeVisible();
  await expect(page.getByTestId("cart-count")).toHaveText("0");
  await expect(page.getByText("© 2026 DN Shop — ร้านตัวอย่างสำหรับฝึกเขียน test")).toBeVisible();
  await expect(page.getByRole("link", { name: "สาขาของเรา" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Playground" })).toBeVisible();
});

test("หน้าแรกมีสินค้าแนะนำ 3 ชิ้น", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("paragraph").filter({ hasText: "ร้านค้าตัวอย่างสำหรับฝึก Playwright" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ดูสินค้าทั้งหมด" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "สินค้าแนะนำ" })).toBeVisible();
  const cards = page.getByRole("list", { name: "สินค้าแนะนำ" }).getByRole("listitem");
  await expect(cards).toHaveCount(3);
  await expect(cards.getByRole("link")).toHaveText(["หูฟังไร้สาย DN Buds", "เสื้อยืด DN สีขาว", "หมอนอิงลายแมว"]);
});

test("flash sale นับถอยหลังด้วยนาฬิกาจำลอง", async ({ page }) => {
  await page.clock.install({ time: new Date("2030-12-31T22:59:00+07:00") });
  await page.clock.pauseAt(new Date("2030-12-31T23:00:00+07:00"));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2, name: "Flash Sale" })).toBeVisible();
  await expect(page.getByText("ลด 50% ทุกชิ้นในหมวดหนังสือ")).toBeVisible();
  const timer = page.getByRole("timer", { name: "เวลาที่เหลือ" });
  await expect(timer).toHaveText("เหลือเวลา 00:59:59");
  await page.clock.fastForward("01:00:00");
  await expect(timer).toHaveText("Flash Sale จบแล้ว");
});

test("flash sale แสดงจำนวนวันเมื่อเหลือเกิน 1 วัน", async ({ page }) => {
  await page.clock.install({ time: new Date("2030-12-29T22:59:00+07:00") });
  await page.clock.pauseAt(new Date("2030-12-29T23:00:00+07:00"));
  await page.goto("/");
  await expect(page.getByRole("timer", { name: "เวลาที่เหลือ" })).toHaveText("เหลือเวลา 2 วัน 00:59:59");
});

for (const [time, text] of [
  ["09:00", "สวัสดีตอนเช้า"],
  ["13:00", "สวัสดีตอนบ่าย"],
  ["20:00", "สวัสดีตอนเย็น"],
] as const) {
  test(`คำทักทายตามเวลา ${time}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date(`2026-06-01T${time}:00+07:00`));
    await page.goto("/");
    await expect(page.getByTestId("greeting")).toHaveText(text);
    await expect(page.getByTestId("today")).not.toBeEmpty();
  });
}

test("ค้นหาด้วย Enter", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText("พบสินค้า 10 รายการ")).toBeVisible();
  await page.getByRole("searchbox", { name: "ค้นหาสินค้า" }).fill("หนังสือ");
  await page.getByRole("searchbox", { name: "ค้นหาสินค้า" }).press("Enter");
  await expect(page.getByText("พบสินค้า 2 รายการ")).toBeVisible();
  await expect(list(page).getByRole("heading", { level: 2 })).toHaveText([
    "หนังสือ TypeScript เบื้องต้น",
    "หนังสือ Playwright ฉบับลงมือทำ",
  ]);
  await page.getByRole("searchbox", { name: "ค้นหาสินค้า" }).fill("zzz");
  await page.getByRole("button", { name: "ค้นหา" }).click();
  await expect(page.getByText("ไม่พบสินค้าที่ค้นหา")).toBeVisible();
});

test("กดคีย์ / แล้วโฟกัสช่องค้นหา", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText("พบสินค้า 10 รายการ")).toBeVisible();
  await page.keyboard.press("/");
  await expect(page.getByRole("searchbox", { name: "ค้นหาสินค้า" })).toBeFocused();
  await expect(page.getByRole("searchbox", { name: "ค้นหาสินค้า" })).toHaveValue("");
});

test("กรองและเรียง", async ({ page }) => {
  await page.goto("/products");
  await page.getByLabel("หมวดหมู่").selectOption("books");
  await page.getByLabel("เรียงตาม").selectOption("price-asc");
  await expect(list(page).getByRole("heading", { level: 2 })).toHaveText([
    "สมุดโน้ตลายจุด",
    "หนังสือ TypeScript เบื้องต้น",
    "หนังสือ Playwright ฉบับลงมือทำ",
  ]);
  await expect(page.getByLabel("หมวดหมู่").getByRole("option")).toHaveText([
    "ทั้งหมด", "อุปกรณ์ไอที", "เสื้อผ้า", "ของใช้ในบ้าน", "หนังสือ",
  ]);
});

test("อ่านตัวกรองจาก URL และแสดงสถานะกำลังโหลด", async ({ page }) => {
  await page.goto("/products?category=books&sort=price-desc&delay=800");
  await expect(page.getByRole("status")).toHaveText("กำลังโหลดสินค้า...");
  await expect(list(page).getByRole("heading", { level: 2 })).toHaveText([
    "หนังสือ Playwright ฉบับลงมือทำ",
    "หนังสือ TypeScript เบื้องต้น",
    "สมุดโน้ตลายจุด",
  ]);
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("การ์ดสินค้ามีรูป ชื่อหมวด และราคา", async ({ page }) => {
  await page.goto("/products");
  const card = list(page).getByRole("listitem").first();
  await expect(card.getByRole("img", { name: "หูฟังไร้สาย DN Buds" })).toBeVisible();
  await expect(card.getByRole("link", { name: "หูฟังไร้สาย DN Buds" })).toHaveAttribute("href", "/products/p01");
  await expect(card.getByText("อุปกรณ์ไอที")).toBeVisible();
  await expect(card.getByText("1,290 บาท")).toBeVisible();
});

test("สินค้าหมดมีปุ่ม disabled", async ({ page }) => {
  await page.goto("/products");
  const card = list(page).getByRole("listitem").filter({ hasText: "หมวกแก๊ป" });
  await expect(card.getByRole("button", { name: "สินค้าหมด" })).toBeDisabled();
});

test("API พังแล้วแสดง alert และลองใหม่ได้", async ({ page }) => {
  let fail = true;
  await page.route("**/api/products*", async (route) => {
    if (fail) await route.fulfill({ status: 500 });
    else await route.continue();
  });
  await page.goto("/products");
  // Next.js มี route announcer (role="alert" ว่าง) อยู่ทุกหน้า จึงต้องกรองด้วยข้อความ
  const alert = page.getByRole("alert").filter({ hasText: "โหลดสินค้าไม่สำเร็จ" });
  await expect(alert).toContainText("โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่");
  fail = false;
  await page.getByRole("button", { name: "ลองใหม่" }).click();
  await expect(alert).toHaveCount(0);
  await expect(list(page).getByRole("listitem")).toHaveCount(10);
});

test("เพิ่มลงตะกร้าจากรายการแล้วเลขในตะกร้าเป็น 1", async ({ page }) => {
  await page.goto("/products");
  const card = list(page).getByRole("listitem").filter({ hasText: "เมาส์ไร้สาย" });
  await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(page.getByRole("status")).toHaveText('เพิ่ม "เมาส์ไร้สาย" ลงตะกร้าแล้ว');
  await expect(page.getByTestId("cart-count")).toHaveText("1");
});

test("หน้ารายละเอียดแสดงข้อมูลสินค้า", async ({ page }) => {
  await page.goto("/products/p07");
  await expect(page).toHaveTitle("หมอนอิงลายแมว | DN Shop");
  await expect(page.getByRole("heading", { level: 1, name: "หมอนอิงลายแมว" })).toBeVisible();
  await expect(page.getByText("450 บาท")).toBeVisible();
  await expect(page.getByText("ของใช้ในบ้าน")).toBeVisible();
  await expect(page.getByTitle("จำนวนที่เหลือในคลัง")).toHaveText("คงเหลือ 5 ชิ้น");
  await expect(page.getByRole("link", { name: "← กลับไปหน้าสินค้า" })).toHaveAttribute("href", "/products");
});

test("หน้ารายละเอียด: จำนวน ปุ่ม disabled ที่ขอบ ข้อความหลังหน่วง tooltip และ dblclick zoom", async ({ page }) => {
  await page.goto("/products/p07");
  const qty = page.getByLabel("จำนวน", { exact: true });
  const dec = page.getByRole("button", { name: "ลดจำนวน" });
  const inc = page.getByRole("button", { name: "เพิ่มจำนวน" });
  await expect(qty).toHaveValue("1");
  await expect(dec).toBeDisabled();
  for (let i = 0; i < 4; i++) await inc.click();
  await expect(qty).toHaveValue("5");
  await expect(inc).toBeDisabled();
  await dec.click();
  await expect(qty).toHaveValue("4");

  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
  await expect(page.getByRole("status")).toHaveText("เพิ่มลงตะกร้าแล้ว");
  await expect(page.getByTestId("cart-count")).toHaveText("4");

  await page.getByRole("button", { name: "ข้อมูลการจัดส่ง" }).hover();
  await expect(page.getByRole("tooltip")).toHaveText("จัดส่งภายใน 1–3 วันทำการ");

  const img = page.getByRole("img", { name: "หมอนอิงลายแมว" });
  await expect(page.getByText("ดับเบิลคลิกเพื่อขยายรูป")).toBeVisible();
  await img.dblclick();
  await expect(img).toHaveClass(/zoomed/);
  await expect(page.getByText("ดับเบิลคลิกเพื่อย่อรูป")).toBeVisible();
  await img.dblclick();
  await expect(img).not.toHaveClass(/zoomed/);
  // ข้อความแจ้งผลต้องไม่หายเอง
  await expect(page.getByRole("status")).toHaveText("เพิ่มลงตะกร้าแล้ว");
});

test("สินค้าหมดในหน้ารายละเอียดเพิ่มลงตะกร้าไม่ได้", async ({ page }) => {
  await page.goto("/products/p05");
  await expect(page.getByTitle("จำนวนที่เหลือในคลัง")).toHaveText("คงเหลือ 0 ชิ้น");
  await expect(page.getByRole("button", { name: "เพิ่มจำนวน" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "เพิ่มลงตะกร้า" })).toBeDisabled();
});

test("id ไม่มีอยู่ได้หน้า 404", async ({ page }) => {
  const res = await page.goto("/products/p99");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "ไม่พบหน้านี้" })).toBeVisible();
});

test.describe("มือถือ", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("มือถือมีปุ่มเปิดเมนู", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "เปิดเมนู" });
    const link = page.getByRole("link", { name: "สินค้า", exact: true });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(link).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(link).toBeVisible();
  });
});

test("จอกว้างไม่แสดงปุ่มเปิดเมนู", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "เปิดเมนู" })).toBeHidden();
});

test("dark mode เปลี่ยนสีพื้นหลัง", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(17, 24, 39)");
});

test("ออฟไลน์แล้วแสดงแถบแจ้ง", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByText("ไม่มีการเชื่อมต่ออินเทอร์เน็ต")).toBeHidden();
  await context.setOffline(true);
  await expect(page.getByRole("status")).toHaveText("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
  await context.setOffline(false);
  await expect(page.getByText("ไม่มีการเชื่อมต่ออินเทอร์เน็ต")).toBeHidden();
});

test("หน้าสาขาและค้นหาสาขาใกล้ฉันด้วย geolocation", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 13.75, longitude: 100.53 });
  await page.goto("/stores");
  await expect(page).toHaveTitle("สาขาของเรา | DN Shop");
  await expect(page.getByRole("heading", { level: 1, name: "สาขาของเรา" })).toBeVisible();
  for (const name of ["สาขาสยาม", "สาขาเชียงใหม่", "สาขาภูเก็ต"]) {
    await expect(page.getByRole("listitem").filter({ hasText: name })).toBeVisible();
  }
  await page.getByRole("button", { name: "หาสาขาใกล้ฉัน" }).click();
  await expect(page.getByRole("status")).toHaveText("สาขาที่ใกล้ที่สุดคือ สาขาสยาม");
});

test("ไม่ได้รับอนุญาต geolocation แสดง alert", async ({ page }) => {
  await page.goto("/stores");
  await page.getByRole("button", { name: "หาสาขาใกล้ฉัน" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "ไม่ได้รับอนุญาต" })).toHaveText("ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง");
});

test("หน้าคู่มือการสั่งซื้อ", async ({ page }) => {
  await page.goto("/help/ordering");
  await expect(page).toHaveTitle("คู่มือการสั่งซื้อ | DN Shop");
  await expect(page.getByRole("heading", { level: 1, name: "คู่มือการสั่งซื้อ" })).toBeVisible();
});

test("เส้นทางที่ไม่มีอยู่ได้หน้า 404 พร้อม header", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "ไม่พบหน้านี้" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" })).toBeVisible();
});
