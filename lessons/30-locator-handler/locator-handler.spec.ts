import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 30: ป๊อปอัปที่โผล่ไม่แน่นอน (page.addLocatorHandler)
// ฝึก: addLocatorHandler, times, noWaitAfter, removeLocatorHandler
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// แอปนี้ปิดแบนเนอร์ไว้เป็นค่าเริ่มต้น ต้องเปิดเองด้วย ?cookieBanner=1 หรือ ?promo=1
// แล้วมันจะโผล่หลังโหลดหน้า 500-2500 ms (สุ่ม) เป็น modal ที่บังการคลิกทั้งหมด และกด Escape ไม่ปิด
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: flow ยาวหลายหน้าที่มีแบนเนอร์คุกกี้โผล่กลางทาง ใช้ addLocatorHandler ปิดให้อัตโนมัติ
// ------------------------------------------------
test("แบนเนอร์คุกกี้: handler ปิดให้ แล้ว flow หน้าแรก > สินค้า > ตะกร้า ผ่านทุกครั้ง", async ({ page }) => {
  // ลงทะเบียน handler ก่อนเริ่ม flow: "ถ้าเห็น dialog ชื่อ การใช้คุกกี้ ให้กดปฏิเสธ"
  // (ลงทะเบียนครั้งเดียว ใช้ได้ตลอด test ทุกหน้า ไม่ต้องเรียกซ้ำเมื่อเปลี่ยนหน้า)
  await page.addLocatorHandler(page.getByRole("dialog", { name: "การใช้คุกกี้" }), async (dialog) => {
    await dialog.getByRole("button", { name: "ปฏิเสธ" }).click();
  });

  await page.goto("/?cookieBanner=1");

  // ทุก action ด้านล่างนี้ไม่มีโค้ดที่รู้เรื่องแบนเนอร์เลย
  // แต่ถ้าแบนเนอร์โผล่มาบังตอนไหน Playwright จะเรียก handler ให้แล้วค่อยทำ action นั้นต่อ
  await page.getByRole("link", { name: "ดูสินค้าทั้งหมด" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "สินค้าทั้งหมด" })).toBeVisible();

  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
  // ตะกร้าเก็บอยู่ฝั่งเซิร์ฟเวอร์ รอให้ตัวเลขข้างลิงก์ตะกร้าเป็น 1 (เพิ่มสำเร็จ) ก่อนไปหน้าตะกร้า ไม่งั้นอาจไปเห็นตะกร้าว่าง
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  await page.getByRole("link", { name: /ตะกร้า/ }).click();

  await expect(page.getByRole("heading", { level: 1, name: "ตะกร้าสินค้า" })).toBeVisible();
  await expect(page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem")).toHaveCount(1);
});


// ------------------------------------------------
// ตัวอย่างที่ 2: ป๊อปอัปโปรโมชัน (?promo=1) ปิดด้วยปุ่ม "ปิด"
// ------------------------------------------------
test("ป๊อปอัปโปรโมชัน: handler กดปิดให้ แล้วเพิ่มสินค้าลงตะกร้าได้", async ({ page }) => {
  // อาร์กิวเมนต์ของ handler (dialog) คือ locator ตัวเดียวกับที่ส่งให้ addLocatorHandler ใช้หาปุ่มข้างในต่อได้เลย
  await page.addLocatorHandler(page.getByRole("dialog", { name: "โปรโมชันพิเศษ" }), async (dialog) => {
    await dialog.getByRole("button", { name: "ปิด" }).click();
  });

  await page.goto("/products?promo=1");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();

  // ข้อความแจ้งผลไม่หายเอง (ตามข้อกำหนดของแอป) จึงตรวจได้ ใช้ filter เพราะหน้านี้อาจมี role=status หลายอัน
  await expect(page.getByRole("status").filter({ hasText: "ลงตะกร้าแล้ว" })).toBeVisible();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
});


// ------------------------------------------------
// ตัวอย่างที่ 3 (ดูอย่างเดียว): ไม่มี handler แล้วพังแบบสุ่ม จึงตั้งเป็น test.fixme ไว้ ไม่ให้ทำให้รายงานแดง
// (ในเฉลยก็ยังเป็น test.fixme ตั้งใจให้ข้ามต่อไป เพราะเป็นตัวอย่างที่พังแบบสุ่ม ไม่ใช่แบบฝึกหัด)
// ลองเปลี่ยน test.fixme เป็น test แล้วรันหลายรอบ (--repeat-each=10) จะเห็นบางรอบผ่าน บางรอบค้างจนหมดเวลา
// ------------------------------------------------
test.fixme("ไม่มี handler: flow เดียวกับตัวอย่างที่ 1 พังแบบสุ่ม", async ({ page }) => {
  // flow เดียวกับตัวอย่างที่ 1 เป๊ะ ต่างกันแค่ไม่มี addLocatorHandler
  await page.goto("/?cookieBanner=1");

  // flow นี้เร็วมาก ถ้าทุกขั้นเสร็จก่อนแบนเนอร์โผล่ (ซึ่งสุ่มโผล่ 0.5-2.5 วินาที) test จะผ่านโดยบังเอิญ
  // แต่ถ้าแบนเนอร์โผล่ระหว่างทาง คลิกถัดไปจะ "ถูกบัง" (element receives pointer events ไม่ผ่าน)
  // Playwright รอแล้วลองใหม่เรื่อยๆ จนหมดเวลาของ test (Test timeout exceeded) ใน call log จะเห็นว่ามี dialog บังอยู่
  await page.getByRole("link", { name: "ดูสินค้าทั้งหมด" }).click();
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
  // ตะกร้าเก็บอยู่ฝั่งเซิร์ฟเวอร์ รอให้ตัวเลขข้างลิงก์ตะกร้าเป็น 1 (เพิ่มสำเร็จ) ก่อนไปหน้าตะกร้า ไม่งั้นอาจไปเห็นตะกร้าว่าง
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  await page.getByRole("link", { name: /ตะกร้า/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "ตะกร้าสินค้า" })).toBeVisible();
});


// ------------------------------------------------
// ข้อ 1: เหมือนตัวอย่างที่ 1 แต่เริ่มที่หน้าสินค้า (/products?cookieBanner=1)
// แนวทาง: ลงทะเบียน handler ที่กด "ปฏิเสธ" เหมือนตัวอย่างที่ 1 ก่อน goto แล้วเพิ่มสินค้า, รอ cart-count เป็น "1", ไปตะกร้า, ตรวจว่ามี 1 รายการ
// ------------------------------------------------
test("แบนเนอร์คุกกี้: เริ่มจากหน้าสินค้าแล้วไปตะกร้า", async ({ page }) => {
  await page.addLocatorHandler(page.getByRole("dialog", { name: "การใช้คุกกี้" }), async (dialog) => {
    await dialog.getByRole("button", { name: "ปฏิเสธ" }).click();
  });

  // ลงทะเบียน handler ก่อน goto เสมอ แล้ว flow ข้างล่างไม่ต้องรู้เรื่องแบนเนอร์เลย ไม่ว่ามันจะโผล่ตอนไหน
  await page.goto("/products?cookieBanner=1");
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
  // ตะกร้าอยู่ฝั่งเซิร์ฟเวอร์ รอให้เพิ่มสำเร็จ (cart-count เป็น 1) ก่อนไปหน้าตะกร้า
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  await page.getByRole("link", { name: /ตะกร้า/ }).click();

  await expect(page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem")).toHaveCount(1);
});


// ------------------------------------------------
// ข้อ 2: ลงทะเบียน handler ของทั้งสองป๊อปอัป แล้วใช้กับทั้งสอง URL (/?cookieBanner=1 และ /?promo=1)
// แนวทาง: ลงทะเบียน handler 2 ตัว (dialog "การใช้คุกกี้" กด "ปฏิเสธ" และ dialog "โปรโมชันพิเศษ" กด "ปิด") ก่อน goto
//        แล้วทำ flow เปิดหน้าสินค้า เพิ่มสินค้า ตรวจ cart-count เป็น "1" ทำซ้ำกับ URL ทั้งสองแบบด้วยการวนลูปสร้าง test (เหมือนบท 22)
//        handler ของป๊อปอัปที่ไม่ได้เปิดจะไม่ทำงานเลย จึงลงทะเบียนไว้ทั้งสองตัวได้โดยไม่เสียหาย (เหมาะจะเขียนเป็นฟังก์ชันใช้ซ้ำทุก test)
//        ข้อควรระวัง: ไม่เปิดสองป๊อปอัปพร้อมกัน (?cookieBanner=1&promo=1) เพราะถ้าโผล่ซ้อนกัน ปุ่มของใบล่างถูกใบบนบัง handler กดไม่ได้ ดู README หัวข้อ 3
// ------------------------------------------------
// วนลูปสร้าง test สองตัว (ชื่อต้องไม่ซ้ำ จึงใส่ URL ในชื่อ) ลงทะเบียน handler ทั้งสองในทุก test
// ป๊อปอัปที่ไม่ได้เปิดไม่โผล่ handler ของมันจึงไม่ทำงาน ไม่เสียหายอะไร
// ไม่เปิดสองใบพร้อมกัน เพราะถ้าโผล่ซ้อนกัน ปุ่มของใบล่างถูกใบบนบัง handler จะติดค้าง (README หัวข้อ 3)
for (const url of ["/?cookieBanner=1", "/?promo=1"]) {
  test(`handler ของทั้งสองป๊อปอัปใช้ได้กับ ${url}`, async ({ page }) => {
    await page.addLocatorHandler(page.getByRole("dialog", { name: "การใช้คุกกี้" }), async (dialog) => {
      await dialog.getByRole("button", { name: "ปฏิเสธ" }).click();
    });
    await page.addLocatorHandler(page.getByRole("dialog", { name: "โปรโมชันพิเศษ" }), async (dialog) => {
      await dialog.getByRole("button", { name: "ปิด" }).click();
    });

    await page.goto(url);
    await page.getByRole("link", { name: "ดูสินค้าทั้งหมด" }).click();
    await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();

    // cart-count เป็น 1 แปลว่าการคลิกเพิ่มสินค้าผ่านไปได้ ไม่ถูกบัง
    await expect(page.getByTestId("cart-count")).toHaveText("1");
  });
}


// ------------------------------------------------
// ข้อ 3: นับจำนวนครั้งที่ handler ทำงาน (ไม่เกิน 1 ครั้ง)
// แนวทาง: ลงทะเบียน handler ของแบนเนอร์คุกกี้ที่เพิ่มตัวนับ (let count = 0; ... count++) แล้วกด "ปฏิเสธ"
//        ทำ flow เหมือนตัวอย่างที่ 1 (goto("/?cookieBanner=1") > ดูสินค้าทั้งหมด > เพิ่มสินค้า > รอ cart-count เป็น "1" > ตะกร้า) จบด้วย expect(count).toBeLessThanOrEqual(1)
//        ทำไมไม่ใช่ toBe(1): ถ้า flow เสร็จก่อนแบนเนอร์โผล่ handler จะไม่ทำงานเลย (0 ครั้ง) แต่แบนเนอร์ถูกปิดแล้วไม่โผล่อีก จึงไม่เกิน 1
//        (อย่ารอแบนเนอร์ด้วย expect(dialog).toBeVisible() เพราะ expect ก็ทำให้ handler ทำงานและปิดแบนเนอร์ก่อน ดู README หัวข้อ 3)
// ------------------------------------------------
test("นับจำนวนครั้งที่ handler ทำงาน", async ({ page }) => {
  let count = 0;
  const dialog = page.getByRole("dialog", { name: "การใช้คุกกี้" });
  await page.addLocatorHandler(dialog, async () => {
    count++;
    await dialog.getByRole("button", { name: "ปฏิเสธ" }).click();
  });

  await page.goto("/?cookieBanner=1");
  await page.getByRole("link", { name: "ดูสินค้าทั้งหมด" }).click();
  await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
  // ตะกร้าอยู่ฝั่งเซิร์ฟเวอร์ รอให้เพิ่มสำเร็จ (cart-count เป็น 1) ก่อนไปหน้าตะกร้า
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  await page.getByRole("link", { name: /ตะกร้า/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "ตะกร้าสินค้า" })).toBeVisible();

  // แบนเนอร์ถูกปิดแล้วไม่โผล่อีก จึงทำงานได้มากที่สุด 1 ครั้ง
  // ไม่ใช้ toBe(1) เพราะถ้า flow เสร็จก่อนแบนเนอร์โผล่ (สุ่ม 0.5-2.5 วินาที) ตัวนับจะเป็น 0
  expect(count).toBeLessThanOrEqual(1);
});


// ------------------------------------------------
// ข้อ 4: handler ทำงานแล้วถอดออกด้วย page.removeLocatorHandler หลังถอดแล้ว handler ต้องไม่ทำงานอีก
// แนวทาง: goto("/") เก็บ locator ของ h1 "DN Shop" ไว้ในตัวแปร (หัวข้อมองเห็นตลอด ทำให้ handler ทำงานได้แน่นอนไม่สุ่ม)
//        ลงทะเบียน handler ด้วย locator นั้นที่ทำแค่ count++ ใส่ { noWaitAfter: true } (เพราะหัวข้อไม่หายหลัง handler ดู README หัวข้อ 5)
//        hover ลิงก์ "หน้าแรก" หนึ่งครั้ง ตรวจ expect(count).toBeGreaterThan(0) แล้วจำค่าไว้ (const before = count)
//        (หนึ่ง action อาจทำให้ handler ทำงานมากกว่า 1 ครั้ง เพราะ Playwright ตรวจก่อนลองทำและตรวจซ้ำระหว่างทาง จึงไม่ตรวจว่า count เท่ากับ 1 พอดี)
//        แล้ว await page.removeLocatorHandler(หัวข้อ) (ต้องส่ง locator ตัวเดิมที่ใช้ตอนลงทะเบียน) hover อีกครั้ง ตรวจว่า count ยังเท่า before
//        (ส่วนแบนเนอร์ที่บังการคลิกเมื่อไม่มี handler ดูตัวอย่างที่ 3)
// ------------------------------------------------
test("ถอด handler แล้ว handler ไม่ทำงานอีก", async ({ page }) => {
  await page.goto("/");

  // handler บน h1 ที่มองเห็นตลอด จึงทำงานแน่นอนเมื่อมี action (ไม่สุ่มเหมือนแบนเนอร์) noWaitAfter เพราะ h1 ไม่หายหลังรัน handler
  let count = 0;
  const heading = page.getByRole("heading", { level: 1, name: "DN Shop" });
  await page.addLocatorHandler(
    heading,
    async () => {
      count++;
    },
    { noWaitAfter: true },
  );

  const home = page.getByRole("link", { name: "หน้าแรก" });
  await home.hover();
  // action เดียวอาจเรียก handler มากกว่า 1 ครั้ง (ตรวจก่อนทำและตรวจซ้ำระหว่างทาง) จึงตรวจแค่ว่าทำงานแล้ว
  expect(count).toBeGreaterThan(0);
  const before = count;

  // ถอดด้วย locator ตัวเดิม หลังจากนี้ action ต่อไปไม่เรียก handler อีก
  await page.removeLocatorHandler(heading);
  await home.hover();
  expect(count).toBe(before);
});


// ------------------------------------------------
// ข้อ 5: handler บนสิ่งที่ไม่หายไป ต้องใช้ noWaitAfter และจำกัดด้วย times
// แนวทาง: goto("/") ลงทะเบียน handler บน locator ของหัวข้อ h1 "DN Shop" (หัวข้อมองเห็นตลอด) ที่ทำแค่ count++
//        ใส่ options { noWaitAfter: true, times: 2 }
//        (ถ้าไม่ใส่ noWaitAfter Playwright จะรอให้หัวข้อหายไปหลังรัน handler แล้วหมดเวลา เพราะหัวข้อไม่เคยหาย)
//        แล้วทำ action ปลอดภัยสัก 4 ครั้งบนหน้านี้ เช่น hover ลิงก์ "หน้าแรก" 4 ครั้ง
//        ตรวจ expect(count).toBe(2) (handler ถูกถอดเองหลังทำงานครบ 2 ครั้ง)
// ------------------------------------------------
test("times และ noWaitAfter: handler ทำงานแค่ 2 ครั้ง", async ({ page }) => {
  let count = 0;
  await page.goto("/");

  // h1 อยู่บนหน้าตลอด ไม่หายหลังรัน handler จึงต้องใส่ noWaitAfter: true ไม่งั้น Playwright รอให้มันหายจนหมดเวลา
  // times: 2 ให้ handler ถอดตัวเองหลังทำงานครบ 2 ครั้ง
  await page.addLocatorHandler(
    page.getByRole("heading", { level: 1, name: "DN Shop" }),
    async () => {
      count++;
    },
    { noWaitAfter: true, times: 2 },
  );

  // hover ไม่เปลี่ยนหน้า ทำ 4 ครั้งแต่ handler ทำงานแค่ 2 ครั้ง
  const home = page.getByRole("link", { name: "หน้าแรก" });
  for (let i = 0; i < 4; i++) {
    await home.hover();
  }

  expect(count).toBe(2);
});
