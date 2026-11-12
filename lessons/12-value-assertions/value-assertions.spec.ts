import { test, expect, type Page } from "@playwright/test";

// ================================================
// บทที่ 12: ตรวจค่า ข้อความ attribute class และจำนวน
// ฝึก: toHaveValue, toHaveText, toHaveAttribute, toHaveClass, toHaveCount, .not
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// ตัวช่วยของบทนี้: เปิดหน้า /products กดเพิ่มสินค้าที่ชื่อตรงกับ name ลงตะกร้า
// แล้วรอให้แอปแจ้งว่าเพิ่มสำเร็จ (ข้อความ role="status") ก่อนค่อยไปต่อ
// ตัวช่วยนี้เขียนให้แล้ว ไม่ต้องแก้ เรียกใช้ได้เลย เช่น await addToCart(page, "หูฟังไร้สาย DN Buds")
async function addToCart(page: Page, name: string) {
  await page.goto("/products");
  // หา <li> ของสินค้าชิ้นนั้น แล้วกดปุ่ม "เพิ่มลงตะกร้า" ที่อยู่ข้างใน
  await page
    .getByRole("listitem")
    .filter({ hasText: name })
    .getByRole("button", { name: "เพิ่มลงตะกร้า" })
    .click();
  // role="status" ตรงข้อความนี้ = เซิร์ฟเวอร์รับของลงตะกร้าแล้ว
  await expect(page.getByRole("status").filter({ hasText: `เพิ่ม "${name}" ลงตะกร้าแล้ว` })).toBeVisible();
}


// ------------------------------------------------
// ตัวอย่างที่ 1: ตะกร้ามีหูฟัง 1 ชิ้น กดเพิ่มจำนวนในตะกร้าเป็น 2 แล้วตรวจจำนวนและยอดรวม (toHaveValue, toHaveText)
// ------------------------------------------------
test("หน้า /cart เพิ่มจำนวนหูฟังเป็น 2 แล้วยอดรวมต้องเป็น 2,580 บาท", async ({ page }) => {
  await addToCart(page, "หูฟังไร้สาย DN Buds");
  await page.goto("/cart");

  // ช่องจำนวนเป็น <input> จึงตรวจ "ค่าในช่อง" ด้วย toHaveValue (ค่าเป็นข้อความเสมอ จึงเขียน "1" ไม่ใช่ 1)
  await expect(page.getByRole("textbox", { name: "จำนวน" })).toHaveValue("1");

  await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
  await expect(page.getByRole("textbox", { name: "จำนวน" })).toHaveValue("2");
  // ยอดรวมเป็นข้อความธรรมดา (ไม่ใช่ช่องกรอก) ใช้ toHaveText และต้องตรงทั้งข้อความ รวมคำว่า " บาท" ด้วย
  // getByTestId หา element จาก data-testid ที่นักพัฒนาใส่ไว้ให้ (บท 05)
  await expect(page.getByTestId("subtotal")).toHaveText("2,580 บาท");
});


// ------------------------------------------------
// ตัวอย่างที่ 2: ดับเบิลคลิกรูปสินค้า แล้ว class "zoomed" ต้องโผล่ (toHaveClass และ .not)
// ------------------------------------------------
test("หน้าสินค้า p01 ดับเบิลคลิกรูปแล้วต้องมี class zoomed", async ({ page }) => {
  await page.goto("/products/p01");
  const image = page.getByRole("img", { name: "หูฟังไร้สาย DN Buds" });

  // .not กลับความหมายของ assertion: "ต้องไม่มี class zoomed" (regex แปลว่าขอแค่มีคำนี้อยู่ในรายการ class)
  await expect(image).not.toHaveClass(/zoomed/);
  await image.dblclick();
  // class ของรูปมีหลายตัว (detail-image zoomed) ถ้าเขียน string จะต้องตรงทั้งหมด ใช้ regex ปลอดภัยกว่า
  await expect(image).toHaveClass(/zoomed/);
});


// ------------------------------------------------
// ข้อ 1: ตะกร้ามีหูฟัง 1 ชิ้น กดเพิ่มจำนวนในตะกร้า 2 ครั้ง ช่องจำนวนต้องเป็น "3" และยอดรวมสินค้า (subtotal) ต้องเป็น "3,870 บาท"
// แนวทาง: เหมือนตัวอย่างที่ 1 แต่กด "เพิ่มจำนวน" สองครั้ง (1,290 x 3 = 3,870)
//        ในตะกร้า ปุ่มเพิ่มจำนวนส่งค่าไปเซิร์ฟเวอร์แล้วค่อยอัปเดตหน้า จึงควรตรวจ toHaveValue("2") ก่อนกดครั้งที่สอง
// ------------------------------------------------
test("หน้า /cart เพิ่มจำนวนหูฟังเป็น 3 แล้วยอดรวมต้องเป็น 3,870 บาท", async ({ page }) => {
  await addToCart(page, "หูฟังไร้สาย DN Buds");
  await page.goto("/cart");
  const quantity = page.getByRole("textbox", { name: "จำนวน" });

  // กดทีละครั้งแล้วตรวจค่าก่อนกดต่อ เพราะปุ่มส่งค่าไปเซิร์ฟเวอร์แล้วค่อยอัปเดตหน้า
  // ถ้ากดสองครั้งติดกันโดยไม่รอ ครั้งที่สองอาจใช้ค่าเก่าและได้ 2 แทนที่จะเป็น 3
  await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
  await expect(quantity).toHaveValue("2");
  await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
  await expect(quantity).toHaveValue("3");
  // 1,290 x 3 = 3,870 ข้อความต้องตรงทั้งหมดรวมคำว่า " บาท"
  await expect(page.getByTestId("subtotal")).toHaveText("3,870 บาท");
});


// ------------------------------------------------
// ข้อ 2: ตรวจ href ของลิงก์สองจุดด้วย toHaveAttribute
//        (ก) หน้า /products ลิงก์ชื่อ "หูฟังไร้สาย DN Buds" ต้องมี href เป็น "/products/p01"
//        (ข) หน้า /cart ตอนตะกร้าว่าง ลิงก์ "เลือกซื้อสินค้า" ต้องมี href เป็น "/products"
// แนวทาง: toHaveAttribute("href", "...") ตรวจค่า attribute ของ element เดียว ลิงก์หาด้วย getByRole("link", ...)
// ------------------------------------------------
test("ลิงก์สินค้าและลิงก์เลือกซื้อสินค้ามี href ถูกต้อง", async ({ page }) => {
  await page.goto("/products");
  // ชื่อสินค้าเป็นลิงก์ (h2 ที่ครอบด้วย <a>) href ต้องชี้ไปหน้ารายละเอียดของสินค้านั้น
  await expect(page.getByRole("link", { name: "หูฟังไร้สาย DN Buds" })).toHaveAttribute("href", "/products/p01");

  // ตะกร้าว่างมีลิงก์ชวนไปเลือกซื้อ ตรวจที่ href (ไม่ต้องคลิกก็รู้ว่าไปไหน)
  await page.goto("/cart");
  await expect(page.getByRole("link", { name: "เลือกซื้อสินค้า" })).toHaveAttribute("href", "/products");
});


// ------------------------------------------------
// ข้อ 3: หน้าสินค้า p01 ดับเบิลคลิกรูปแล้ว class ต้องมี zoomed ดับเบิลคลิกอีกครั้งต้องไม่มี zoomed
// แนวทาง: ต่อจากตัวอย่างที่ 2 ดับเบิลคลิกอีกครั้งแล้วตรวจด้วย .not.toHaveClass(/zoomed/)
//        ตรวจข้อความใต้รูปด้วยก็ได้: "ดับเบิลคลิกเพื่อขยายรูป" / "ดับเบิลคลิกเพื่อย่อรูป" (toHaveText)
// ------------------------------------------------
test("หน้าสินค้า p01 ดับเบิลคลิกรูปสองครั้งแล้ว class zoomed หายไป", async ({ page }) => {
  await page.goto("/products/p01");
  const image = page.getByRole("img", { name: "หูฟังไร้สาย DN Buds" });
  const caption = page.getByText("ดับเบิลคลิกเพื่อ", { exact: false });

  await image.dblclick();
  await expect(image).toHaveClass(/zoomed/);
  await expect(caption).toHaveText("ดับเบิลคลิกเพื่อย่อรูป");

  // ดับเบิลคลิกอีกครั้งสลับกลับ ใช้ .not เพราะไม่มี assertion ตรงข้ามของ toHaveClass
  await image.dblclick();
  await expect(image).not.toHaveClass(/zoomed/);
  await expect(caption).toHaveText("ดับเบิลคลิกเพื่อขยายรูป");
});


// ------------------------------------------------
// ข้อ 4: ตะกร้าว่าง รายการ "สินค้าในตะกร้า" ต้องมี 0 แถว (ยังไม่มีรายการ) พอเพิ่มหูฟังและคีย์บอร์ดเครื่องกลแล้ว
//        รายการ listitem ในลิสต์ "สินค้าในตะกร้า" ต้องมี 2 แถว (toHaveCount)
// แนวทาง: ใช้ตัวช่วย addToCart สองครั้ง (หูฟังไร้สาย DN Buds และ คีย์บอร์ดเครื่องกล) แล้วไปที่ /cart
//        ลิสต์หาด้วย getByRole("list", { name: "สินค้าในตะกร้า" }) ต่อด้วย .getByRole("listitem")
//        toHaveCount(0) ใช้ตรวจว่า "ไม่มี element นี้เลย" ได้
// ------------------------------------------------
test("หน้า /cart ตะกร้าว่างไม่มีรายการ เพิ่มสินค้าสองชิ้นแล้วมี 2 รายการ", async ({ page }) => {
  await page.goto("/cart");
  // เก็บ locator ไว้ในตัวแปร ใช้ซ้ำได้ทั้งก่อนและหลังเพิ่มสินค้า (locator หา element ใหม่ทุกครั้งที่ใช้)
  const items = page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem");
  // ตะกร้าว่างไม่มีลิสต์เลย toHaveCount(0) จึงผ่าน
  await expect(items).toHaveCount(0);

  await addToCart(page, "หูฟังไร้สาย DN Buds");
  await addToCart(page, "คีย์บอร์ดเครื่องกล");
  await page.goto("/cart");
  await expect(items).toHaveCount(2);
});


// ------------------------------------------------
// ข้อ 5: ตะกร้ามีหูฟัง 1 ชิ้น ใช้โค้ด DN10 แล้วต้องเห็นยอดรวมสินค้า "1,290 บาท", ส่วนลด "129 บาท", ยอดสุทธิ "1,161 บาท"
//        และก่อนใช้โค้ด ส่วนลดต้องไม่ใช่ "129 บาท" (ใช้ .not.toHaveText)
// แนวทาง: ช่องโค้ดคือ getByLabel("โค้ดส่วนลด") กรอก "DN10" แล้วคลิกปุ่ม "ใช้โค้ด"
//        ทั้งสามค่าอยู่ใน data-testid ชื่อ subtotal, discount, total (getByTestId)
// ------------------------------------------------
test("หน้า /cart ใช้โค้ด DN10 แล้วส่วนลดและยอดสุทธิถูกต้อง", async ({ page }) => {
  await addToCart(page, "หูฟังไร้สาย DN Buds");
  await page.goto("/cart");
  // ก่อนใช้โค้ด ส่วนลดยังไม่ใช่ 129 บาท (ใช้ .not กับค่าที่ไม่ควรเป็น)
  await expect(page.getByTestId("discount")).not.toHaveText("129 บาท");

  await page.getByLabel("โค้ดส่วนลด").fill("DN10");
  await page.getByRole("button", { name: "ใช้โค้ด" }).click();
  // 10% ของ 1,290 = 129 ยอดสุทธิ 1,290 - 129 = 1,161 (assertion รอให้หน้าอัปเดตเอง)
  await expect(page.getByTestId("subtotal")).toHaveText("1,290 บาท");
  await expect(page.getByTestId("discount")).toHaveText("129 บาท");
  await expect(page.getByTestId("total")).toHaveText("1,161 บาท");
});
