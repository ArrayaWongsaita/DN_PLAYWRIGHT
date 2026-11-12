# บทที่ 48: รันขนาน, retry และ test ที่ไม่นิ่ง

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน บทนี้มี config ของตัวเอง

## จบบทนี้แล้วทำอะไรได้

- อธิบายได้ว่า worker คืออะไร และ `workers`, `fullyParallel`, `mode: "parallel"` กับ `mode: "serial"` ต่างกันอย่างไร
- ตั้ง `retries` และอ่านผลรายงานที่ขึ้นว่า "flaky" ได้ถูกต้อง
- ใช้ `--repeat-each` เพื่อทดสอบว่า test นิ่งจริง และใช้ `--fail-on-flaky-tests` ไม่ให้ test ที่ไม่นิ่งหลุดผ่าน
- ติด tag ให้ test แล้วเลือกรันหรือข้ามด้วย `--grep` และ `--grep-invert`

## เชื่อมกับที่รู้แล้ว

Jest รันไฟล์ test ขนานกันด้วย worker เหมือนกัน (ตั้งด้วย `--maxWorkers`) แต่ test ภายในไฟล์เดียวกันรันต่อกันตามลำดับเสมอ Playwright ให้เลือกได้ว่าจะขนานถึงระดับ test แต่ละตัวหรือไม่ และมี `retries` ในตัว (Jest ต้องใช้ `jest.retryTimes`) ส่วนเรื่องที่ test แต่ละตัวได้ browser context ใหม่ของตัวเอง (ตะกร้าไม่ปนกัน) คุณเห็นมาแล้วตั้งแต่บทก่อนๆ นี่คือเหตุผลที่รันขนานได้อย่างปลอดภัย

## เนื้อหา

### 1. worker คืออะไร

เวลารัน `pnpm test` Playwright เปิด process หลายตัวที่เรียกว่า **worker** แล้วแจกไฟล์ test ให้ แต่ละ worker เปิด browser ของตัวเองและรัน test ที่ได้รับตามลำดับ บรรทัดแรกของผลรันบอกจำนวนให้ เช่น `Running 8 tests using 1 worker`

- ถ้าไม่ตั้งอะไร Playwright เลือกจำนวน worker ให้เอง (ตามเอกสารคือครึ่งหนึ่งของจำนวน CPU)
- ตั้งใน config ด้วย `workers: 4` หรือบนบรรทัดคำสั่งด้วย `--workers=4` (บรรทัดคำสั่งชนะ config)
- จำนวน worker ไม่เกินจำนวน "หน่วยงาน" ที่แจกได้ ถ้ามีไฟล์เดียวและ test ในไฟล์ต้องรันต่อกัน ก็ใช้ worker เดียวต่อให้ตั้ง `--workers=8` (ดูหัวข้อถัดไป)

### 2. ขนานระดับไหน: fullyParallel และ mode

ค่าเริ่มต้นของ Playwright: **ไฟล์** ขนานกันได้ แต่ **test ในไฟล์เดียวกัน** รันต่อกันใน worker เดียว

| ตั้งค่า | ผล |
|---|---|
| `fullyParallel: true` ใน config | ทุก test ขนานกันได้ แม้อยู่ไฟล์เดียวกัน (config หลักของ repo นี้ใช้แบบนี้) |
| `test.describe.configure({ mode: "parallel" })` | เปิดขนานเฉพาะกลุ่ม `describe` นั้น |
| `test.describe.configure({ mode: "serial" })` | บังคับให้กลุ่มนั้นรันตามลำดับเสมอ และถือเป็นกลุ่มเดียวกัน |

config ของบทนี้ตั้ง `fullyParallel: false` เพื่อให้เห็นผลของ `mode` ชัดๆ

### 3. mode serial: กลุ่มที่ต้องไปด้วยกัน

กลุ่ม serial ใช้เมื่อ test ต่อเนื่องกันเป็นขั้นตอนจริงๆ (เช่น เพิ่มของ แล้วตรวจตะกร้า) พฤติกรรมที่ต้องรู้:

- รันตามลำดับในไฟล์
- ถ้า test ตัวใดล้ม ตัวที่เหลือในกลุ่มถูกข้าม (ไม่มีประโยชน์ที่จะรันต่อ)
- ถ้ามี retry จะรัน **ทั้งกลุ่ม** ใหม่ตั้งแต่ต้น (ไม่ใช่แค่ตัวที่ล้ม)

โดยปกติ fixture `page` ถูกสร้างใหม่ทุก test จึงส่งต่อสถานะไม่ได้ ในกลุ่ม serial เราสร้าง page เองใน `beforeAll` แล้วเก็บในตัวแปรของกลุ่ม ดูตัวอย่างที่ 1 ในไฟล์ spec:

```ts
test.describe.configure({ mode: "serial" });
let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});
test.afterAll(async () => {
  await page.close();
});
```

`browser.newPage()` ใช้ค่าจาก config (`baseURL` ฯลฯ) เหมือน fixture `page` ทุก test ในกลุ่มจึงใช้ context เดียวกัน ได้ cookie ตะกร้าเดียวกัน ข้อควรระวัง: กลุ่ม serial ลดประโยชน์ของการรันขนาน ใช้เท่าที่จำเป็น test ส่วนใหญ่ควรเขียนให้อิสระต่อกัน (ตั้งต้นสถานะเองด้วย API ตามบท 37) แล้วไม่ต้องใช้ serial เลย

### 4. retries และสถานะ flaky

`retries: 2` ใน config (หรือ `--retries=2`) บอกว่าถ้า test ล้ม ให้รันใหม่ได้อีกสูงสุด 2 ครั้ง ผลที่เป็นไปได้ต่อ test หนึ่งตัว:

- ผ่านรอบแรก: `passed`
- ล้มแล้วผ่านในรอบ retry: ถูกรายงานเป็น **`flaky`** (exit code ยังเป็น 0)
- ล้มทุกรอบ: `failed` (exit code 1)

เราลองรันจริงด้วย `--grep @flaky-demo --repeat-each=10` ได้ผลสรุปแบบ `4 flaky` และ `6 passed` ในรอบตัวอย่าง (ผลสุ่ม จะไม่เท่ากันทุกรอบ) และเมื่อใส่ `--retries=0` ได้ `4 failed` แทน นั่นคือ retry ไม่ได้ทำให้ test ดีขึ้น แค่ซ่อนอาการ

> สถานะ flaky คือสัญญาณเตือน ไม่ใช่รางวัล test ที่ flaky ต้องหาสาเหตุ (ปกติมาจากการรอไม่ถูกจังหวะหรือข้อมูลชนกัน) retry ในการรันจริงเป็นตาข่ายกันตก ไม่ใช่วิธีแก้

retry ก็ไม่ใช่ของวิเศษ test ที่ล้ม 30% มีโอกาสล้มติดกันสามครั้ง (รอบแรกกับ retry อีก 2 ครั้ง) ประมาณ 2.7% เหตุการณ์นี้เกิดได้จริงตอนรัน `--repeat-each=10`: บางรอบมี test ล้มครบทั้งสามครั้งจนรายงานเป็น `failed`

### 5. --repeat-each และ --fail-on-flaky-tests

- `--repeat-each=10` รันทุก test ที่เลือกซ้ำ 10 รอบ เป็นวิธีง่ายที่สุดที่จะดูว่า test นิ่งจริงไหม ถ้าไม่ผ่านครบทุกรอบ แปลว่าไม่นิ่ง (ใช้ร่วมกับ `--workers` เพื่อให้เร็วและเพิ่มแรงกดดันด้วย)
- `--fail-on-flaky-tests` ทำให้ test ที่ flaky ถือเป็นการล้ม ถ้ารัน test เดียวกันที่ได้ flaky สองครั้ง ครั้งที่ไม่ใส่ flag exit code เป็น 0 และครั้งที่ใส่ exit code เป็น 1 เหมาะกับ CI ที่ไม่ต้องการให้ test ไม่นิ่งหลุดผ่าน

### 6. tag และ --grep

ใส่ tag ให้ test ผ่านออปชันตัวที่สอง:

```ts
test("ผลลัพธ์สุ่มต้องสำเร็จ", { tag: "@flaky-demo" }, async ({ page }) => { /* ... */ });
```

แล้วเลือกรันด้วยบรรทัดคำสั่ง:

```bash
pnpm test --config lessons/48-parallel-retries/playwright.config.ts --grep @flaky-demo
pnpm test --config lessons/48-parallel-retries/playwright.config.ts --grep-invert @flaky-demo
```

บรรทัดแรกรันเฉพาะที่ติด tag บรรทัดที่สองรันทุกตัว **ยกเว้น** ที่ติด tag `pnpm verify` ของ repo ใช้ `--grep-invert @flaky-demo` กับบทนี้ เพราะ test ที่ตั้งใจให้สุ่มล้มห้ามไปทำให้การตรวจรวมล้ม

### 7. test ที่ไม่นิ่งใน DN Shop

หน้า `/playground/flaky?failRate=0.3` สุ่มแสดง "ผลลัพธ์: สำเร็จ" หรือ "ผลลัพธ์: ล้มเหลว" ตามอัตราที่ให้ (0.3 = ล้มเหลวราว 30%) ตัวอย่างที่ 2 คาดว่าเห็น "สำเร็จ" จึงล้มเองบางรอบ ตอนล้มคุณจะเห็น test รอ 5 วินาทีก่อนล้ม (เวลารอปกติของ `expect`) ข้ออื่นๆ ในบทนี้ไม่ใช้หน้านี้ ทุกข้อต้องนิ่งรันกี่รอบก็ผ่าน

## จุดที่มักพลาด

- **ใช้ retries ปิดปัญหา**: รายงานสีเขียวทั้งที่ใต้พรมมี test flaky ให้เปิดดูสถานะ flaky เสมอ และใช้ `--fail-on-flaky-tests` ถ้าทีมต้องการเข้มงวด
- **ใช้ serial มากเกินจำเป็น**: ทำให้ช้าลงและ test ตัวหนึ่งล้มแล้วตัวที่เหลือถูกข้าม
- **คิดว่า page จากกลุ่ม serial ส่งต่อให้เอง**: fixture `page` ใหม่ทุก test ต้องสร้างเองใน `beforeAll` (หัวข้อ 3) และอย่าลืมปิดใน `afterAll`
- **เขียน test ที่พึ่งลำดับโดยไม่ใช้ serial**: เมื่อรันขนานหรือสลับลำดับจะล้ม
- **`--workers=8` แล้วยังเห็น 1 worker**: ถ้า test ทั้งหมดอยู่ไฟล์เดียวและ `fullyParallel` เป็น false ก็ไม่มีอะไรให้แจก
- **ตั้ง `retries` สูงๆ**: ยิ่งสูงยิ่งซ่อนปัญหา และ test ที่ล้มจริงใช้เวลานานกว่าจะรายงาน

## หน้าในแอปที่ใช้

**`/playground/flaky`** `?failRate=0.3` ล้มเหลวราว 30% ผลอยู่ใน `role="status"` ("ผลลัพธ์: สำเร็จ" หรือ "ผลลัพธ์: ล้มเหลว")
**`/products`** กด "เพิ่มลงตะกร้า" แล้วขึ้น status `เพิ่ม "{ชื่อสินค้า}" ลงตะกร้าแล้ว`
**`/cart`** รายการอยู่ใน `<ul aria-label="สินค้าในตะกร้า">` ตะกร้าว่างขึ้น "ตะกร้าของคุณยังว่างอยู่"
**`/stores`**, **`/help/ordering`** หน้าธรรมดาที่ใช้ทำตัวอย่างขนาน

## วิธีรันบทนี้

บทนี้มี config ของตัวเอง (config หลักข้ามโฟลเดอร์นี้) ใช้ `--config`:

```bash
pnpm test --config lessons/48-parallel-retries/playwright.config.ts
```

ผลก่อนเริ่มแบบฝึกหัด: `3 passed` (ตัวอย่างที่ 1 มี 2 test ตัวอย่างที่ 2 มี 1 test) แต่ตัวอย่างที่ 2 สุ่มล้มได้ ถ้า retry ช่วยไว้จะเห็น `2 passed` กับ `1 flaky` แทน (เจอได้ทั้งสองแบบ) และ `7 skipped` แบบฝึกหัดที่เหลือเป็น `test.fixme`

คำสั่งที่ใช้ในบทนี้ (ต่อท้ายคำสั่งข้างบนได้เลย):

```bash
pnpm test --config lessons/48-parallel-retries/playwright.config.ts --repeat-each=10
pnpm test --config lessons/48-parallel-retries/playwright.config.ts --workers=2
pnpm test --config lessons/48-parallel-retries/playwright.config.ts --grep @flaky-demo --repeat-each=10 --workers=4
pnpm test --config lessons/48-parallel-retries/playwright.config.ts --grep @flaky-demo --repeat-each=10 --fail-on-flaky-tests
pnpm test --config lessons/48-parallel-retries/playwright.config.ts --grep-invert @flaky-demo
```

## แบบฝึกหัดในบทนี้

เปลี่ยน `test.fixme` ในไฟล์ `parallel-retries.spec.ts` ให้เป็น `test` แล้วเขียนตามแนวทางในคอมเมนต์

1. test ที่นิ่ง: หน้าแรกมี h1 "DN Shop" แล้วรันด้วย `--repeat-each=10` ต้องผ่านทุกรอบ
2. กลุ่ม `mode: "parallel"` ที่มี test อิสระสองตัว (หน้าสาขา และหน้าคู่มือ) แล้วรันด้วย `--workers=2` ดูบรรทัดแรกของผลรัน
3. กลุ่ม `mode: "serial"` สามขั้น (เพิ่มของ ลบของ ตะกร้าว่าง) ที่ใช้ page ร่วมกัน
4. test ที่ติด tag `@flaky-demo` ที่สุ่มล้ม 50% แล้วดูสถานะ flaky ด้วย `--repeat-each` และ `--fail-on-flaky-tests`

## อ่านเพิ่ม

- [Parallelism](https://playwright.dev/docs/test-parallel)
- [Retries](https://playwright.dev/docs/test-retries)
- [Annotations (tag)](https://playwright.dev/docs/test-annotations)
