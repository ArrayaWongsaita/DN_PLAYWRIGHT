# บทที่ 44: ถ่ายภาพหน้าจอและอัดวิดีโอ

บทนี้เขียนให้อ่านเองได้ ตัวอย่างและเฉลยในบทนี้รันบน chromium ลองรันแล้วเปิดไฟล์ที่ได้ใน `test-results/` ดูไปพร้อมกับอ่าน

## จบบทนี้แล้วทำอะไรได้

- ถ่ายภาพทั้งหน้า (`fullPage`) หรือเฉพาะ element ด้วย `page.screenshot` และ `locator.screenshot` แล้วเก็บเป็นไฟล์หรือเป็น `Buffer`
- แนบภาพเข้ารายงานด้วย `testInfo.attach`
- เปิดการอัดวิดีโอด้วย `test.use({ video: "on" })` และรู้ว่าไฟล์ผลลัพธ์อยู่ที่ไหนใน `test-results/`
- อธิบายความหมายของ option `screenshot`, `video`, `trace` ใน config ได้

## เชื่อมกับที่รู้แล้ว

ตอน test ล้ม ผู้เรียนมีแค่ข้อความ error ใน terminal แล้วต้องเดาว่าหน้าตอนนั้นหน้าตาเป็นอย่างไร บท 14 สอนให้เปิด trace viewer ไปแล้ว บทนี้เป็นเครื่องมือเสริมคือ "ภาพนิ่ง" และ "วิดีโอ" ของสิ่งที่ browser เห็น ซึ่งส่งให้เพื่อนร่วมทีมดูได้ง่ายกว่า trace และ config `trace: "retain-on-failure"` กับ `screenshot: "only-on-failure"` ที่เห็นใน `playwright.shared.ts` ก็คือ option ชุดเดียวกับที่บทนี้อธิบาย

## เนื้อหา

### 1. page.screenshot: ถ่ายภาพทั้งหน้า

```ts
await page.screenshot({ path: testInfo.outputPath("home-full.png"), fullPage: true });
```

- `path` คือที่เก็บไฟล์ ถ้าไม่ใส่ `path` จะไม่มีไฟล์ แต่ได้ `Buffer` ของภาพกลับมาแทน (ใช้ต่อได้ เช่น แนบเข้ารายงาน)
- ค่าเริ่มต้นถ่ายเฉพาะส่วนที่เห็นในจอ (viewport ของ project คือ 1280x720) ใส่ `fullPage: true` เพื่อถ่ายทั้งหน้ารวมส่วนที่ต้องเลื่อนลงไปดู
- ชนิดไฟล์ดูจากนามสกุลของ `path` (`.png` หรือ `.jpeg`)
- ก่อนถ่าย ให้รอให้หน้าวาดเสร็จด้วย assertion ที่ตรวจสิ่งที่ต้องเห็น (เช่น `expect(heading).toBeVisible()`) ไม่ใช่การหน่วงเวลา

### 2. testInfo.outputPath: ที่เก็บไฟล์ที่ไม่ชนกัน

test รันขนานกันหลาย worker ถ้าทุก test เขียนไฟล์ชื่อ `home.png` ที่เดียวกัน จะเขียนทับกัน `testInfo.outputPath("ชื่อไฟล์")` ให้ path ในโฟลเดอร์ของ test ตัวนั้นเองใต้ `test-results/` (เช่น `test-results/44-screenshots-video-...-chromium/home-full.png`) ไม่ซ้ำกับ test อื่น และ Playwright ล้างโฟลเดอร์นี้ให้เองทุกครั้งที่เริ่มรัน `test-results/` อยู่ใน `.gitignore` แล้ว ไม่ต้องกลัวเผลอ commit

`testInfo` คืออาร์กิวเมนต์ตัวที่สองของฟังก์ชัน test: `async ({ page }, testInfo) => { ... }`

### 3. locator.screenshot: ถ่ายเฉพาะ element

```ts
const nav = page.getByRole("navigation", { name: "เมนูหลัก" });
const buffer = await nav.screenshot();
```

ถ่ายเฉพาะกรอบของ element นั้น Playwright เลื่อนให้เห็นและรอให้ element นิ่ง (ไม่ขยับ) ก่อนถ่ายให้เอง เหมาะกับการเก็บภาพเฉพาะส่วนที่สนใจ เช่น ตารางหรือฟอร์ม

### 4. testInfo.attach: แนบไฟล์เข้ารายงาน

```ts
await testInfo.attach("หน้าแรกทั้งหน้า", { path, contentType: "image/png" });
await testInfo.attach("เมนูหลัก", { body: buffer, contentType: "image/png" });
```

- ใช้ `path` เมื่อมีไฟล์อยู่แล้ว หรือ `body` เมื่อมีข้อมูลอยู่ในหน่วยความจำ (`Buffer` หรือ string) อย่างใดอย่างหนึ่ง
- `contentType` บอกชนิดไฟล์ เพื่อให้รายงานแสดงภาพเป็นภาพ
- ไฟล์ที่แนบไปแสดงในรายงาน HTML ในส่วน Attachments ของ test นั้น เปิดด้วย `pnpm report` (config หลักของ repo ตั้ง reporter `html` ไว้แล้ว)
- ชื่อแนบควรไม่ซ้ำกันใน test เดียวกัน เพื่อให้แยกออกว่าอันไหนคืออันไหน

### 5. ตัวอย่างที่ 1 และ 2 ในไฟล์

ตัวอย่างที่ 1 ถ่ายทั้งหน้าแรกลงไฟล์ ตรวจว่าไฟล์ไม่ว่าง แล้วแนบเข้ารายงาน ตัวอย่างที่ 2 ถ่ายเฉพาะเมนูหลักเป็น `Buffer` แล้วแนบด้วย `body` เมื่อรันจะเห็นไฟล์ `home-full.png` ใต้ `test-results/` ของ test นั้น

### 6. อัดวิดีโอด้วย test.use({ video: "on" })

บนสุดของไฟล์ spec มีบรรทัดนี้:

```ts
test.use({ video: "on" });
```

ทำให้ทุก test ในไฟล์อัดวิดีโอ ได้ไฟล์ `video.webm` ในโฟลเดอร์ของ test นั้นใต้ `test-results/` (ได้ไฟล์แม้ test จะผ่าน) สิ่งที่ต้องรู้:

- **`video` ตั้งได้เฉพาะระดับบนสุดของไฟล์หรือใน config** ถ้าใส่ใน `test.describe` Playwright จะ error ว่า `Cannot use({ video }) in a describe group, because it forces a new worker` เหตุผลคือการอัดวิดีโอต้องเริ่มตั้งแต่สร้าง browser context
- ไฟล์วิดีโอเขียนเสร็จตอน test จบและปิด page แล้ว จึงเปิดดูได้หลังรันเสร็จเท่านั้น ใน test เรียก `page.video()` ได้ (ได้ object หรือ `null` ถ้าไม่ได้อัด) แต่ยังเปิดไฟล์ไม่ได้
- วิดีโอทำให้รันช้าลงและกินที่ จึงเปิดเฉพาะตอนต้องการดู ไม่เปิดทั้ง repo

### 7. option screenshot / video / trace ใน config

ทั้งสามตั้งได้ที่ `use` ใน config (ทุก test) หรือ `test.use({ ... })` ในไฟล์ ค่าของ `playwright.shared.ts` ใน repo นี้คือ `trace: "retain-on-failure"` และ `screenshot: "only-on-failure"` ส่วน `video` ไม่ได้ตั้ง จึงเป็นค่าเริ่มต้น `"off"`

| option | ค่าที่ใช้ได้ (ตามไฟล์ type ของ Playwright 1.65) | ความหมายที่ใช้บ่อย |
|---|---|---|
| `screenshot` | `"off"`, `"on"`, `"only-on-failure"`, `"on-first-failure"` | ถ่ายภาพตอนจบ test: ทุกครั้ง หรือเฉพาะที่ล้ม |
| `video` | `"off"`, `"on"`, `"retain-on-failure"`, `"on-first-retry"`, `"on-all-retries"`, `"retain-on-first-failure"`, `"retain-on-failure-and-retries"` | `"on"` อัดทุก test และเก็บไว้ทุกอัน, `"retain-on-failure"` อัดทุก test แต่เก็บเฉพาะที่ล้ม |
| `trace` | `"off"`, `"on"`, `"retain-on-failure"`, `"on-first-retry"`, `"on-all-retries"`, `"retain-on-first-failure"`, `"retain-on-failure-and-retries"` | เหมือน video แต่ได้ไฟล์ trace เปิดด้วย trace viewer |

ที่ใช้จริงบ่อยคือ `"retain-on-failure"` (ได้หลักฐานเฉพาะตอนล้ม ไม่เปลืองที่) และ `"on-first-retry"` (บน CI ที่ตั้ง retry ไว้ จะเก็บเฉพาะตอนรันซ้ำครั้งแรก) ในบทนี้ลองรันจริงเฉพาะ `video: "on"` ส่วนค่าอื่นในตารางอ้างอิงจากไฟล์ type ของ Playwright 1.65 ใน `node_modules`

## จุดที่มักพลาด

- **ตั้ง `video` ใน `test.describe`**: error ตามหัวข้อ 6 ให้ย้ายไปบนสุดของไฟล์
- **ถ่ายภาพก่อนหน้าวาดเสร็จ**: ได้ภาพหน้าว่างหรือครึ่งเดียว ให้รอ assertion ที่ตรวจสิ่งที่ต้องเห็นก่อน
- **ตั้งชื่อไฟล์ภาพตายตัวนอก `testInfo.outputPath`** (เช่น `"home.png"` ที่ root): test ที่รันขนานเขียนทับกัน และไฟล์เกะกะ repo
- **ลืมใส่ `contentType` ตอน attach ด้วย `body`**: รายงานไม่รู้ว่าเป็นภาพ
- **คิดว่า `fullPage` ได้ภาพขนาดเท่ากันทุกหน้า**: ความสูงของภาพขึ้นกับเนื้อหาของหน้านั้น
- **เปิดวิดีโอใน test แล้วหวังเปิดไฟล์ทันที**: ไฟล์เสร็จตอน test จบ
- **รอดูผลของ `screenshot: "only-on-failure"` ตอนที่ test ผ่านหมด**: ไม่มีภาพเพราะไม่มีอะไรล้ม (ลองทำให้ test ล้มเองเพื่อดู)

## หน้าในแอปที่ใช้

**`/`** หน้าแรก: h1 "DN Shop" และ `<nav aria-label="เมนูหลัก">` ที่มีลิงก์ "หน้าแรก", "สินค้า", "ตะกร้า", "เข้าสู่ระบบ" ส่วน Flash Sale คือ `<section>` ที่ชื่อ "Flash Sale" (role `region`) ซึ่งมี timer นับถอยหลังอยู่ภายใน
**`/products`** สินค้า: h1 "สินค้าทั้งหมด" ปุ่ม "เพิ่มลงตะกร้า" ในแต่ละการ์ด กดแล้วขึ้น `role="status"` ที่มีข้อความ `เพิ่ม "..." ลงตะกร้าแล้ว`

## วิธีรันบทนี้

```bash
pnpm test 44-screenshots-video
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `4 skipped`

หลังรันเสร็จ เปิดโฟลเดอร์ `test-results/` ดูไฟล์ `home-full.png` และ `video.webm` ได้เลย หรือเปิดรายงาน:

```bash
pnpm report
```

## แบบฝึกหัดในบทนี้

ทำในไฟล์ `screenshots-video.spec.ts` เปลี่ยน `test.fixme` เป็น `test` ทีละข้อ

1. ถ่ายภาพหน้า `/products` เก็บเป็นไฟล์ด้วย `testInfo.outputPath` แล้วตรวจว่าไฟล์ไม่ว่าง
2. ถ่ายเฉพาะส่วน Flash Sale (`getByRole("region", { name: "Flash Sale" })`) แล้วแนบเข้ารายงานด้วย `body`
3. ถ่ายภาพหน้าแรกสองแบบ (เฉพาะที่เห็นกับทั้งหน้า) แล้วเทียบขนาด และแนบทั้งสองภาพ
4. กดเพิ่มสินค้าลงตะกร้าแล้วไปเปิดวิดีโอของ test นี้ใน `test-results/`

## อ่านเพิ่ม

- [Screenshots (playwright.dev)](https://playwright.dev/docs/screenshots)
- [Videos และ test options (playwright.dev)](https://playwright.dev/docs/test-use-options)
- [TestInfo.attach (playwright.dev)](https://playwright.dev/docs/api/class-testinfo#test-info-attach)
