# บทที่ 19: จัดกลุ่มด้วย describe และ hook

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- จัดกลุ่ม test ด้วย `test.describe` และซ้อนกลุ่มได้
- ใช้ `test.beforeEach` เปิดหน้าเดียวกันก่อนทุก test โดยไม่เขียนซ้ำ
- ใช้ `test.afterEach` กับ `testInfo` เพื่อดูหรือแนบข้อมูลหลัง test จบ
- รู้ว่า `beforeAll` / `afterAll` ต่างจาก `beforeEach` / `afterEach` อย่างไร และเมื่อไหร่ไม่ควรใช้

## เชื่อมกับที่รู้แล้ว

ใน Jest (บท 10–11 ของ repo `DN_JEST_SUPERTEST`) เราใช้ `describe`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll` อยู่แล้ว ใน Playwright ความหมายเหมือนกัน เพียงเปลี่ยนชื่อให้ขึ้นต้นด้วย `test.`

| Jest / Vitest | Playwright | หมายเหตุ |
|---|---|---|
| `describe("ชื่อกลุ่ม", () => {...})` | `test.describe("ชื่อกลุ่ม", () => {...})` | ซ้อนกันได้เหมือนกัน |
| `beforeEach(() => {...})` | `test.beforeEach(async ({ page }) => {...})` | รับ fixture ได้ เช่น `page` |
| `afterEach(() => {...})` | `test.afterEach(async ({ page }, testInfo) => {...})` | อาร์กิวเมนต์ที่สองคือ `testInfo` |
| `beforeAll` / `afterAll` | `test.beforeAll` / `test.afterAll` | **ใช้ `page` ไม่ได้** (ดูหัวข้อ 4) |
| `it` / `test` | `test` | |

ข้อแตกต่างที่สำคัญที่สุดคือ hooks ของ Playwright **รับ fixture** (`{ page }`) ได้ ใน Jest ที่ผ่านมา เรามักสร้างตัวแปรไว้นอก hook แล้วกำหนดค่าใน `beforeEach` (เช่น `let app`) แต่ใน Playwright ไม่ต้อง: `page` ที่ hook ได้รับเป็นตัวเดียวกับที่ test ของรอบนั้นได้รับ และเปิดใหม่ทุก test

## เนื้อหา

### 1. test.describe: จัดกลุ่ม

```ts
test.describe("หน้าสินค้า หูฟังไร้สาย DN Buds", () => {
  test("แสดงชื่อสินค้า", async ({ page }) => { /* ... */ });
  test("แสดงราคา", async ({ page }) => { /* ... */ });
});
```

ประโยชน์คือ ชื่อ test ในรายงานจะขึ้นต้นด้วยชื่อกลุ่ม (`หน้าสินค้า หูฟังไร้สาย DN Buds › แสดงชื่อสินค้า`) ทำให้หา test ง่ายขึ้น, ใช้ `--grep "ชื่อกลุ่ม"` เลือกรันทั้งกลุ่มได้ และ hooks ที่อยู่ในกลุ่มจะมีผลเฉพาะ test ในกลุ่มนั้น

ไม่จำเป็นต้องใช้ `describe` เสมอไป ไฟล์ที่มี test อิสระไม่กี่ตัวไม่ต้องห่อก็ได้ ใช้เมื่อมี test หลายตัวที่เกี่ยวกับเรื่องเดียวกันหรือต้องการ setup ร่วมกัน

### 2. test.beforeEach: setup ที่ใช้ร่วมกัน

```ts
test.describe("หน้าสินค้า หูฟังไร้สาย DN Buds", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products/p01");
  });

  test("แสดงชื่อสินค้าเป็น heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("หูฟังไร้สาย DN Buds");
  });
});
```

`beforeEach` ทำงาน **ก่อนทุก test** ในกลุ่ม ตัว test ที่เหลือจึงเริ่มจากหน้าที่เปิดไว้แล้ว ไม่ต้องเขียน `goto` ซ้ำ จุดที่ต้องจำ:

- hook ต้องเขียนใน scope เดียวกับ test ที่ต้องการให้มีผล (ถ้าเขียนไว้ระดับไฟล์ จะมีผลกับทุก test ในไฟล์ รวม test ที่อยู่ในทุก `describe`)
- `page` ใน hook กับ `page` ใน test ของรอบเดียวกันคือ **ตัวเดียวกัน** สถานะที่ hook ทำไว้ (เช่นเปิดหน้าไว้แล้ว) test จึงเห็นต่อเลย
- ถ้า `beforeEach` fail (เช่น `goto` ล้มเหลว) test ของรอบนั้นจะไม่ถูกรัน และนับว่า fail

ควรใส่แค่สิ่งที่ **ทุก test ต้องทำเหมือนกัน** ถ้ามี test เดียวที่ต้องการขั้นตอนพิเศษ ให้ใส่ในตัว test เอง อย่าซ่อนขั้นตอนที่ทำให้อ่าน test แล้วไม่เข้าใจไว้ใน hook ไกลๆ

### 3. test.afterEach และ testInfo

```ts
test.afterEach(async ({ page }, testInfo) => {
  await testInfo.attach("url-ตอนจบ", { body: page.url(), contentType: "text/plain" });
  console.log(`[จบ] ${testInfo.title} -> ${testInfo.status}`);
});
```

อาร์กิวเมนต์ตัวที่สองของ hook (และของ test เอง) คือ **`testInfo`** เก็บข้อมูลของ test ที่กำลังรัน ที่ใช้บ่อยคือ

| property / method | ความหมาย |
|---|---|
| `testInfo.title` | ชื่อ test |
| `testInfo.status` | ผลที่ได้จริง: `"passed"`, `"failed"`, `"timedOut"`, `"skipped"` (ใน `afterEach` ค่านี้ถูกตั้งแล้ว) |
| `testInfo.expectedStatus` | ผลที่คาดหวัง ปกติ `"passed"` (เปลี่ยนได้ด้วย `test.fail()` บท 21) |
| `testInfo.duration` | เวลาที่ใช้ (ms) |
| `testInfo.attach(name, { body, contentType })` | แนบข้อมูลเข้า HTML report (รัน `pnpm report` เพื่อดู) |

`afterEach` ทำงาน **แม้ test จะ fail** จึงเหมาะกับงานเก็บข้อมูลหรือล้างสิ่งที่ test สร้างไว้ ถ้าต้องการทำเฉพาะตอน fail ให้เช็ก `testInfo.status !== testInfo.expectedStatus`

หมายเหตุ: ตอน test fail Playwright เก็บ screenshot และ trace ให้อยู่แล้วตามค่าใน config (บท 14 และ 23) ไม่ต้องเขียน `afterEach` เองเพื่อถ่ายรูป

### 4. beforeAll / afterAll และกับดักของ page

```ts
test.beforeAll(async () => {
  // ทำงาน "ครั้งเดียว" ก่อน test แรกของกลุ่มในแต่ละ worker
});
```

ต่างจาก `beforeEach` ตรงที่รันครั้งเดียวต่อกลุ่ม ต่อ **worker process** (ไม่ใช่ครั้งเดียวต่อการรันทั้งหมด) ถ้ามี 6 worker และ test ของกลุ่มกระจายไปหลาย worker `beforeAll` จะรันซ้ำในแต่ละ worker และหาก test ใน describe ตัวหนึ่ง fail Playwright จะเริ่ม worker ใหม่ซึ่งรัน `beforeAll` ใหม่อีกรอบ

ข้อสำคัญ: **`page` เป็น fixture ระดับ test** เปิดใหม่ทุก test และปิดเมื่อ test จบ จึงขอ `page` ใน `beforeAll` ไม่ได้ (ได้เฉพาะ fixture ระดับ worker เช่น `browser`) ผู้เรียนจาก Jest มักทำแบบนี้เพื่อแชร์หน้าเดียวให้ทุก test ซึ่งเป็นกับดัก (บท 20 อธิบายและแสดงเหตุผลเต็มๆ) ใช้ `beforeAll` กับงานที่ไม่เกี่ยวกับหน้าเว็บ เช่นเตรียมข้อมูลผ่าน API หรืออ่านไฟล์

กฎง่ายๆ: **ถ้าไม่แน่ใจ ใช้ `beforeEach`** เพราะแต่ละ test ได้ state สะอาดของตัวเองเสมอ

### 5. describe ซ้อนกัน และลำดับการทำงาน

```ts
test.describe("หน้าสินค้า เมาส์ไร้สาย", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products/p03");
  });

  test.describe("ปุ่มจำนวน", () => {
    test("ปุ่มลดจำนวนกดไม่ได้ตอนเริ่ม", async ({ page }) => { /* ... */ });
  });
});
```

hooks ของกลุ่มด้านนอกทำงานก่อนกลุ่มด้านใน: `beforeEach` ด้านนอก, `beforeEach` ด้านใน, ตัว test, `afterEach` ด้านใน, `afterEach` ด้านนอก (เหมือน Jest) hooks ที่ประกาศในกลุ่มเดียวกันหลายตัวทำงานตามลำดับที่เขียน

## จุดที่มักพลาด

- **เขียน `goto` ซ้ำทุก test แล้วลืมใส่ใน test ใหม่**: ย้ายไป `beforeEach` เมื่อทุก test ใช้หน้าเดียวกัน
- **ลืม `async` / `await` ใน hook**: hook ที่ `await page.goto(...)` ต้องเป็น `async` และ `await` ให้ครบ (บท 03)
- **ใช้ `page` ใน `beforeAll`**: ไม่ได้ ต้องใช้ `beforeEach` (ดูหัวข้อ 4)
- **ซ่อนงานสำคัญใน hook ไกลตัว**: คนอ่าน test จะไม่รู้ว่าหน้าที่ตรวจเริ่มจากสถานะไหน ใส่เฉพาะ setup ที่ทุก test ใช้จริง
- **คาดว่า `beforeAll` รันครั้งเดียวทั้งหมด**: จริงๆ รันต่อ worker
- **ใส่ assertion หลักไว้ใน `afterEach`**: assertion ของแต่ละ test ควรอยู่ในตัว test เพื่อให้รายงานชี้ถูกที่

## หน้าในแอปที่ใช้

**`/products/[id]`** (ใช้ p01 = หูฟังไร้สาย DN Buds 1,290 บาท, p02 = คีย์บอร์ดเครื่องกล 2,490 บาท, p03 = เมาส์ไร้สาย, p04 = เสื้อยืด DN สีขาว, p07 = หมอนอิงลายแมว)
- h1 ชื่อสินค้า, ราคา เช่น "1,290 บาท", ลิงก์ "← กลับไปหน้าสินค้า"
- ปุ่ม "ลดจำนวน" (disabled ตอนจำนวนเป็น 1), ปุ่ม "เพิ่มจำนวน", ช่อง `aria-label="จำนวน"` ค่าเริ่ม 1

## วิธีรันบทนี้

```bash
pnpm test 19-describe-hooks
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `4 passed` และ `5 skipped` (ตัวอย่างที่ 2 จะพิมพ์บรรทัด `[จบ] ... -> passed` ออกมาด้วย)

## แบบฝึกหัดในบทนี้

1. สร้างกลุ่มสำหรับหน้าคีย์บอร์ดเครื่องกล (`/products/p02`) ให้ `beforeEach` เป็นคน `goto` แล้วเขียนสอง test ตรวจชื่อกับราคา
2. ซ้อน `describe` "ปุ่มจำนวน" ในกลุ่มของเมาส์ไร้สาย (`/products/p03`) ตรวจว่าปุ่มลดกดไม่ได้ และกดเพิ่มแล้วจำนวนเป็น 2
3. เพิ่ม `afterEach` ที่ใช้ `testInfo.attach` แนบ title ของหน้าหมอนอิงลายแมว แล้วเปิด `pnpm report` ดูว่าแนบอยู่ที่ไหน

## อ่านเพิ่ม

- [Test hooks](https://playwright.dev/docs/api/class-test#test-before-each)
- [Writing tests: using test hooks](https://playwright.dev/docs/writing-tests#using-test-hooks)
- [TestInfo](https://playwright.dev/docs/api/class-testinfo)
