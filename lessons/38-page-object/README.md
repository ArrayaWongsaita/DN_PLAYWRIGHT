# บทที่ 38: Page Object Model (เขียน class แทนหน้าเว็บ)

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- อธิบายได้ว่า Page Object Model (POM) คืออะไรและแก้ปัญหาอะไร
- เขียน class ที่แทนหนึ่งหน้าเว็บ: เก็บ locator เป็น `readonly` property และ action เป็น method
- ใช้ Page Object ใน test โดยแยก "ทำอย่างไร" (อยู่ใน class) ออกจาก "ตรวจอะไร" (อยู่ใน test)
- ตัดสินได้ว่าอะไรควรอยู่ใน Page Object และอะไรควรอยู่ใน test

## เชื่อมกับที่รู้แล้ว

บท 04-05 สอน locator บท 16-17 สอนกรองและวนรายการ บท 37 สอนเตรียมข้อมูลด้วย API จนถึงตอนนี้ทุก test เขียน locator และขั้นตอนไว้ใน test เอง ซึ่งพอ test มีไม่กี่ตัวก็ไม่มีปัญหา แต่เมื่อมีหลายสิบตัว โค้ดจะซ้ำกันเต็มไปหมด บทนี้เป็นวิธีจัดระเบียบโค้ดนั้น เทียบได้กับการแยก helper function ออกจาก test ใน Jest แต่รวมไว้เป็น class หนึ่งตัวต่อหนึ่งหน้า

## เนื้อหา

### 1. ปัญหา: โค้ดซ้ำทุก test

สมมติมี test 20 ตัวที่ต้อง login แต่ละตัวเขียนแบบนี้:

```ts
await page.goto("/login");
await page.getByLabel("อีเมล").fill("user@dnshop.test");
await page.getByLabel("รหัสผ่าน").fill("password123");
await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
```

ถ้าวันหนึ่งทีมเปลี่ยน label "อีเมล" เป็น "อีเมลของคุณ" ต้องแก้ทั้ง 20 test ทั้งที่ไม่มี test ไหน "เกี่ยวกับ" label นั้นเลย POM แก้ปัญหานี้: รวมทุกอย่างที่รู้เกี่ยวกับหน้า login ไว้ที่เดียว แก้ที่เดียวจบ

### 2. Page Object คืออะไร

Page Object คือ class ธรรมดา (ไม่ใช่ของพิเศษของ Playwright) หนึ่งตัวต่อหนึ่งหน้า (หรือส่วนใหญ่ของหน้า) มีสองส่วน:

- **locator**: ชี้ว่า element สำคัญของหน้าอยู่ตรงไหน (เก็บเป็น `readonly` property)
- **method**: สิ่งที่ผู้ใช้ทำบนหน้านั้นได้ เช่น `goto()`, `login(email, password)`

ดูไฟล์จริงใน `pages/LoginPage.ts` (เขียนเสร็จแล้ว):

```ts
import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly email: Locator;
  readonly password: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.email = page.getByLabel("อีเมล");
    this.password = page.getByLabel("รหัสผ่าน");
    this.submitButton = page.getByRole("button", { name: "เข้าสู่ระบบ" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitButton.click();
  }
}
```

ไล่อ่านทีละส่วน:

- `import type { Locator, Page }` ดึงเฉพาะ "type" มาใช้ระบุชนิดของตัวแปร ไม่ได้ดึงโค้ดจริง
- `readonly` ของ TypeScript คือ "กำหนดค่าได้ครั้งเดียว (ใน constructor) แล้วแก้ไม่ได้" กันไม่ให้ test ไปเขียนทับ locator โดยไม่ตั้งใจ
- `constructor(page: Page)` รับ `page` ของ test เข้ามาเก็บไว้ Page Object จึงใช้ browser tab เดียวกับ test
- locator สร้างใน constructor ได้เลย เพราะ locator ไม่ได้ "ค้นหา element ทันที" มันแค่จดวิธีหา (บท 04) การค้นหาจริงเกิดตอนเรียก action หรือ `expect` ดังนั้นสร้างก่อนที่หน้าจะโหลดก็ไม่เป็นไร
- method ที่ทำสิ่งต่างๆ เป็น `async` และ `await` ทุกคำสั่งเหมือนใน test (บท 03)

### 3. ใช้ใน test

```ts
import { LoginPage } from "./pages/LoginPage";

test("login สำเร็จ", async ({ page }) => {
  const loginPage = new LoginPage(page);   // หนึ่ง test สร้างหนึ่งตัว
  await loginPage.goto();
  await loginPage.login("user@dnshop.test", "password123");

  await expect(page).toHaveURL("/account");
});
```

เทียบกับโค้ดในหัวข้อ 1: test สั้นลงและอ่านเป็นเจตนา ("login ด้วยบัญชีนี้") แทนที่จะอ่านเป็นขั้นตอนระดับคลิก ถ้าหน้า login เปลี่ยน แก้ `LoginPage` ที่เดียว

ทำไมต้องสร้างใหม่ทุก test (`new LoginPage(page)`): `page` ของแต่ละ test เป็นคนละตัว (บท 20 เรื่อง isolation) Page Object ที่ผูกกับ page ตัวหนึ่งจึงใช้ข้าม test ไม่ได้ (บท 40 จะสอนวิธีให้ fixture สร้างให้อัตโนมัติ)

### 4. อะไรควรอยู่ตรงไหน

หลักที่ใช้ได้ในทางปฏิบัติ:

| อยู่ใน Page Object | อยู่ใน test |
|---|---|
| locator ของ element สำคัญ | `expect` ที่ตัดสินว่า test ผ่านหรือไม่ |
| action ที่ผู้ใช้ทำ (`login`, `applyCoupon`) | ข้อมูลที่เป็นหัวใจของ test นั้น (เช่น รหัสผ่านผิดที่ตั้งใจใส่) |
| การรอที่เป็นส่วนของ action นั้น | การเตรียมข้อมูลเฉพาะ test (เช่น เพิ่มสินค้าด้วย API) |

เหตุผลที่ไม่ใส่ `expect` ผลลัพธ์ไว้ใน Page Object: ถ้า `login()` ตรวจเองว่า login สำเร็จ เราจะเอาไปใช้ใน test "login ผิด" ไม่ได้ ให้ method ทำแค่ "ทำ" แล้วให้ test เป็นคนตรวจ ถ้าต้องการตรวจข้อความที่ปรากฏ ให้ Page Object คืน **locator** ให้ test เอาไปใส่ `expect` เอง เช่น `loginPage.errorMessage("...")`

ข้อควรจำอื่นๆ:

- ตั้งชื่อ method ตามเจตนาของผู้ใช้ (`applyCoupon`) ไม่ใช่ตามขั้นตอน (`fillCouponAndClick`)
- method ยังต้อง `await` ครบเหมือนเดิม และเป็น `async` ที่คืน `Promise<void>`
- อย่าทำ Page Object ใหญ่เกินไป: หนึ่งหน้า (หรือหนึ่งส่วนของหน้า) ต่อหนึ่ง class

### 5. ข้อความ error กับ role="alert"

`LoginPage` มี method `errorMessage(text)` ที่คืน `this.page.getByRole("alert").filter({ hasText: text })` เหตุผลที่ต้อง `filter`: Next.js (framework ของแอปนี้) ใส่ element `role="alert"` ว่างๆ ไว้ทุกหน้าเพื่อประกาศการเปลี่ยนหน้าให้ screen reader (เรียกว่า route announcer อธิบายไว้ในบท 07 แล้ว) ถ้าใช้ `getByRole("alert")` เฉยๆ จะเจอสอง element และ `expect` จะ error เพราะ locator ไม่ชี้ element เดียว (strict mode, บท 04) การกรองด้วยข้อความทำให้ได้เฉพาะ alert ที่เราสนใจ

### 6. เขียน CartPage เอง

ไฟล์ `pages/CartPage.ts` เป็นโครงที่ locator เขียนไว้แล้ว ส่วน method ทุกตัว (`goto`, `applyCoupon`, `remove`, `increase`) ยังโยน `new Error("👉 ยังไม่ได้เขียน method นี้")` อยู่ ถ้า test เรียก method ที่ยังไม่เขียน จะ fail พร้อมข้อความนี้ แบบฝึกหัดข้อ 2-5 ให้เติมทีละ method แล้วเขียน test ใช้

คำแนะนำเฉพาะ:

- **`remove`**: ปุ่ม "ลบ" เปิด `confirm` dialog (บท 25) dialog ที่ไม่มีใครดักจะถูกปิดด้วยการ dismiss อัตโนมัติ ซึ่งแปลว่า "ไม่ลบ" ต้องดัก `this.page.once("dialog", (dialog) => dialog.accept())` **ก่อน** กดปุ่ม (ตัว handler คืน Promise ให้เขียนเป็น `void dialog.accept()` ในแบบ arrow function เพื่อไม่ให้ lint บ่นเรื่อง promise ที่ไม่ได้ await)
- **หารายการสินค้าตามชื่อ**: `this.items.filter({ hasText: productName })` (บท 16) แล้วหาปุ่มในรายการนั้นด้วย `getByRole("button", { name: "ลบ" })`
- **`increase`**: กดปุ่ม "เพิ่มจำนวน" ในรายการของสินค้านั้น แล้วรอให้ช่อง "จำนวน" ของรายการเพิ่มขึ้นก่อนจบ method (อ่านค่าก่อนกดด้วย `inputValue()` แล้วรอด้วย `expect(...).toHaveValue(...)`) เราลองแล้วว่าถ้ากดสองครั้งติดกันโดยไม่รอ ล้มไป 3 จาก 20 รอบ เพราะการกดครั้งที่สองอาจเกิดก่อนที่หน้าจะรับจำนวนใหม่ การรอที่เป็นส่วนของ action (ให้ action "เสร็จจริง" ก่อนคืนการควบคุม) อยู่ใน Page Object ได้ ต่างจากการตัดสินผลของ test
- **`applyCoupon`**: ปุ่ม "ใช้โค้ด" ถูก disabled จนกว่าช่องโค้ดมีค่า `click()` รอให้ปุ่ม enabled ให้เองจึงกรอกแล้วกดได้ต่อกัน (บท 24)

### 7. หมายเหตุเรื่องหน้าที่ยังโหลด JavaScript ไม่เสร็จ

หน้าในแอปนี้ถูกสร้างเป็น HTML จากเซิร์ฟเวอร์ก่อน แล้ว JavaScript ของ React ค่อยผูกตัวจัดการ event (บท 25 เรียกว่า hydrate) ช่วงสั้นๆ ก่อนนั้น ปุ่มกดได้แต่ยังไม่มีอะไรเกิดขึ้น เราลองรัน test ของบทนี้ 120 รอบพร้อมกัน 10 worker แล้วไม่เจอปัญหานี้ (`page.goto` รอให้หน้าโหลดเสร็จก่อนทำต่อ) จึงเขียน Page Object แบบตรงไปตรงมา แต่ถ้า test ของคุณ fail เป็นครั้งคราวทั้งที่โค้ดถูก ให้นึกถึงสาเหตุนี้ และให้รอ element ที่ปรากฏหลังจาก JavaScript ทำงานแล้วก่อนกด (เช่น รายการสินค้าที่ดึงด้วย `fetch` ในหน้า `/products`) การแก้ควรทำใน Page Object ที่เดียว ซึ่งเป็นข้อดีอีกข้อของ POM

## จุดที่มักพลาด

- **ลืม `await` ใน method ของ Page Object**: test จะไปต่อก่อนที่ action จะทำเสร็จ เกิด fail เป็นครั้งคราว
- **ใส่ `expect` ตัดสินผลไว้ใน Page Object**: เอาไปใช้ซ้ำกับ test ฝั่ง "ผิดพลาด" ไม่ได้ ให้คืน locator แทน
- **ใช้ Page Object ตัวเดียวข้ามหลาย test**: `page` ผูกกับ test เดียว ต้อง `new` ใหม่ทุก test
- **ลืมส่ง `page` เข้า constructor** หรือเก็บ `page` ไม่ได้ ทำให้ method หา `this.page` ไม่เจอ
- **ใช้ `getByRole("alert")` เปล่าๆ**: เจอ alert ว่างของ Next.js ด้วย ให้ `filter({ hasText })`
- **method ชื่อบอกขั้นตอนแทนเจตนา**: เปลี่ยนวิธีทำเมื่อไหร่ ชื่อก็ผิด
- **ทำ class ใหญ่เกินจำเป็น**: แยกตามหน้าหรือส่วนของหน้า ไม่ใช่ทั้งเว็บในไฟล์เดียว
- **เขียน Page Object ก่อนที่จะมีโค้ดซ้ำ**: ถ้ามี test แค่หนึ่งสองตัว ยังไม่จำเป็น ค่อยแยกเมื่อเริ่มซ้ำ

## หน้าในแอปที่ใช้

**`/login`**: h1 "เข้าสู่ระบบ", label "อีเมล" และ "รหัสผ่าน", ปุ่ม "เข้าสู่ระบบ" (disabled จนกว่าจะกรอกครบทั้งสองช่อง) ผิดแสดง `role="alert"` "อีเมลหรือรหัสผ่านไม่ถูกต้อง" สำเร็จจะไปหน้า `/account` บัญชีทดสอบ: `user@dnshop.test` / `password123` (ผู้ใช้ทั่วไป ชื่อ สมชาย ใจดี) และ `admin@dnshop.test` / `admin123` (ผู้ดูแลระบบ)

**`/account`** (ต้อง login): h1 "บัญชีของฉัน", "ชื่อ: สมชาย ใจดี", "อีเมล: ...", "สิทธิ์: ผู้ใช้ทั่วไป" หรือ "สิทธิ์: ผู้ดูแลระบบ"

**`/cart`**: `<ul aria-label="สินค้าในตะกร้า">` แต่ละ `<li>` มีชื่อสินค้า ปุ่ม "ลดจำนวน" "เพิ่มจำนวน" และ "ลบ" (เปิด confirm), label "โค้ดส่วนลด" กับปุ่ม "ใช้โค้ด", `data-testid` `subtotal`, `discount`, `total` ค่าแสดงเป็น "1,290 บาท" (โค้ด `DN10` ลด 10% ปัดเศษ)

ข้อ 2-5 เตรียมตะกร้าด้วย `page.request.post("/api/cart", { data: { productId, quantity } })` (บท 37) สินค้าที่ใช้: p01 หูฟังไร้สาย DN Buds 1,290 บาท, p03 เมาส์ไร้สาย 590 บาท, p06 แก้วกาแฟเซรามิก 190 บาท

## วิธีรันบทนี้

```bash
pnpm test 38-page-object
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

ระหว่างทำแบบฝึกหัด ข้อ 2-5 ต้องแก้ทั้งไฟล์ `pages/CartPage.ts` และไฟล์ spec

## แบบฝึกหัดในบทนี้

1. login เป็นผู้ดูแลระบบด้วย `LoginPage` (ใช้ของที่มีอยู่)
2. เขียน `CartPage.goto()` แล้วเปิดตะกร้าที่เตรียมด้วย API
3. เขียน `CartPage.applyCoupon()` แล้วใช้โค้ด DN10
4. เขียน `CartPage.remove()` (ดัก dialog confirm) แล้วลบสินค้าออกจากตะกร้า
5. เขียน `CartPage.increase()` แล้วต่อยอดเป็น flow เพิ่มจำนวนและใช้โค้ดส่วนลด

## อ่านเพิ่ม

- [Page object models](https://playwright.dev/docs/pom)
- [Locators](https://playwright.dev/docs/locators)
