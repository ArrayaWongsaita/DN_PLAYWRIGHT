import { readFile } from "node:fs/promises";
import { test, expect } from "./fixtures";

// ================================================
// บทที่ 55: โปรเจกต์ปิดท้าย เขียน test ทั้งเส้นทางการซื้อของ (เฉลย)
// เฉลยนี้เป็นหนึ่งในหลายวิธีที่ถูก สิ่งที่ควรเทียบกับงานของคุณคือ "การแบ่งหน้าที่" ไม่ใช่ชื่อ method ทุกตัว
//   - Page Object (pages/) รู้ว่าแต่ละหน้ามี locator อะไรและทำอะไรได้
//   - ShopApi (pages/ShopApi.ts) เตรียมข้อมูลผ่าน API ในข้อที่หน้านั้นไม่ใช่เป้าหมาย
//   - ตัว test บอกว่าตรวจอะไร (expect อยู่ใน test ไม่ได้อยู่ใน Page Object ตามบท 38)
// รันด้วย: pnpm test --config lessons/55-capstone/playwright.config.ts
// ================================================

// บัตรที่แอปยอมรับ (ค่า VALID_CARD ของฟอร์มบัตร)
const VALID_CARD = "4242 4242 4242 4242";
const BOOK_TS = "หนังสือ TypeScript เบื้องต้น"; // p08 ราคา 390
const BOOK_PW = "หนังสือ Playwright ฉบับลงมือทำ"; // p09 ราคา 450


// ------------------------------------------------
// ข้อ 1: login ผ่าน storageState (requirement ข้อ 1)
// ------------------------------------------------
test("เริ่มต้นทุก test ด้วยสถานะที่ login แล้ว", async ({ page, header }) => {
  // ไม่มีโค้ด login ในนี้เลย: ไฟล์ .auth/user.json จาก auth.setup.ts ทำให้ context เริ่มต้นเป็นคนที่ login แล้ว
  await page.goto("/");

  // login แล้ว: เมนูต้องมี "บัญชีของฉัน" กับปุ่ม "ออกจากระบบ" และไม่มีลิงก์ "เข้าสู่ระบบ"
  await expect(header.accountLink).toBeVisible();
  await expect(header.logoutButton).toBeVisible();
  // toHaveCount(0) คือยืนยันว่า "ไม่มี" element นี้ (ใช้ toBeHidden ก็ได้ แต่ count ตรงกว่า)
  await expect(header.loginLink).toHaveCount(0);
});


// ------------------------------------------------
// ข้อ 2: ค้นหาสินค้า (requirement ข้อ 2)
// ------------------------------------------------
test("ค้นหา หนังสือ แล้วพบสองรายการ", async ({ productsPage }) => {
  await productsPage.goto();
  await productsPage.search("หนังสือ");

  // หน้า /products ดึงข้อมูลจาก API ฝั่ง browser: assertion ที่รอได้เองจึงรอจนรายการอัปเดตให้
  // ตรวจทั้งจำนวนและชื่อ เพราะจำนวนอย่างเดียวไม่บอกว่าได้ "สินค้าถูกตัว"
  await expect(productsPage.items).toHaveCount(2);
  await expect(productsPage.resultCount).toHaveText("พบสินค้า 2 รายการ");
  await expect(productsPage.card(BOOK_TS)).toBeVisible();
  await expect(productsPage.card(BOOK_PW)).toBeVisible();
});


// ------------------------------------------------
// ข้อ 3: เพิ่มสินค้าหลายชิ้นจากหน้าสินค้า (requirement ข้อ 3)
// ------------------------------------------------
test("เพิ่มหนังสือสองเล่มแล้วตะกร้ามียอดรวม 840 บาท", async ({ productsPage, header, cartPage }) => {
  await productsPage.goto();
  await productsPage.search("หนังสือ");
  await expect(productsPage.items).toHaveCount(2);

  // addToCart รอข้อความสถานะของแต่ละชิ้นก่อนจบ จึงเรียกติดกันได้โดยไม่ต้องหน่วงเวลา (เหตุผลอยู่ใน pages/ProductsPage.ts)
  await productsPage.addToCart(BOOK_TS);
  await productsPage.addToCart(BOOK_PW);

  // จำนวนในหัวเว็บ: ทั้งสองครั้งสำเร็จแล้วต้องเป็น 2
  await expect(header.cartCount).toHaveText("2");

  await cartPage.goto();
  await expect(cartPage.items).toHaveCount(2);
  // 390 + 450 = 840
  await expect(cartPage.subtotal).toHaveText("840 บาท");
});


// ------------------------------------------------
// ข้อ 4: ใช้โค้ดส่วนลด (requirement ข้อ 4)
// ------------------------------------------------
test("ใช้โค้ด DN10 แล้วได้ส่วนลด 10%", async ({ shop, cartPage }) => {
  // หน้าตะกร้าคือสิ่งที่ทดสอบ แต่การ "ใส่ของลงตะกร้า" ไม่ใช่ จึงเตรียมด้วย API (เร็วและไม่พึ่งหน้า /products)
  await shop.addToCart("p08");
  await shop.addToCart("p09");

  await cartPage.goto();
  await cartPage.applyCoupon("DN10");

  await expect(cartPage.couponStatus).toHaveText("ใช้โค้ด DN10 แล้ว ลด 10%");
  // ส่วนลด = Math.round(840 x 0.1) = 84 และยอดสุทธิ = 840 - 84 = 756
  await expect(cartPage.discount).toHaveText("84 บาท");
  await expect(cartPage.total).toHaveText("756 บาท");
});


// ------------------------------------------------
// ข้อ 5: ชำระเงินด้วยบัตรเครดิต (requirement ข้อ 5)
// ------------------------------------------------
test("ชำระเงินด้วยบัตรผ่าน iframe แล้วได้หน้าสั่งซื้อสำเร็จ", async ({ page, shop, checkoutPage, orderPage }) => {
  // เตรียมตะกร้าด้วย API: หน้าที่ทดสอบคือการชำระเงิน ไม่ใช่การเลือกสินค้า
  await shop.addToCart("p08");

  await checkoutPage.goto();
  await checkoutPage.fillRecipient("สมชาย ใจดี", "99 ถนนสุขุมวิท กรุงเทพฯ", "0812345678");
  // 390 + ส่งธรรมดา 50 = 440 (ตรวจก่อนจ่ายว่ายอดบนหน้าถูก)
  await expect(checkoutPage.orderTotal).toHaveText("440 บาท");

  await checkoutPage.payWithCard(VALID_CARD);
  await checkoutPage.placeOrder();

  // คำสั่งซื้อแรกของ session นี้ได้ DN-0001 เสมอ (session แยกต่อ test เพราะ auth.setup.ts ลบ dn_sid)
  await expect(page).toHaveURL("/orders/DN-0001");
  await expect(orderPage.heading).toBeVisible();
  await expect(orderPage.netTotal).toContainText("440 บาท");
});


// ------------------------------------------------
// ข้อ 6: ดาวน์โหลดใบเสร็จ (requirement ข้อ 6)
// ------------------------------------------------
test("ดาวน์โหลดใบเสร็จของคำสั่งซื้อ", async ({ shop, orderPage }, testInfo) => {
  // เตรียมทั้งตะกร้าและคำสั่งซื้อด้วย API: ข้อนี้สนใจแค่ "ปุ่มดาวน์โหลดบนหน้าคำสั่งซื้อ"
  await shop.addToCart("p08");
  const orderId = await shop.placeOrder();
  expect(orderId).toBe("DN-0001");

  await orderPage.goto(orderId);
  const download = await orderPage.downloadReceipt();

  expect(download.suggestedFilename()).toBe("receipt-DN-0001.txt");
  // บันทึกไฟล์ลงโฟลเดอร์ผลลัพธ์ของ test นี้ (แยกต่อ test จึงไม่ชนกันเวลารันขนาน) แล้วอ่านเนื้อหาด้วย Node
  const savedPath = testInfo.outputPath(download.suggestedFilename());
  await download.saveAs(savedPath);
  const content = await readFile(savedPath, "utf8");
  expect(content.split("\n")[0]).toBe("DN Shop - ใบเสร็จ");
  expect(content).toContain("หมายเลขคำสั่งซื้อ: DN-0001");
});


// ------------------------------------------------
// ข้อ 7: เส้นทางเต็มตั้งแต่ค้นหาถึงดูประวัติ
// ------------------------------------------------
test("ซื้อของตั้งแต่ค้นหาจนเห็นประวัติคำสั่งซื้อ", async ({
  page,
  productsPage,
  header,
  cartPage,
  checkoutPage,
  orderPage,
  accountPage,
}, testInfo) => {
  // test นี้ใช้ UI ทุกขั้นตามที่โจทย์ระบุ ไม่เตรียมด้วย API ส่วนแต่ละ test ข้างบนเป็นเพียงชิ้นส่วนของเส้นทางนี้
  await test.step("ค้นหาและเพิ่มหนังสือสองเล่ม", async () => {
    await productsPage.goto();
    await productsPage.search("หนังสือ");
    await expect(productsPage.items).toHaveCount(2);
    await productsPage.addToCart(BOOK_TS);
    await productsPage.addToCart(BOOK_PW);
    await expect(header.cartCount).toHaveText("2");
  });

  await test.step("ใช้โค้ดส่วนลดในตะกร้า", async () => {
    await cartPage.goto();
    await expect(cartPage.subtotal).toHaveText("840 บาท");
    await cartPage.applyCoupon("DN10");
    await expect(cartPage.total).toHaveText("756 บาท");
    await cartPage.checkoutButton.click();
    await expect(page).toHaveURL("/checkout");
  });

  await test.step("กรอกข้อมูลและจ่ายด้วยบัตร", async () => {
    await checkoutPage.fillRecipient("สมชาย ใจดี", "99 ถนนสุขุมวิท กรุงเทพฯ", "0812345678");
    // 756 + ค่าส่งธรรมดา 50 = 806
    await expect(checkoutPage.orderTotal).toHaveText("806 บาท");
    await checkoutPage.payWithCard(VALID_CARD);
    await checkoutPage.placeOrder();
    await expect(page).toHaveURL("/orders/DN-0001");
    await expect(orderPage.heading).toBeVisible();
    await expect(orderPage.netTotal).toContainText("806 บาท");
  });

  await test.step("ดาวน์โหลดใบเสร็จ", async () => {
    const download = await orderPage.downloadReceipt();
    expect(download.suggestedFilename()).toBe("receipt-DN-0001.txt");
    const savedPath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(savedPath);
    const content = await readFile(savedPath, "utf8");
    expect(content.split("\n")[0]).toBe("DN Shop - ใบเสร็จ");
    // ใบเสร็จต้องสะท้อนส่วนลดที่ใช้
    expect(content).toContain("ส่วนลด: 84 บาท");
  });

  await test.step("เห็นคำสั่งซื้อในประวัติของบัญชี", async () => {
    await accountPage.goto();
    await expect(accountPage.historyItem("DN-0001")).toContainText("806 บาท");
  });
});
