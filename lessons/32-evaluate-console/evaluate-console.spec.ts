import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 32: evaluate, console และ pageerror
// ฝึก: page.evaluate, ส่ง argument เข้า evaluate, page.on("console"), page.on("pageerror")
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// หน้า /playground/console สร้างวัตถุ window.dnShop ฝั่ง browser: { version: "1.0.0", getGreeting(): string }
// โค้ดใน evaluate รันใน browser จึงมองเห็น window แต่ TypeScript ของ test ไม่รู้จัก dnShop เราบอกชนิดเองด้วย type นี้
type DnShopWindow = Window & { dnShop?: { version: string; getGreeting(): string } };


// ------------------------------------------------
// ตัวอย่างที่ 1: อ่านค่าในหน้าด้วย page.evaluate และส่ง argument เข้าไป
// ------------------------------------------------
test("หน้า console: อ่านเวอร์ชันของ dnShop ด้วย evaluate", async ({ page }) => {
  await page.goto("/playground/console");

  // window.dnShop ถูกสร้างหลังหน้า hydrate เสร็จ (ไม่ใช่ทันทีที่ goto จบ)
  // expect.poll เรียกฟังก์ชันซ้ำจนค่าตรง จึงใช้รอได้ด้วย (ถ้า dnShop ยังไม่มี ?. ให้ undefined แทนที่จะ error)
  await expect.poll(() => page.evaluate(() => (window as DnShopWindow).dnShop?.version)).toBe("1.0.0");

  // ฟังก์ชันที่ส่งให้ evaluate รันใน browser จึงใช้ตัวแปรของ test ตรงๆ ไม่ได้ ต้องส่งผ่านอาร์กิวเมนต์ตัวที่สอง
  // (ตัวเดียวเท่านั้น ถ้ามีหลายค่าให้ห่อเป็น array หรือ object)
  const text = await page.evaluate((prefix) => `${prefix}${(window as DnShopWindow).dnShop?.version}`, "v");
  expect(text).toBe("v1.0.0");
});


// ------------------------------------------------
// ตัวอย่างที่ 2: เก็บข้อความ console ด้วย page.on("console") และดูชนิดด้วย msg.type()
// ------------------------------------------------
test("หน้า console: เก็บข้อความ log และ warn ที่หน้าเขียนออกมา", async ({ page }) => {
  // เก็บเป็นรูป "ชนิด: ข้อความ" ลงอาร์เรย์
  const messages: string[] = [];
  // ต้องลงทะเบียน listener ก่อน goto ไม่งั้นข้อความที่หน้าเขียนตอนโหลดจะพลาดไป
  page.on("console", (msg) => messages.push(`${msg.type()}: ${msg.text()}`));

  await page.goto("/playground/console");

  // ตอนโหลดเสร็จ หน้าเขียน console.log("หน้า console พร้อมแล้ว") ซึ่งเป็นสัญญาณว่า hydrate แล้ว
  await expect.poll(() => messages).toContain("log: หน้า console พร้อมแล้ว");

  await page.getByRole("button", { name: "log ข้อความ" }).click();
  await page.getByRole("button", { name: "เตือน" }).click();

  // console.warn มีชนิด "warning" (ไม่ใช่ "warn")
  await expect.poll(() => messages).toContain("log: กดปุ่มแล้ว");
  await expect.poll(() => messages).toContain("warning: ระวัง: สินค้าใกล้หมด");
});


// ------------------------------------------------
// ข้อ 1: เหมือนตัวอย่างที่ 1 ตอนแรก แต่คืนค่าอีกอย่าง: ชนิดของ dnShop.getGreeting
// แนวทาง: รอให้ dnShop พร้อมเหมือนตัวอย่างที่ 1 แล้ว await page.evaluate(() => typeof (window as DnShopWindow).dnShop?.getGreeting)
//        ตรวจว่าได้ "function"
// ------------------------------------------------
test("หน้า console: dnShop.getGreeting เป็นฟังก์ชัน", async ({ page }) => {
  await page.goto("/playground/console");
  // รอสัญญาณพร้อม (hydrate แล้ว) ก่อน: window.dnShop ถูกสร้างหลัง mount ไม่ใช่ทันทีที่ goto จบ
  await expect.poll(() => page.evaluate(() => (window as DnShopWindow).dnShop?.version)).toBe("1.0.0");

  // typeof ใน browser ได้สตริง "function" ส่งกลับมาเป็นข้อมูลธรรมดา (ส่งตัวฟังก์ชันกลับมาตรงๆ ไม่ได้)
  const kind = await page.evaluate(() => typeof (window as DnShopWindow).dnShop?.getGreeting);
  expect(kind).toBe("function");
});


// ------------------------------------------------
// ข้อ 2: ส่ง argument หลายค่าเข้า evaluate (ห่อเป็น object)
// แนวทาง: await page.evaluate(({ a, b }) => a + b, { a: 2, b: 3 }) ตรวจว่าได้ 5
//        แล้วลองอีกอัน: ส่ง { label: "รุ่น" } แล้วคืน `${label} ${window.dnShop.version}` ตรวจว่าได้ "รุ่น 1.0.0"
//        (รอให้ dnShop พร้อมก่อนเหมือนตัวอย่างที่ 1)
// ------------------------------------------------
test("หน้า console: ส่ง object เป็น argument ให้ evaluate", async ({ page }) => {
  await page.goto("/playground/console");
  // รอสัญญาณพร้อม (hydrate แล้ว) ก่อน: window.dnShop ถูกสร้างหลัง mount ไม่ใช่ทันทีที่ goto จบ
  await expect.poll(() => page.evaluate(() => (window as DnShopWindow).dnShop?.version)).toBe("1.0.0");

  // ส่ง argument ได้ค่าเดียว จึงห่อหลายค่าเป็น object แล้วแตกค่าด้วย destructuring ในฟังก์ชัน
  const sum = await page.evaluate(({ a, b }) => a + b, { a: 2, b: 3 });
  expect(sum).toBe(5);

  const text = await page.evaluate(({ label }) => `${label} ${(window as DnShopWindow).dnShop?.version}`, { label: "รุ่น" });
  expect(text).toBe("รุ่น 1.0.0");
});


// ------------------------------------------------
// ข้อ 3: ใช้ evaluate เรียกฟังก์ชันของหน้าภายใต้เวลาที่กำหนด (ใช้ความรู้จากบท 31)
// แนวทาง: page.clock.setFixedTime(new Date("2026-11-12T13:00:00+07:00")) ก่อน goto("/playground/console")
//        รอให้ dnShop พร้อม แล้ว evaluate(() => window.dnShop.getGreeting()) ตรวจว่าได้ "สวัสดีตอนบ่าย"
// ------------------------------------------------
test("หน้า console: getGreeting ตอนบ่ายโมงได้สวัสดีตอนบ่าย", async ({ page }) => {
  // ตั้งเวลาก่อน goto (บท 31) getGreeting อ่าน new Date().getHours() ตอนเรียก ซึ่งได้เวลาปลอม 13:00 ในเวลาไทย
  await page.clock.setFixedTime(new Date("2026-11-12T13:00:00+07:00"));
  await page.goto("/playground/console");
  await expect.poll(() => page.evaluate(() => (window as DnShopWindow).dnShop?.version)).toBe("1.0.0");

  const greeting = await page.evaluate(() => (window as DnShopWindow).dnShop?.getGreeting());
  expect(greeting).toBe("สวัสดีตอนบ่าย");
});


// ------------------------------------------------
// ข้อ 4: จับ console.warn ด้วย waitForEvent("console")
// แนวทาง: รอให้หน้าพร้อม (รอให้ dnShop มีค่า) แล้วสร้าง promise ก่อนกดปุ่ม:
//        const warnPromise = page.waitForEvent("console", (msg) => msg.type() === "warning")
//        กดปุ่ม "เตือน" แล้ว const msg = await warnPromise ตรวจ msg.text() เท่ากับ "ระวัง: สินค้าใกล้หมด"
// ------------------------------------------------
test("หน้า console: จับข้อความเตือนด้วย waitForEvent", async ({ page }) => {
  await page.goto("/playground/console");
  // รอสัญญาณพร้อม (hydrate แล้ว) ก่อน: window.dnShop ถูกสร้างหลัง mount ไม่ใช่ทันทีที่ goto จบ
  await expect.poll(() => page.evaluate(() => (window as DnShopWindow).dnShop?.version)).toBe("1.0.0");

  // สร้าง promise ก่อนกดปุ่ม (ไม่ await) เพราะ event เกิดทันทีที่กด ถ้าสร้างทีหลังอาจพลาด
  // ใส่เงื่อนไขชนิด "warning" เพื่อไม่ให้ไปจับ console.log ตัวอื่น
  const warnPromise = page.waitForEvent("console", (msg) => msg.type() === "warning");
  await page.getByRole("button", { name: "เตือน" }).click();

  const msg = await warnPromise;
  expect(msg.text()).toBe("ระวัง: สินค้าใกล้หมด");
});


// ------------------------------------------------
// ข้อ 5: จับ error ที่ไม่มีใครดักด้วย pageerror
// แนวทาง: รอให้หน้าพร้อมเหมือนข้อ 4 แล้ว const errorPromise = page.waitForEvent("pageerror") ก่อนกด "ทำให้ error"
//        ตรวจ error.message เท่ากับ "เกิดข้อผิดพลาดที่ไม่คาดคิด" (error ถูกโยนหลังกดปุ่มเล็กน้อย ด้วย setTimeout)
// ------------------------------------------------
test("หน้า console: กดทำให้ error แล้วจับ pageerror ได้", async ({ page }) => {
  await page.goto("/playground/console");
  // รอสัญญาณพร้อม (hydrate แล้ว) ก่อน: window.dnShop ถูกสร้างหลัง mount ไม่ใช่ทันทีที่ goto จบ
  await expect.poll(() => page.evaluate(() => (window as DnShopWindow).dnShop?.version)).toBe("1.0.0");

  // error ถูกโยนจาก setTimeout หลังกดปุ่ม จึงต้องรอ event ไม่ใช่ตรวจทันที
  const errorPromise = page.waitForEvent("pageerror");
  await page.getByRole("button", { name: "ทำให้ error" }).click();

  const error = await errorPromise;
  expect(error.message).toBe("เกิดข้อผิดพลาดที่ไม่คาดคิด");
});


// ------------------------------------------------
// ข้อ 6: อ่านย้อนหลังด้วย page.consoleMessages() และ page.pageErrors() (มีใน Playwright 1.65)
// แนวทาง: ไม่ต้องลงทะเบียน listener ล่วงหน้า กด "log ข้อความ" และ "ทำให้ error" หลังหน้าพร้อม
//        ใช้ expect.poll(async () => (await page.consoleMessages()).map((m) => m.text())).toContain("กดปุ่มแล้ว")
//        และ expect.poll(async () => (await page.pageErrors()).map((e) => e.message)).toContain("เกิดข้อผิดพลาดที่ไม่คาดคิด")
// ------------------------------------------------
test("หน้า console: อ่านข้อความและ error ย้อนหลังด้วย consoleMessages และ pageErrors", async ({ page }) => {
  await page.goto("/playground/console");
  // รอสัญญาณพร้อม (hydrate แล้ว) ก่อน: window.dnShop ถูกสร้างหลัง mount ไม่ใช่ทันทีที่ goto จบ
  await expect.poll(() => page.evaluate(() => (window as DnShopWindow).dnShop?.version)).toBe("1.0.0");

  await page.getByRole("button", { name: "log ข้อความ" }).click();
  await page.getByRole("button", { name: "ทำให้ error" }).click();

  // consoleMessages/pageErrors เก็บให้เองโดยไม่ต้อง page.on ล่วงหน้า ใช้ expect.poll รอจนข้อมูลมาถึง
  await expect.poll(async () => (await page.consoleMessages()).map((m) => m.text())).toContain("กดปุ่มแล้ว");
  await expect.poll(async () => (await page.pageErrors()).map((e) => e.message)).toContain("เกิดข้อผิดพลาดที่ไม่คาดคิด");
});
