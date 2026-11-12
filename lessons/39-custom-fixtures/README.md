# บทที่ 39: custom fixture ด้วย test.extend

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- อธิบายได้ว่า fixture คืออะไร และต่างจาก `beforeEach` / `afterEach` อย่างไร
- สร้าง fixture ของตัวเองด้วย `test.extend` ที่ setup ก่อน `use()` และ teardown หลัง `use()`
- ทำ fixture ที่พึ่งพา fixture อื่น (เช่น `cartWithItem` ใช้ `loggedInPage`)
- ใช้ option fixture เปลี่ยนค่าด้วย `test.use` และรู้จัก auto fixture (`{ auto: true }`)
- บอกลำดับ setup/teardown ของ fixture ได้ (และเห็นจากการรันจริง)

## เชื่อมกับที่รู้แล้ว

เรารู้จัก fixture มาตั้งแต่บทแรก: `page`, `request`, `context` ที่ใส่ใน `async ({ page }) => ...` คือ fixture ที่ Playwright เตรียมให้ ส่วนบท 19 เรียน `beforeEach` / `afterEach` สำหรับงานที่ต้องทำก่อนและหลัง test บทนี้สอนให้ "สร้าง fixture เอง" ซึ่งทำงานแบบเดียวกับ `beforeEach` + `afterEach` แต่เอาสองอย่างมารวมไว้ที่เดียว และ test ตัวไหนอยากได้ก็ขอใน argument ใน Jest เทียบได้กับการเขียนฟังก์ชัน `setup()` ที่คืนของให้ test พร้อมฟังก์ชัน cleanup ในที่เดียว

## เนื้อหา

### 1. fixture เทียบกับ beforeEach

ถ้าอยากให้ test เริ่มต้นด้วยสถานะ "login แล้ว" ใช้ `beforeEach` ได้:

```ts
test.beforeEach(async ({ page }) => {
  await page.request.post("/api/auth/login", { data: { email: "user@dnshop.test", password: "password123" } });
});
```

ข้อจำกัดคือ: ใช้ได้เฉพาะในไฟล์ (หรือ `describe`) ที่เขียนไว้ ต้องก๊อปไปทุกไฟล์ ทำ teardown ต้องแยกไปเขียนใน `afterEach` และรันกับทุก test ในกลุ่มแม้ test นั้นไม่ต้องการ fixture แก้ด้วยการสร้าง fixture:

- **เขียนครั้งเดียว** ในไฟล์ `fixtures.ts` แล้ว import ใช้ในทุก spec
- **setup กับ teardown อยู่ที่เดียวกัน** ในฟังก์ชันเดียว
- **ทำงานเฉพาะ test ที่ขอ** (lazy): เราลองรันแล้ว test ที่ขอแค่ `page` ไม่มีบรรทัด `[loggedInPage] setup` ปรากฏเลย
- **ต่อกันเป็นลูกโซ่ได้**: fixture หนึ่งขอ fixture อื่นใน argument ของตัวเอง

### 2. test.extend: สร้าง test ตัวใหม่ที่มี fixture เพิ่ม

```ts
import { test as base, type Page } from "@playwright/test";

type MyFixtures = {
  loggedInPage: Page;
};

export const test = base.extend<MyFixtures>({
  loggedInPage: async ({ page }, use) => {
    // setup
    await page.request.post("/api/auth/login", { data: { email: "user@dnshop.test", password: "password123" } });
    // ส่งให้ test
    await use(page);
    // teardown
    await page.request.post("/api/auth/logout");
  },
});

export { expect } from "@playwright/test";
```

- `base` คือ `test` ตัวเดิมของ Playwright (import แล้วเปลี่ยนชื่อด้วย `as base`)
- `base.extend<MyFixtures>({...})` คืน `test` ตัวใหม่ที่ทำทุกอย่างได้เหมือนเดิม และมี `loggedInPage` เพิ่ม ส่วน generic `<MyFixtures>` บอกชนิดของ fixture ให้ TypeScript (ทำให้ `loggedInPage` ใน test ถูกรู้ว่าเป็น `Page`)
- ใน spec ให้ `import { test, expect } from "./fixtures"` **แทน** `"@playwright/test"` ถ้ายัง import จากที่เดิม จะไม่เห็น fixture ของเรา (และ TypeScript จะฟ้อง)
- ที่ต้อง `export { expect }` เพราะจะได้ import ทั้งสองจากไฟล์เดียว

### 3. ฟังก์ชัน fixture: setup, use, teardown

ฟังก์ชันของ fixture รับสองอย่าง: object ของ fixture ที่ต้องการ (ใช้ destructuring เช่น `{ page }`) กับฟังก์ชัน `use`

1. โค้ด **ก่อน** `await use(...)` คือ **setup**
2. `await use(ค่า)` ส่งค่าให้ test (และ fixture ที่พึ่งพาตัวนี้) ฟังก์ชันจะ "หยุดรอ" ตรงนี้ จนกว่า test จะจบ
3. โค้ด **หลัง** `use` คือ **teardown** รันหลัง test จบ

ข้อสำคัญ: ชื่อ `use` ไม่เกี่ยวกับ React hook และไม่ใช่ `test.use` มันเป็นแค่ชื่อ parameter ที่ Playwright กำหนดไว้ (ถ้าเขียนว่า `async ({}, use)` ไม่ต้องการ fixture อื่น ก็ต้องใส่ `{}` ว่างไว้)

### 4. login ด้วย page.request แล้ว use(page)

fixture `loggedInPage` ในไฟล์ `fixtures.ts` login ผ่าน `page.request` (บท 37: ใช้ cookie ร่วมกับหน้าเว็บ) แล้วส่ง `page` ตัวเดิมต่อให้ test ผลคือ test ได้ page ที่ login แล้วโดยไม่ต้องกรอกฟอร์ม login ในทุก test (เร็วและนิ่งกว่า) และยังมี teardown ที่ logout ให้

สังเกตว่า fixture ตรวจ response ด้วย `await expect(res).toBeOK()` ถ้า login ไม่สำเร็จ จะ fail ทันทีด้วยข้อความที่บอกว่าพังที่ขั้นเตรียม ไม่ใช่ไปพังที่ปลายทางด้วยเรื่องอื่น เมื่อ fixture ล้ม **test ที่ขอ fixture นี้จะ fail โดยไม่รันเนื้อ test** (เราทดลองให้ login ผิดแล้วไม่เห็นข้อความจาก `console.log` ในเนื้อ test เลย)

### 5. fixture ที่พึ่งพา fixture อื่น และลำดับ setup/teardown

`cartWithItem` ขอ `loggedInPage` ใน argument ของตัวเอง:

```ts
cartWithItem: async ({ loggedInPage }, use) => {
  await loggedInPage.request.post("/api/cart", { data: { productId: "p01", quantity: 1 } });
  await use(loggedInPage);
},
```

ไม่ต้องบอกว่าให้ทำอะไรก่อน Playwright ดูจากชื่อ argument แล้วจัดลำดับให้เอง ลองรันตัวอย่างทั้งสองด้วย worker เดียวแล้วดู log (ที่ fixture เราใส่ `console.log` และ `test.step` ไว้):

```bash
pnpm test 39-custom-fixtures --workers=1
```

เราลองแล้วได้ผลแบบนี้ (ตัดบรรทัดผลรันออก เหลือเฉพาะ log):

```text
[auto] เริ่ม: cartWithItem มีหูฟังอยู่ในตะกร้าแล้ว
[loggedInPage] setup
[cartWithItem] setup
(test ทำงาน)
[cartWithItem] teardown
[loggedInPage] teardown
[auto] จบ: cartWithItem มีหูฟังอยู่ในตะกร้าแล้ว (passed)
```

สรุปกติ: **setup เรียงจากตัวที่ถูกพึ่งพา (ฐาน) ไปตัวที่พึ่งพา ส่วน teardown ย้อนกลับ** เหมือน stack ซึ่งสมเหตุสมผล เพราะ `cartWithItem` ใช้ `loggedInPage` อยู่ จึงต้องเลิกใช้ก่อนแล้วค่อยปิด `loggedInPage` นอกจาก log ใน terminal แล้ว `test.step` (บท 22) ที่ใส่ไว้ใน fixture ทำให้ขั้น setup/teardown ปรากฏเป็นขั้นตอนใน HTML report และ trace ด้วย (เปิดดูด้วย `pnpm exec playwright show-report`)

ข้อสังเกตอื่นที่เราทดลองจริง:

- **teardown รันแม้ test fail**: test ที่ `expect(1).toBe(2)` ผิด ก็ยังเห็น `[loggedInPage] teardown`
- **ถ้า setup ของ fixture ล้มกลางทาง** (ก่อนถึง `use`) โค้ดหลัง `use` ของ fixture นั้นไม่ถูกรัน (ไม่เห็น `teardown` ของตัวมันเอง) จึงไม่ควรเก็บของสำคัญไว้ล้างใน teardown โดยพึ่งว่าจะรันเสมอ
- เมื่อรันพร้อมกันหลาย worker log จะสลับกันของหลาย test ดูลำดับได้ชัดเมื่อใช้ `--workers=1`

### 6. option fixture: เปลี่ยนค่าด้วย test.use

บางครั้งอยากให้ fixture เดียวกันทำงานต่างกันได้ เช่น login เป็น admin แทน user วิธีคือทำ fixture ที่เป็น "ค่า" แทนที่จะเป็นฟังก์ชัน โดยใส่ `{ option: true }`:

```ts
type MyFixtures = { account: Account; loggedInPage: Page };

export const test = base.extend<MyFixtures>({
  // [ค่าเริ่มต้น, { option: true }]
  account: [USER, { option: true }],

  loggedInPage: async ({ page, account }, use) => {
    await page.request.post("/api/auth/login", { data: account });
    await use(page);
  },
});
```

แล้วใน spec เปลี่ยนค่าได้ด้วย `test.use`:

```ts
test.describe("ผู้ดูแลระบบ", () => {
  test.use({ account: ADMIN });

  test("...", async ({ loggedInPage }) => { /* login เป็น admin */ });
});
```

`test.use` มีผลกับ test ใน `describe` นั้น (หรือทั้งไฟล์ ถ้าเรียกไว้นอก `describe`) fixture ที่ขอ `account` ก็จะได้ค่าใหม่ เราลองแล้ว: ใน `describe` ที่ตั้ง `account: ADMIN` หน้า `/account` แสดง "สิทธิ์: ผู้ดูแลระบบ" option fixture ใช้ตั้งค่าได้จาก `playwright.config.ts` ด้วย (ใน `use: { account: ... }`) ซึ่งเป็นวิธีเดียวกับที่ `baseURL` ที่เราใช้มาตลอดเป็น option ของ Playwright เอง

### 7. auto fixture: ทำงานทุก test โดยไม่ต้องขอ

fixture ปกติทำงานเมื่อ test ขอ ถ้าอยากให้ทำงาน **ทุก test** ที่ใช้ `test` ตัวนี้ ใส่ `{ auto: true }`:

```ts
testLog: [
  async ({}, use, testInfo) => {
    console.log(`[auto] เริ่ม: ${testInfo.title}`);
    await use();
    console.log(`[auto] จบ: ${testInfo.title} (${testInfo.status})`);
  },
  { auto: true },
],
```

เราลองแล้ว: ทุก test ในบทนี้ (แม้ test ที่ขอแค่ `page`) มีบรรทัด `[auto]` พิมพ์ทั้งก่อนและหลัง และในตัวอย่างนี้ auto fixture ถูก setup ก่อน fixture อื่น จึง teardown เป็นตัวสุดท้าย (ตรงกับกติกา "teardown ย้อนกลับ" ในหัวข้อ 5) ตัวอย่างการใช้งานจริง: เก็บ log, ตรวจ error ของหน้าตอนจบทุก test พารามิเตอร์ตัวที่สามของฟังก์ชัน (`testInfo`) คือข้อมูลของ test ปัจจุบัน (ชื่อ ผลลัพธ์) fixture ที่ไม่มีค่าให้ส่ง ใช้ `await use()` เปล่าๆ และกำหนดชนิดเป็น `void` ใน type

ใช้ auto เท่าที่จำเป็น เพราะรันทุก test ถ้า fixture นั้นช้า ทุก test ก็ช้า

### 8. เมื่อไหร่ควรใช้ fixture

- มีงาน setup (และ teardown) ที่ซ้ำกันหลายไฟล์: login, เตรียมตะกร้า, สร้างข้อมูล
- อยากให้ test อ่านง่ายว่า "ต้องการอะไร" (`async ({ cartWithItem })`) แทนที่จะอ่านขั้นตอนเตรียมทุกครั้ง
- ถ้าเป็นแค่ขั้นตอนใน test เดียว เขียนใน test ตรงๆ ง่ายกว่า อย่าสร้าง fixture ก่อนมีความซ้ำ

## จุดที่มักพลาด

- **import `test` จาก `@playwright/test` ใน spec**: จะไม่เห็น fixture ของเรา ต้อง import จาก `./fixtures`
- **ลืมเรียก `use(...)`**: test fail ด้วยข้อความ `use() was not called in fixture "ชื่อ fixture"` (เราลองแล้ว) และอย่าลืม `await` หน้า `use` ด้วย
- **ลืม `await` ในขั้น setup**: เช่นส่งคำขอ login แล้วไม่ await ทำให้ test เริ่มก่อน login เสร็จ
- **parameter แรกไม่ใช่ destructuring**: ต้องเป็น `{ page }` หรือ `{}` Playwright อ่านชื่อ fixture ที่ต้องการจากตรงนี้ ถ้าเขียน `async (fixtures, use)` จะได้ error `First argument must use the object destructuring pattern: fixtures` (เราลองแล้ว)
- **ไม่ตรวจ response ของขั้นเตรียม**: login ไม่สำเร็จแต่ไม่รู้ตัว ไปพังที่ปลายทาง ให้ `expect(res).toBeOK()`
- **คาดหวังว่า teardown จะรันหลัง setup ที่ล้มกลางทาง**: ไม่รัน (ดูหัวข้อ 5)
- **ลืมใส่ type ใน `base.extend<...>`**: test จะฟ้องว่าไม่มี fixture ชื่อนั้น
- **ใช้ auto fixture กับของที่ไม่ใช่ทุก test ต้องการ**: ทำให้ test ช้าโดยไม่จำเป็น
- **ใช้ fixture ที่เปลี่ยนสถานะ (เช่น login) แล้วนึกว่าข้าม test ได้**: แต่ละ test มี context ของตัวเอง (cookie แยกกัน บท 20) fixture ทำงานใหม่ทุก test

## หน้าในแอปที่ใช้

**`/account`** (ต้อง login): h1 "บัญชีของฉัน", "ชื่อ: สมชาย ใจดี", "อีเมล: user@dnshop.test", "สิทธิ์: ผู้ใช้ทั่วไป" (หรือ "สิทธิ์: ผู้ดูแลระบบ" สำหรับ admin)

**`/cart`**: `<ul aria-label="สินค้าในตะกร้า">` รายการสินค้า, `data-testid="subtotal"` เช่น "1,290 บาท", ปุ่ม "ไปชำระเงิน"

**`/checkout`**: h1 "ชำระเงิน", ช่อง "ชื่อ-นามสกุล" (ถ้า login จะเติมชื่อให้)

**`/admin/products`** (admin): ตาราง `aria-label="ตารางสินค้า"` และ h2 "เพิ่มสินค้าใหม่"

**header ทุกหน้า**: `<nav aria-label="เมนูหลัก">` ถ้ายังไม่ login มีลิงก์ "เข้าสู่ระบบ" ถ้า login แล้วมีลิงก์ "บัญชีของฉัน" และปุ่ม "ออกจากระบบ"

API ที่ fixture ใช้: `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/cart` (บท 36-37) บัญชีทดสอบ: `user@dnshop.test` / `password123`, `admin@dnshop.test` / `admin123`

## วิธีรันบทนี้

```bash
pnpm test 39-custom-fixtures
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `4 skipped` (และเห็นบรรทัด `[auto]` กับ `[loggedInPage]` ที่ fixture พิมพ์)

ข้อ 3 ต้องแก้ไฟล์ `fixtures.ts` ด้วย (fixture `adminPage` ยังเป็นโครงที่โยน `new Error("👉 ยังไม่ได้เขียน fixture นี้")`)

## แบบฝึกหัดในบทนี้

1. ใช้ `loggedInPage` ตรวจเมนูของคนที่ login แล้ว
2. ใช้ `cartWithItem` ไปหน้าชำระเงิน แล้วตรวจว่าชื่อผู้รับถูกเติมให้
3. เขียน fixture `adminPage` เอง (login เป็น admin) แล้วเข้าหน้าจัดการสินค้า
4. เปลี่ยน option fixture `account` เป็น admin ด้วย `test.use`

## อ่านเพิ่ม

- [Fixtures](https://playwright.dev/docs/test-fixtures)
- [Test API: test.extend](https://playwright.dev/docs/api/class-test#test-extend)
