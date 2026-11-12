import { test, expect, type Page } from "@playwright/test";

test("หน้า playground มีลิงก์ไปทุกหน้าย่อย", async ({ page }) => {
  await page.goto("/playground");
  await expect(page).toHaveTitle("Playground | DN Shop");
  await expect(page.getByRole("heading", { level: 1, name: "Playground" })).toBeVisible();
  for (const slug of [
    "dialogs",
    "new-tab",
    "chat",
    "files",
    "drag-drop",
    "keyboard",
    "hover",
    "slow",
    "iframe",
    "console",
    "a11y",
    "flaky",
  ]) {
    await expect(page.locator(`main a[href="/playground/${slug}"]`)).toHaveCount(1);
  }
});

test("dialogs: alert, confirm และ prompt", async ({ page }) => {
  await page.goto("/playground/dialogs");
  await expect(page).toHaveTitle("Dialogs - Playground | DN Shop");

  const messages: string[] = [];
  page.on("dialog", async (dialog) => {
    messages.push(`${dialog.type()}:${dialog.message()}`);
    if (dialog.type() === "confirm") await dialog.dismiss();
    else if (dialog.type() === "prompt") await dialog.accept("สมชาย");
    else await dialog.accept();
  });

  await page.getByRole("button", { name: "แสดง alert" }).click();
  await page.getByRole("button", { name: "แสดง confirm" }).click();
  await expect(page.getByRole("status").filter({ hasText: "ผลลัพธ์: ยกเลิก" })).toBeVisible();
  await page.getByRole("button", { name: "แสดง prompt" }).click();
  await expect(page.getByRole("status").filter({ hasText: "สวัสดี, สมชาย" })).toBeVisible();
  expect(messages).toEqual(["alert:นี่คือ alert", "confirm:ยืนยันใช่ไหม?", "prompt:กรุณาใส่ชื่อของคุณ"]);
});

test("dialogs: confirm ตกลง และ prompt ยกเลิก", async ({ page }) => {
  await page.goto("/playground/dialogs");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "แสดง confirm" }).click();
  await expect(page.getByRole("status").filter({ hasText: "ผลลัพธ์: ตกลง" })).toBeVisible();
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "แสดง prompt" }).click();
  await expect(page.getByRole("status").filter({ hasText: "ผลลัพธ์: ยกเลิก" })).toBeVisible();
});

test("new-tab: ลิงก์เปิดแท็บใหม่และปุ่มเปิดหน้าต่างแชท", async ({ page, context }) => {
  await page.goto("/playground/new-tab");
  await expect(page).toHaveTitle("New tab - Playground | DN Shop");

  const tabPromise = context.waitForEvent("page");
  await page.getByRole("link", { name: "เปิดคู่มือการสั่งซื้อในแท็บใหม่" }).click();
  const tab = await tabPromise;
  await expect(tab.getByRole("heading", { level: 1, name: "คู่มือการสั่งซื้อ" })).toBeVisible();
  await expect(tab).toHaveURL(/\/help\/ordering$/);

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "เปิดหน้าต่างแชท" }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/\/playground\/chat$/);
  await expect(popup.getByRole("heading", { level: 1, name: "แชทกับร้าน" })).toBeVisible();
});

test("chat: ส่งข้อความเข้ารายการ", async ({ page }) => {
  await page.goto("/playground/chat");
  await expect(page).toHaveTitle("Chat - Playground | DN Shop");
  await page.getByLabel("ข้อความ", { exact: true }).fill("สวัสดีครับ");
  await page.getByRole("button", { name: "ส่ง" }).click();
  await expect(page.getByRole("list", { name: "ข้อความแชท" }).getByRole("listitem")).toHaveText(["สวัสดีครับ"]);
});

test("files: อัปโหลดหลายไฟล์และล้างไฟล์", async ({ page }) => {
  await page.goto("/playground/files");
  await expect(page).toHaveTitle("Files - Playground | DN Shop");
  await page.getByLabel("เลือกไฟล์ (หลายไฟล์ได้)").setInputFiles([
    { name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("hello") },
    { name: "b.txt", mimeType: "text/plain", buffer: Buffer.from("hi") },
  ]);
  const items = page.getByRole("list", { name: "ไฟล์ที่เลือก" }).getByRole("listitem");
  await expect(items).toHaveText(["a.txt (5 bytes)", "b.txt (2 bytes)"]);
  await page.getByRole("button", { name: "ล้างไฟล์" }).click();
  await expect(items).toHaveCount(0);
});

test("files: ดาวน์โหลด CSV และ TXT", async ({ page }) => {
  await page.goto("/playground/files");
  const csvPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "ดาวน์โหลดรายการสินค้า (CSV)" }).click();
  const csv = await csvPromise;
  expect(csv.suggestedFilename()).toMatch(/\.csv$/);

  const txtPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "ดาวน์โหลดคู่มือ (TXT)" }).click();
  const txt = await txtPromise;
  expect(txt.suggestedFilename()).toBe("guide.txt");
});

test("guide.txt เป็นคู่มือการใช้งาน", async ({ request }) => {
  const res = await request.get("/downloads/guide.txt");
  expect(res.ok()).toBe(true);
  expect(await res.text()).toContain("คู่มือการใช้งาน DN Shop");
});

test("drag-drop: ลากการ์ดส่งของไปเสร็จแล้ว", async ({ page }) => {
  await page.goto("/playground/drag-drop");
  await expect(page).toHaveTitle("Drag and drop - Playground | DN Shop");
  const todo = page.getByRole("region", { name: "ต้องทำ" });
  const done = page.getByRole("region", { name: "เสร็จแล้ว" });
  await expect(todo.getByRole("listitem")).toHaveText(["แพ็กสินค้า", "ส่งของ", "ตอบแชทลูกค้า"]);
  await todo.getByText("ส่งของ").dragTo(done.getByRole("list"));
  await expect(done.getByRole("listitem")).toHaveText(["ส่งของ"]);
  await expect(todo.getByRole("listitem")).toHaveText(["แพ็กสินค้า", "ตอบแชทลูกค้า"]);
});

test("keyboard: คีย์ล่าสุด, ControlOrMeta+K เปิด และ Escape ปิด", async ({ page }) => {
  await page.goto("/playground/keyboard");
  await expect(page).toHaveTitle("Keyboard - Playground | DN Shop");
  await page.getByLabel("พิมพ์ที่นี่").press("a");
  await expect(page.getByRole("status").filter({ hasText: "คีย์ล่าสุด: a" })).toBeVisible();
  await page.keyboard.press("ControlOrMeta+K");
  const dialog = page.getByRole("dialog", { name: "ค้นหาด่วน" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("hover: เมนูบริการลูกค้า", async ({ page }) => {
  await page.goto("/playground/hover");
  await expect(page).toHaveTitle("Hover - Playground | DN Shop");
  await expect(page.getByRole("link", { name: "ติดตามพัสดุ" })).toBeHidden();
  await page.getByRole("button", { name: "บริการลูกค้า" }).hover();
  await expect(page.getByRole("link", { name: "ติดตามพัสดุ" })).toBeVisible();
  await expect(page.getByRole("link", { name: "คืนสินค้า" })).toBeVisible();
});

test.describe("slow", () => {
  test("โหลดข้อมูลตาม delay", async ({ page }) => {
    await page.goto("/playground/slow?delay=300");
    await expect(page).toHaveTitle("Slow - Playground | DN Shop");
    await expect(page.getByText("กำลังเตรียมหน้า...")).toBeHidden();
    await page.getByRole("button", { name: "โหลดข้อมูล" }).click();
    await expect(page.getByRole("status").filter({ hasText: "กำลังโหลด..." })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "โหลดข้อมูลเสร็จแล้ว" })).toBeVisible();
  });

  test("ปุ่มส่งฟอร์มเปิดใช้หลัง 1.5 วินาที", async ({ page }) => {
    await page.goto("/playground/slow");
    const submit = page.getByRole("button", { name: /ส่งฟอร์ม|รอสักครู่/ });
    await expect(submit).toHaveText("รอสักครู่...");
    await expect(submit).toBeDisabled();
    await expect(page.getByRole("button", { name: "ส่งฟอร์ม" })).toBeEnabled();
    await page.getByRole("button", { name: "ส่งฟอร์ม" }).click();
    await expect(page.getByRole("status").filter({ hasText: "ส่งฟอร์มแล้ว" })).toBeVisible();
  });

  test("overlay หายไปเอง และปุ่มไปหน้าถัดไปรอ 1 วินาที", async ({ page }) => {
    await page.goto("/playground/slow");
    await expect(page.getByText("กำลังเตรียมหน้า...")).toBeVisible();
    await expect(page.getByText("กำลังเตรียมหน้า...")).toBeHidden();
    await page.getByRole("button", { name: "ไปหน้าถัดไป" }).click();
    await expect(page).toHaveURL(/\/playground\/slow\/done$/);
    await expect(page.getByRole("heading", { level: 1, name: "เสร็จแล้ว" })).toBeVisible();
  });
});

test("iframe: help widget", async ({ page }) => {
  await page.goto("/playground/iframe");
  await expect(page).toHaveTitle("Iframe - Playground | DN Shop");
  const frame = page.frameLocator('iframe[title="กล่องแชทช่วยเหลือ"]');
  await frame.getByRole("button", { name: "เริ่มแชท" }).click();
  await expect(frame.getByText("เจ้าหน้าที่จะตอบกลับภายใน 5 นาที")).toBeVisible();
});

test("embed help-widget ไม่มี header/footer", async ({ page }) => {
  await page.goto("/embed/help-widget");
  await expect(page.getByRole("button", { name: "เริ่มแชท" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" })).toHaveCount(0);
});

test("console: log, warn, pageerror และ window.dnShop", async ({ page }) => {
  const logs: string[] = [];
  page.on("console", (msg) => logs.push(`${msg.type()}:${msg.text()}`));
  await page.goto("/playground/console");
  await expect(page).toHaveTitle("Console - Playground | DN Shop");
  await expect.poll(() => logs).toContain("log:หน้า console พร้อมแล้ว");

  await page.getByRole("button", { name: "log ข้อความ" }).click();
  await expect.poll(() => logs).toContain("log:กดปุ่มแล้ว");
  await page.getByRole("button", { name: "เตือน" }).click();
  await expect.poll(() => logs).toContain("warning:ระวัง: สินค้าใกล้หมด");

  const errorPromise = page.waitForEvent("pageerror");
  await page.getByRole("button", { name: "ทำให้ error" }).click();
  expect((await errorPromise).message).toBe("เกิดข้อผิดพลาดที่ไม่คาดคิด");

  expect(await page.evaluate(() => window.dnShop.version)).toBe("1.0.0");
  expect(await page.evaluate(() => typeof window.dnShop.getGreeting())).toBe("string");
});

test("flaky: failRate=1 ล้มเหลวเสมอ ค่าเริ่มต้นสำเร็จ", async ({ page }) => {
  await page.goto("/playground/flaky?failRate=1");
  await expect(page).toHaveTitle("Flaky - Playground | DN Shop");
  await expect(page.getByRole("status").filter({ hasText: "ผลลัพธ์: ล้มเหลว" })).toBeVisible();
  await page.goto("/playground/flaky");
  await expect(page.getByRole("status").filter({ hasText: "ผลลัพธ์: สำเร็จ" })).toBeVisible();
});

test("flaky: delayMax หน่วงก่อนแสดงผล", async ({ page }) => {
  await page.goto("/playground/flaky?delayMax=300");
  await expect(page.getByRole("status").filter({ hasText: "ผลลัพธ์: สำเร็จ" })).toBeVisible();
});

test.describe("overlay ที่ต้องเปิดเอง", () => {
  // รอให้ hydrate เสร็จก่อน (greeting ถูกเติมโดย useEffect ฝั่ง client) แล้วค่อยเดินนาฬิกา
  // ไม่งั้น timer ของ overlay อาจถูกตั้งหลัง runFor และ test ผ่านทั้งที่ไม่ได้พิสูจน์อะไร
  async function hydratedHome(page: Page, url: string) {
    await page.clock.install();
    await page.goto(url);
    await expect(page.getByTestId("greeting")).not.toBeEmpty();
  }

  async function hydratedProducts(page: Page) {
    await page.clock.install();
    await page.reload();
    await expect(page.getByRole("list", { name: "รายการสินค้า" })).toBeVisible();
  }

  test("หน้าแรกไม่มีแบนเนอร์และป๊อปอัปเป็นค่าเริ่มต้น", async ({ page }) => {
    await hydratedHome(page, "/");
    await page.clock.runFor(5000);
    await expect(page.getByRole("dialog", { name: "การใช้คุกกี้" })).toBeHidden();
    await expect(page.getByRole("dialog", { name: "โปรโมชันพิเศษ" })).toBeHidden();
  });

  test("ตัวควบคุม: วิธีรอ hydrate + runFor เดียวกัน เห็นแบนเนอร์เมื่อเปิด cookieBanner=1", async ({ page }) => {
    await hydratedHome(page, "/?cookieBanner=1");
    await page.clock.runFor(3000);
    await expect(page.getByRole("dialog", { name: "การใช้คุกกี้" })).toBeVisible();
  });

  test("ตัวควบคุม: วิธีเดียวกันเห็นป๊อปอัปเมื่อเปิด promo=1", async ({ page }) => {
    await hydratedHome(page, "/?promo=1");
    await page.clock.runFor(3000);
    await expect(page.getByRole("dialog", { name: "โปรโมชันพิเศษ" })).toBeVisible();
  });

  test("cookieBanner=1 แล้วแบนเนอร์โผล่และปิดได้ และไม่โผล่อีกหลังยอมรับ", async ({ page }) => {
    await page.goto("/?cookieBanner=1");
    const banner = page.getByRole("dialog", { name: "การใช้คุกกี้" });
    await expect(banner).toBeVisible();
    // modal: บังการคลิก
    await expect(page.getByRole("link", { name: "ดูสินค้าทั้งหมด" }).click({ timeout: 1000 })).rejects.toThrow();
    await banner.getByRole("button", { name: "ยอมรับทั้งหมด" }).click();
    await expect(banner).toBeHidden();
    expect((await page.context().cookies()).some((c) => c.name === "dn_cookie_consent")).toBe(true);

    await page.goto("/products");
    await hydratedProducts(page);
    await page.clock.runFor(5000);
    await expect(banner).toBeHidden();
  });

  test("cookieBanner: ปฏิเสธก็ปิดและจำค่าไว้", async ({ page }) => {
    await page.goto("/?cookieBanner=1");
    const banner = page.getByRole("dialog", { name: "การใช้คุกกี้" });
    await banner.getByRole("button", { name: "ปฏิเสธ" }).click();
    await expect(banner).toBeHidden();
    expect((await page.context().cookies()).find((c) => c.name === "dn_cookie_consent")).toBeTruthy();
  });

  test("promo=1 แล้วป๊อปอัปโผล่ ปิดได้ และไม่โผล่อีก", async ({ page }) => {
    await page.goto("/?promo=1");
    const popup = page.getByRole("dialog", { name: "โปรโมชันพิเศษ" });
    await expect(popup).toBeVisible();
    await expect(popup.getByText("ใช้โค้ด DN10 ลด 10%")).toBeVisible();
    await popup.getByRole("button", { name: "ปิด" }).click();
    await expect(popup).toBeHidden();

    await page.goto("/products");
    await hydratedProducts(page);
    await page.clock.runFor(5000);
    await expect(popup).toBeHidden();
  });

  test("overlay ไม่โผล่ในหน้า embed", async ({ page }) => {
    await page.clock.install();
    await page.goto("/embed/card-form?cookieBanner=1&promo=1");
    // พิสูจน์ว่า hydrate แล้ว: กดยืนยันบัตรผิดแล้วได้ alert จาก client
    await page.getByLabel("หมายเลขบัตร").fill("0000");
    await page.getByRole("button", { name: "ยืนยันบัตร" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "บัตรไม่ถูกต้อง" })).toBeVisible();
    await page.clock.runFor(5000);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
