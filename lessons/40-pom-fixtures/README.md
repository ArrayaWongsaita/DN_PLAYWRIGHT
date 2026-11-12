# บทที่ 40: Page Object + fixture ใช้ร่วมกัน

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- ส่ง Page Object ให้ test ผ่าน fixture (`loginPage`, `cartPage`, `checkoutPage`) แทนการ `new` เองทุก test
- จัดโครงโฟลเดอร์ของ Page Object และ `fixtures.ts` ให้อ่านง่าย
- รู้จัก worker fixture (`{ scope: "worker" }`) และบอกได้ว่าเมื่อไหร่ใช้ ใช้กับอะไรได้และไม่ได้
- ใช้ Page Object ร่วมกับการเตรียมข้อมูลด้วย API (บท 37) ใน test เดียวกัน

## เชื่อมกับที่รู้แล้ว

บท 38 สอนเขียน Page Object (ต้อง `const loginPage = new LoginPage(page)` ในทุก test) บท 39 สอน `test.extend` เพื่อให้ fixture เตรียมของให้ test บทนี้เอาสองบทมารวมกัน: ให้ fixture เป็นผู้สร้าง Page Object ให้ ผลคือ test เหลือแต่เนื้อหาที่ต้องการทดสอบ ใน Jest เทียบได้กับการมีฟังก์ชันสร้าง object พร้อมใช้ที่ test ทุกตัวขอใช้ได้เลย

## เนื้อหา

### 1. โครงไฟล์

```text
lessons/40-pom-fixtures/
  fixtures.ts           <- test.extend รวมไว้ที่นี่ที่เดียว
  pages/
    LoginPage.ts        <- Page Object (บท 38)
    CartPage.ts
    CheckoutPage.ts
  pom-fixtures.spec.ts  <- test import จาก ./fixtures
```

`pages/*.ts` และ `fixtures.ts` ไม่ใช่ไฟล์ test (ชื่อไม่ลงท้าย `.spec.ts`) Playwright จึงไม่รันมันเอง แต่ `pnpm typecheck` กับ `pnpm lint` ตรวจให้ทั้งหมด

### 2. fixture ที่ส่ง Page Object

```ts
import { test as base } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";

type TestFixtures = {
  loginPage: LoginPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});
```

อ่านได้ว่า: ขอ `page` (fixture ของ Playwright) แล้วห่อด้วย class แล้วส่งให้ test ไม่มีโค้ด teardown จึงไม่มีอะไรต่อท้าย `use` ใน test เขียนแบบนี้:

```ts
import { test, expect } from "./fixtures";

test("...", async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.login("user@dnshop.test", "password123");
  await expect(page).toHaveURL("/account");
});
```

จุดสำคัญคือ **`loginPage` และ `page` ที่ test ได้รับเป็น page ตัวเดียวกัน** เพราะ fixture ทุกตัวที่ขอ `page` ใน test เดียวกันได้ตัวเดียวกัน (Playwright สร้างหนึ่งตัวต่อ test) จึงผสมการใช้ Page Object กับ `page.request` เตรียมข้อมูล (บท 37) ได้ใน test เดียวกัน (ตัวอย่างที่ 2) และสร้าง Page Object แค่ตัวที่ test ขอ ตัวที่ไม่ขอก็ไม่ถูกสร้าง (lazy เหมือนบท 39)

### 3. ผสมกับการเตรียมข้อมูลด้วย API

ตัวอย่างที่ 2 เตรียมตะกร้าด้วย `page.request` แล้วใช้ `cartPage` ทำสิ่งที่เป็นเป้าหมายของ test (ใช้โค้ดส่วนลด) หลักเดิมของบท 37: เตรียมสิ่งที่ไม่ใช่เป้าหมายด้วย API ที่เร็วและนิ่ง ส่วนที่เป็นเป้าหมายทำผ่านหน้าเว็บด้วย Page Object ถ้าต้องเตรียมแบบเดียวกันในหลาย test ให้ทำเป็น fixture ต่อยอด (บท 39) เช่น `cartWithItem`

### 4. worker fixture: ข้อมูลที่อ่านอย่างเดียว ใช้ร่วมกันทั้ง worker

fixture ปกติถูกสร้างและทำลายใหม่ **ทุก test** (`scope: "test"` เป็นค่าเริ่มต้น) บางอย่างไม่จำเป็นต้องสร้างใหม่ทุกครั้ง เช่น รายการสินค้าซึ่งอ่านอย่างเดียว ถ้าให้ทุก test ดึงใหม่ก็เสียเวลาเปล่า Playwright รันไฟล์ test ด้วย worker หลายตัว (process แยกกัน) และ **worker fixture** ถูกสร้าง **หนึ่งครั้งต่อ worker** แล้วใช้ร่วมกันทุก test ที่ worker นั้นรัน

```ts
type WorkerFixtures = { catalog: readonly CatalogItem[] };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // ...fixture แบบ test ...

  catalog: [
    async ({ playwright }, use, workerInfo) => {
      const api = await playwright.request.newContext({ baseURL });
      const res = await api.get("/api/products");
      const body = (await res.json()) as { products: CatalogItem[] };
      await api.dispose();
      await use(body.products);
    },
    { scope: "worker" },
  ],
});
```

สิ่งที่ต้องรู้:

- generic ตัวที่สองของ `extend<TestFixtures, WorkerFixtures>` คือ type ของ worker fixture
- รูปแบบ `[ฟังก์ชัน, { scope: "worker" }]` (tuple) เหมือน option/auto fixture ในบท 39
- **worker fixture ขอ fixture แบบ test ไม่ได้**: เมื่อเราลองให้ worker fixture ขอ `page` จะได้ error `worker fixture "w" cannot depend on a test fixture "page" defined in <builtin>` เหตุผล: worker fixture อยู่ข้าม test แต่ `page` เกิดและตายในแต่ละ test จึงตั้งต้น `request` เองจาก `playwright` (ซึ่งเป็น worker fixture) ได้ และ `baseURL` ซึ่งเป็น fixture แบบ test เหมือนกัน เราจึงอ่านจากไฟล์ `playwright.shared.ts` ที่ทุกบทใช้ร่วมกัน (`import { baseURL } from "../../playwright.shared"`)
- เราลองรันด้วย 1 worker ได้บรรทัด `[catalog] worker 0: โหลดรายการสินค้า` **หนึ่งครั้ง** สำหรับ 5 test และรัน 2 worker ได้สองบรรทัด (worker 0 และ 1) ตรงกับที่บอกว่า "หนึ่งครั้งต่อ worker" ไม่ใช่หนึ่งครั้งต่อการรัน
- ไม่มีการรับประกันว่า test ไหนจะไปอยู่ worker ไหน และ test ใน worker เดียวกันใช้ object เดียวกัน ถ้า test หนึ่งแก้ข้อมูล test ถัดไปจะเห็นสิ่งที่แก้ไว้ (ซึ่งทำให้ผลขึ้นกับลำดับ) จึงใช้ worker fixture กับข้อมูลที่ **อ่านอย่างเดียว** เท่านั้น ใน `fixtures.ts` เรา `Object.freeze` และใช้ type `readonly` กันพลาด (ลองแล้ว: พยายามเขียน `catalog[0].name = "x"` โยน error ใน test)
- เก็บเฉพาะค่าที่ไม่เปลี่ยน: เก็บ `id`, `name`, `price` ไม่เก็บ `stock` เพราะ test อื่นที่ซื้อของทำให้ stock เปลี่ยนได้ (ข้อมูล stock ที่ค้างไว้จะเก่า)
- **ไม่ควรเก็บสถานะที่ผูกกับผู้ใช้หรือ session** ใน worker fixture เช่น ตะกร้าหรือ cookie เพราะแต่ละ test มี browser context ของตัวเอง (บท 20) การแชร์ข้ามกันทำให้ test ไม่เป็นอิสระ
- ถ้าต้องเตรียมข้อมูลที่แก้ไขได้ ให้ใช้ fixture แบบ test (ค่าเริ่มต้น) ที่สร้างใหม่ทุก test

### 5. method ที่รอให้ action เสร็จจริง

ดู `increase()` ใน `pages/CartPage.ts`: มันอ่านจำนวนก่อนกด กดปุ่ม แล้วรอให้ช่อง "จำนวน" เป็นค่าใหม่ก่อนจบ ที่ทำแบบนี้เพราะเราลองเรียกสองครั้งติดกันโดยไม่รอ (ในบท 38) แล้วล้มไป 3 จาก 20 รอบ การรอที่ทำให้ action "เสร็จจริง" เป็นหน้าที่ที่เหมาะกับ Page Object เพราะ test ทุกตัวที่เรียก method นี้ได้ประโยชน์โดยไม่ต้องรู้รายละเอียด

### 6. เขียน CheckoutPage เอง

`pages/CheckoutPage.ts` เป็นโครงที่ locator เขียนไว้แล้ว (ช่องกรอก, select วิธีชำระเงิน, checkbox, `order-total`, ปุ่มยืนยัน) ส่วน method ยังโยน `new Error("👉 ยังไม่ได้เขียน method นี้")` ข้อ 3 และ 4 ให้เติม fixture `checkoutPage` เขียนไว้ให้แล้วใน `fixtures.ts` จึงไม่ต้องแตะ

คำแนะนำ:

- เลือกค่าใน `<select>` ใช้ `locator.selectOption("cod")` (บท 08) ค่าที่ใช้คือ `card`, `transfer`, `cod`
- ใช้ `check()` กับ checkbox "ฉันยอมรับเงื่อนไขการสั่งซื้อ"
- ปุ่ม "ยืนยันคำสั่งซื้อ" disabled จนกว่าจะกรอกครบและติ๊กยอมรับ `click()` รอให้ enabled ให้เอง
- วิธีชำระ `card` ต้องยืนยันบัตรใน iframe ด้วย (บท 29) ข้อนี้ใช้ `cod` เพื่อไม่ต้องทำเรื่อง iframe
- หมายเลขคำสั่งซื้อนับต่อ session ของ test (บท 37) ใน test ใหม่ที่ยังไม่เคยสั่ง จึงเป็น `DN-0001`

## จุดที่มักพลาด

- **import `test` จาก `@playwright/test`**: จะไม่เห็น `loginPage` ใน argument ต้อง import จาก `./fixtures`
- **ใส่ type ของ worker fixture ผิดที่**: type ของ worker fixture ต้องอยู่ใน generic ตัวที่สองของ `extend<TestFixtures, WorkerFixtures>` ส่วน `{ scope: "worker" }` เป็นตัวบอกว่าเป็น worker จริง (ทั้งสองต้องตรงกัน)
- **ให้ worker fixture ขอ `page`, `request` หรือ `baseURL`**: ไม่ได้ (เป็น fixture แบบ test) ใช้ `playwright` และค่าคงที่แทน
- **แก้ข้อมูลที่อยู่ใน worker fixture**: test อื่นใน worker เดียวกันเห็นการแก้ ผลจึงขึ้นกับลำดับ ใช้กับข้อมูลที่อ่านอย่างเดียวเท่านั้น
- **เก็บ stock หรือยอดที่เปลี่ยนได้ใน worker fixture**: ค่าจะเก่าทันทีที่ test อื่นเปลี่ยน
- **ใช้ `new LoginPage(page)` ปนกับ fixture**: ทำให้สองแบบในโปรเจกต์เดียว เลือกแบบเดียวให้ทั้งทีม
- **ใส่ `expect` ตัดสินผลใน Page Object**: เหมือนบท 38 ให้คืน locator แล้วตรวจใน test
- **เตรียมตะกร้าหลัง `goto`**: หน้า `/cart` และ `/checkout` อ่านตะกร้าตอนโหลด เตรียมให้เสร็จก่อนเปิดหน้า (บท 37) โดยเฉพาะ `/checkout` ที่ถ้าตะกร้าว่างจะส่งกลับ `/cart`
- **ลืมว่า fixture สร้างใหม่ทุก test**: Page Object ใน `loginPage` ผูกกับ `page` ของ test นั้น อย่าเก็บข้าม test

## หน้าในแอปที่ใช้

**`/login`**, **`/account`**, **`/cart`**: ดูรายละเอียดในบท 38 บัญชีทดสอบ `user@dnshop.test` / `password123` และ `admin@dnshop.test` / `admin123`

**`/checkout`** (ต้องมีสินค้าในตะกร้า ไม่เช่นนั้นกลับไป `/cart`): h1 "ชำระเงิน", fieldset "ข้อมูลผู้รับ" มี label "ชื่อ-นามสกุล", "ที่อยู่", "เบอร์โทรศัพท์" (ต้องเป็นตัวเลข 10 หลัก), fieldset "วิธีจัดส่ง" เลือก "ส่งธรรมดา (50 บาท)" ไว้ก่อน หรือ "ส่งด่วน (100 บาท)", select "วิธีชำระเงิน" (บัตรเครดิต เป็นค่าเริ่มต้น / โอนผ่านธนาคาร / เก็บเงินปลายทาง), checkbox "ฉันยอมรับเงื่อนไขการสั่งซื้อ", `data-testid="order-total"` ยอดที่ต้องชำระรวมค่าส่ง เช่น "240 บาท", ปุ่ม "ยืนยันคำสั่งซื้อ"

**`/orders/DN-0001`**: h1 "สั่งซื้อสำเร็จ", "หมายเลขคำสั่งซื้อ: DN-0001", "ค่าจัดส่ง: N บาท", "ยอดสุทธิ: N บาท"

API ที่ใช้: `POST /api/cart` (เตรียมตะกร้า), `GET /api/products` (worker fixture อ่านรายการสินค้า มี `{ products: [...] }`) สินค้า: p01 หูฟังไร้สาย DN Buds 1,290 บาท, p03 เมาส์ไร้สาย 590 บาท, p06 แก้วกาแฟเซรามิก 190 บาท

## วิธีรันบทนี้

```bash
pnpm test 40-pom-fixtures
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

ข้อ 3-4 ต้องแก้ไฟล์ `pages/CheckoutPage.ts` ด้วย

## แบบฝึกหัดในบทนี้

1. login เป็นผู้ดูแลระบบด้วย `loginPage` จาก fixture
2. ใช้ `cartPage.increase()` เพิ่มจำนวนสินค้า
3. เขียน `CheckoutPage` (`goto`, `fillRecipient`) แล้วกรอกข้อมูลผู้รับ
4. เขียน `placeOrderWith()` แล้วสั่งซื้อแบบเก็บเงินปลายทางให้จบ
5. ใช้ worker fixture `catalog` คำนวณยอดรวมที่คาดหวัง

## อ่านเพิ่ม

- [Fixtures](https://playwright.dev/docs/test-fixtures)
- [Page object models](https://playwright.dev/docs/pom)
