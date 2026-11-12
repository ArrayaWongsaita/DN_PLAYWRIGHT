# บทที่ 20: แต่ละ test แยกจากกัน (isolation)

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- อธิบายได้ว่าทำไมสอง test ที่เพิ่มของลงตะกร้าพร้อมกันจึงไม่ปนกัน
- รู้จัก browser context และ cookie `dn_sid` ว่าเป็นกลไกที่แอป DN Shop ใช้แยกข้อมูล
- เปิด context เพิ่มเองใน test เดียวได้ เมื่อต้องจำลองผู้ใช้สองคน
- รู้กับดักของการแชร์ `page` ข้าม test ด้วย `beforeAll` และเลี่ยงได้

## เชื่อมกับที่รู้แล้ว

ใน Jest ที่ผ่านมา test ในไฟล์เดียวกันรันต่อกันใน process เดียว ตัวแปรหรือ mock ที่ตั้งไว้ใน test หนึ่งอาจค้างไปถึง test ถัดไป เลยต้องคอย `beforeEach` รีเซ็ต หรือ `jest.clearAllMocks()` ใน Playwright แนวคิดกลับกัน: **ทุก test ได้สภาพแวดล้อมใหม่ตั้งแต่ต้น** (ใหม่ทั้ง browser context และ `page`) จึงไม่ต้องรีเซ็ตอะไร และ test รันพร้อมกันได้ (บท 48 เรื่อง parallel)

## เนื้อหา

### 1. browser context: "โปรไฟล์ browser ใหม่" ของแต่ละ test

- **browser**: ตัวโปรแกรม (Chromium) เปิดครั้งเดียวต่อ worker แล้วใช้ซ้ำ
- **browser context**: เหมือนโปรไฟล์ incognito หนึ่งอัน มี cookie, localStorage, session ของตัวเอง ไม่ปนกับ context อื่น
- **page**: แท็บหนึ่งแท็บใน context

ก่อนรัน test แต่ละตัว Playwright สร้าง context ใหม่ และเปิด `page` ใหม่ใน context นั้น ให้เป็น fixture `context` และ `page` เมื่อ test จบก็ปิดทิ้ง การสร้าง context ใหม่เร็วมาก จึงทำทุก test ได้ ไม่ต้องเปิด browser ใหม่

### 2. DN Shop แยกข้อมูลอย่างไร: cookie `dn_sid`

แอปเก็บตะกร้า คำสั่งซื้อ และสินค้าที่ admin เพิ่ม ไว้ฝั่ง server แต่ **แยกตาม session** ดังนี้:

1. เมื่อ browser เปิดหน้าครั้งแรกโดยยังไม่มี cookie `dn_sid` แอปสร้างรหัสสุ่มแล้วส่งกลับเป็น cookie ชื่อ `dn_sid`
2. ทุก request ถัดมาส่ง cookie นี้ไปด้วย แอปใช้ค่านี้เลือกข้อมูลของผู้ใช้คนนั้น
3. context ใหม่ = ไม่มี cookie = ได้ `dn_sid` ใหม่ = ตะกร้าว่าง ข้อมูลเริ่มจากชุดตั้งต้น

นี่เป็นกลไก **ของแอปตัวอย่างนี้** ที่ทำให้ test ขนานกันได้โดยไม่ชนกัน (เว็บจริงมักใช้ session cookie ลักษณะเดียวกัน แต่ชื่อและวิธีเก็บต่างกัน) ถ้าแอปเก็บตะกร้าไว้ที่ server แบบรวมศูนย์ ไม่แยกตามผู้ใช้ สอง test ที่รันพร้อมกันจะเห็นตะกร้าของกันและกันและ fail แบบสุ่ม ซึ่งเป็นสาเหตุอันดับต้นๆ ของ test ที่ "บางทีผ่านบางทีไม่ผ่าน"

cookie นี้เป็นแบบ `httpOnly` โค้ดฝั่งหน้าเว็บอ่านไม่ได้ (`document.cookie` ไม่เห็น) แต่ Playwright อ่านได้จาก context:

```ts
const sid = (await context.cookies()).find((c) => c.name === "dn_sid");
expect(sid?.value).toBeTruthy();
```

และลบได้ด้วย `await context.clearCookies()` ผลคือแอปมองว่าเป็นผู้ใช้ใหม่ ตะกร้าจะว่างเมื่อโหลดหน้าใหม่ (ตัวอย่างที่ 2)

### 3. ตัวอย่าง: สอง test ต่างคนต่างเห็นตะกร้า 1 ชิ้น

```ts
test("ผู้ใช้ A: เพิ่มหูฟัง แล้วตะกร้ามี 1 ชิ้น", async ({ page }) => { /* เพิ่มหูฟัง */ });
test("ผู้ใช้ B: เพิ่มเมาส์ แล้วตะกร้ามี 1 ชิ้น", async ({ page }) => { /* เพิ่มเมาส์ */ });
```

ทั้งคู่ตรวจลิงก์ "ตะกร้า (1)" ถ้าตะกร้าใช้ร่วมกัน ตัวที่ช้ากว่าจะเห็น "ตะกร้า (2)" แต่เพราะแยก context จึงเห็น 1 เสมอ ไม่ว่าจะรันพร้อมกัน ต่อกัน หรือสลับลำดับ

การ์ดสินค้าหาด้วย `getByRole("listitem").filter({ hasText: "ชื่อสินค้า" })` (บท 16) แล้วกดปุ่ม "เพิ่มลงตะกร้า" ในการ์ดนั้น

### 4. เปิด context เพิ่มเองใน test เดียว

บางครั้งต้องการผู้ใช้สองคนใน test เดียว (เช่นแชท หรือ admin กับลูกค้า) ขอ fixture `browser` แล้วสร้างเอง:

```ts
test("สอง context ได้ dn_sid คนละค่า", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await pageA.goto("/products");
  await pageB.goto("/products");
  // ... ตรวจ ...
  await contextA.close();
  await contextB.close();
});
```

`browser.newContext()` ใช้ค่าจาก `use` ใน config (เช่น `baseURL`, `locale`) ให้เอง จึง `goto("/products")` ได้ ต้อง `close()` context ที่เปิดเองเสมอ (context จาก fixture Playwright ปิดให้เอง)

### 5. กับดัก: แชร์ page ข้าม test ด้วย beforeAll

ผู้เรียนที่มาจาก Jest อยากเปิดหน้าครั้งเดียวแล้วให้ทุก test ใช้ต่อ เพราะเร็วกว่า เลยเขียนแบบนี้ (ตัวอย่างที่ **ไม่ควรทำ** ไม่มีรันในบทนี้):

```ts
test.describe("กับดัก: แชร์ page", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();        // context ใหม่ที่ไม่ใช่ของ test ใดเลย
    await page.goto("/products");
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("เพิ่มหูฟัง", async () => { /* ใช้ page ที่แชร์ */ });
  test("เพิ่มเมาส์แล้วตะกร้าต้อง 1 ชิ้น", async () => { /* ถ้า test แรกรันก่อน จะเป็น 2 ชิ้น */ });
});
```

ปัญหาที่เกิด:

1. **state รั่วข้าม test**: ตะกร้าจากตัวแรกอยู่ต่อในตัวที่สอง ผลของ test ขึ้นกับลำดับการรัน
2. **รันขนานไม่ได้**: ทุก test ใช้หน้าเดียวกัน จึงต้องครอบด้วย `test.describe.configure({ mode: "serial" })` (หรือ `test.describe.serial`) ให้รันต่อกันตามลำดับ และถ้าตัวหนึ่ง fail ตัวที่เหลือในกลุ่มถูกข้าม
3. **ตอน retry** (บท 23, 48) Playwright เริ่ม worker ใหม่และรัน `beforeAll` ใหม่ ทั้งกลุ่มต้องเริ่มใหม่ ไม่ใช่เฉพาะตัวที่ fail
4. **debug ยาก**: เมื่อ test ที่ 5 fail จะไม่รู้ว่าสถานะที่ผิดมาจาก test ก่อนหน้าตัวไหน และรันซ้ำเฉพาะตัวนั้นเดี่ยวๆ (เช่นด้วย `--grep`) อาจผ่านหรือ fail ต่างไปจากเดิม

ทางที่ถูก: ให้ `beforeEach` ทำ `goto` ใหม่ทุก test (บท 19) ราคาแค่เสี้ยววินาที ถ้ามีขั้นตอนเตรียมของที่ช้าจริงๆ เช่น login ให้ใช้ storageState (บท 41) ไม่ใช่แชร์ `page`

`test.describe.serial` (หรือ `configure({ mode: "serial" })`) มีที่ใช้จริงเฉพาะเรื่องที่ขั้นตอนต่อกันเป็นสายจริงๆ แต่ควรเป็นข้อยกเว้นของงานแต่ละแบบ ไม่ใช่ค่าเริ่มต้น

## จุดที่มักพลาด

- **เขียน test ที่ต้องรันหลัง test อื่น**: รันเดี่ยว (`--grep`) หรือรันขนานแล้ว fail เขียนให้แต่ละ test เตรียมข้อมูลเอง
- **ลืม `close()` context ที่เปิดเอง**: context ค้างจนหมด test รายงานช้าลง
- **ใช้ `browser.newPage()` ใน `beforeAll` เพื่อแชร์ข้าม test**: ดูกับดักในหัวข้อ 5 ใช้ fixture `page` ของแต่ละ test แทน
- **พยายามอ่าน `dn_sid` จาก `document.cookie`**: เป็น httpOnly ต้องอ่านผ่าน `context.cookies()`
- **คิดว่าไฟล์เดียวกันแปลว่าไม่ขนาน**: ค่าเริ่มต้น test ต่างไฟล์ขนานกัน ส่วน test ในไฟล์เดียวกันขนานเมื่อ `fullyParallel: true` (repo นี้เปิดไว้)
- **คาดหวังว่าตะกร้าค้างข้าม test**: ไม่ค้าง ต้องเพิ่มของใหม่ในแต่ละ test

## หน้าในแอปที่ใช้

**`/products`**
- การ์ดสินค้าอยู่ใน `<ul aria-label="รายการสินค้า">` แต่ละใบมีปุ่ม "เพิ่มลงตะกร้า"
- เพิ่มสำเร็จแสดง `role="status"` `เพิ่ม "{ชื่อ}" ลงตะกร้าแล้ว`

**ทุกหน้า (header)**
- ลิงก์ "ตะกร้า (N)" N คือจำนวนชิ้นรวม (0 ได้)

**`/cart`**
- `<ul aria-label="สินค้าในตะกร้า">` แต่ละรายการเป็น `<li>`

## วิธีรันบทนี้

```bash
pnpm test 20-isolation
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `3 passed` และ `4 skipped`

## แบบฝึกหัดในบทนี้

1. เขียนสอง test แยกกัน: test หนึ่งเพิ่มเสื้อยืด DN สีขาว อีกอันเพิ่มแก้วกาแฟเซรามิก ทั้งสองต้องเห็น "ตะกร้า (1)"
2. เปิด context สองอันใน test เดียว (`browser.newContext()`) แล้วตรวจว่าค่า `dn_sid` ต่างกัน
3. ใน context แรกเพิ่มหูฟัง ตรวจว่าตะกร้าของ context ที่สองยังเป็น "ตะกร้า (0)"

## อ่านเพิ่ม

- [Isolation](https://playwright.dev/docs/browser-contexts)
- [Test isolation (best practices)](https://playwright.dev/docs/best-practices#make-tests-as-isolated-as-possible)
