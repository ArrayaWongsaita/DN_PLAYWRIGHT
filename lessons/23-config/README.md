# บทที่ 23: playwright.config.ts 🏫

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- อ่านและอธิบายได้ว่าทุก key ใน `playwright.config.ts` ของ repo นี้ทำอะไร
- ปรับ `timeout`, `expect.timeout`, `retries`, `use.viewport` ตามต้องการ
- รู้ว่าค่าที่ตั้งใน `use` ระดับบนสุดกับใน `projects` ต่างกันและใครชนะ
- รันด้วย config ของบทนี้เองโดยไม่กระทบบทอื่น

## เชื่อมกับที่รู้แล้ว

`jest.config.ts` ใน Jest กำหนด `testMatch`, `testEnvironment`, `setupFiles` ฯลฯ ให้ทั้งโปรเจกต์ `playwright.config.ts` ทำหน้าที่เดียวกัน: กำหนดว่า test อยู่ที่ไหน รันอย่างไร และใช้ browser ตั้งค่าอะไร ต่างกันที่ Playwright มีส่วน **browser** (`use`, `projects`) และส่วน **เซิร์ฟเวอร์ของแอป** (`webServer`) ที่ Jest ไม่มี

## เนื้อหา

### 1. บทนี้มี config ของตัวเอง

ปกติ `pnpm test` ใช้ `playwright.config.ts` ที่ root ของ repo บทนี้มี `lessons/23-config/playwright.config.ts` แยกต่างหาก ให้แก้ได้เต็มที่ แล้วรันด้วย `--config`:

```bash
pnpm test --config lessons/23-config/playwright.config.ts
```

config หลักข้ามโฟลเดอร์นี้อัตโนมัติ (ดู `testIgnore` ด้านล่าง) การแก้ config ของบทนี้จึงไม่กระทบบทอื่น และการรัน `pnpm test` ปกติก็ไม่รัน test ของบทนี้

config ของบทนี้ import ค่ากลางจาก `playwright.shared.ts` ที่ root โดย path แบบ relative (`../../playwright.shared`) เพราะอยู่ลึกสองชั้น

### 2. อธิบายทุก key ใน playwright.config.ts หลักของ repo

ไฟล์ที่ root หน้าตาแบบนี้:

```ts
import { defineConfig, devices } from "@playwright/test";
import { LESSON_CONFIG_DIRS, sharedUse, webServer } from "./playwright.shared";

export default defineConfig({
  testDir: "lessons",
  testIgnore: LESSON_CONFIG_DIRS.map((d) => `**/${d}/**`),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: sharedUse,
  webServer,
});
```

| key | ความหมายในไฟล์นี้ |
|---|---|
| `defineConfig` | ฟังก์ชันช่วยให้ editor เติมคำและเช็กชนิดของ config (ใช้ครอบ object เสมอ) |
| `testDir: "lessons"` | โฟลเดอร์ที่ Playwright ค้นหา test (ไฟล์ `*.spec.ts` / `*.test.ts` ในโฟลเดอร์นี้และลูกทั้งหมด) path เทียบกับตำแหน่งไฟล์ config |
| `testIgnore` | ไฟล์ที่ข้ามแม้อยู่ใน `testDir` ที่นี่ข้ามทุกบทที่มี config ของตัวเอง (`LESSON_CONFIG_DIRS` ใน `playwright.shared.ts` เช่น `23-config`) เพราะบทพวกนั้นต้องรันด้วย config ของมันเอง |
| `fullyParallel: true` | รัน test **ทุกตัว** ขนานกันได้ แม้อยู่ในไฟล์เดียวกัน (ปกติขนานเฉพาะระหว่างไฟล์ ภายในไฟล์เรียงตามลำดับ) ทำงานได้เพราะ test แยกกัน (บท 20) |
| `forbidOnly: !!process.env.CI` | ถ้ามี `test.only` หลงเหลือ และรันใน CI (ตัวแปรสภาพแวดล้อม `CI` ถูกตั้ง) ให้ fail ทันที (บท 21) `!!` แปลงค่าเป็น true/false |
| `retries: 0` | ไม่รัน test ซ้ำเมื่อ fail (ค่าเริ่มต้นอยู่แล้ว) ตั้งเป็น 1–2 เพื่อรองรับ test ที่ไม่เสถียรชั่วคราวใน CI ผล `flaky` = ผ่านหลัง retry (บท 48) |
| `reporter` | รูปแบบรายงาน เป็น array ของ `[ชื่อ, ตัวเลือก]` ใช้พร้อมกันหลายแบบได้: `list` = พิมพ์ทีละ test ในเทอร์มินัล, `html` = สร้างรายงานโฟลเดอร์ `playwright-report` (`open: "never"` ไม่เปิดเบราว์เซอร์เองเมื่อจบ ใช้ `pnpm report` เปิดดู) (บท 50) |
| `projects` | ชุดสภาพแวดล้อมที่จะรัน test ซ้ำทุกชุด ที่นี่มีชุดเดียวชื่อ `chromium` ถ้าเพิ่ม `firefox` หรือ `webkit` ทุก test จะรันซ้ำในแต่ละ browser (บท 43) |
| `devices["Desktop Chrome"]` | ชุดค่า preset ที่ Playwright เตรียมไว้ (userAgent, viewport 1280×720, deviceScaleFactor ฯลฯ) นำมา spread (`...`) เข้า `use` ของ project |
| `use` | ตัวเลือกของ browser/context ที่ test ใช้ ทุกค่าใน `use` ส่งต่อให้ fixture `page` / `context` อัตโนมัติ (ดูตารางข้างล่าง) |
| `webServer` | บอก Playwright ให้สตาร์ตแอปก่อนรัน test และรอจนพร้อม (ดูตารางข้างล่าง) |

#### ค่าใน `use` (มาจาก `sharedUse` ใน `playwright.shared.ts`)

| key | ความหมาย |
|---|---|
| `baseURL: "http://localhost:3100"` | ทำให้ `page.goto("/products")` ใช้ path สั้นได้ มันต่อ baseURL ให้ |
| `locale: "th-TH"` | ภาษาของ browser (มีผลกับ `navigator.language`, รูปแบบวันที่ ตัวเลข) แอปจึงแสดงวันที่แบบไทย |
| `timezoneId: "Asia/Bangkok"` | เขตเวลาของ browser เพื่อให้ test ที่เกี่ยวกับเวลาได้ผลเหมือนกันทุกเครื่อง |
| `trace: "retain-on-failure"` | บันทึก trace ทุก test แต่เก็บไว้เฉพาะที่ fail (บท 14) |
| `screenshot: "only-on-failure"` | ถ่ายภาพหน้าจอเมื่อ test fail เท่านั้น |

#### ค่าใน `webServer`

| key | ความหมาย |
|---|---|
| `command: "node scripts/start-app.mjs"` | คำสั่งสตาร์ตแอป (build ถ้าจำเป็นแล้วรันที่พอร์ต 3100) |
| `cwd` | โฟลเดอร์ที่รันคำสั่ง ตั้งเป็น root ของ repo เสมอ เพื่อให้ config ในโฟลเดอร์บทต่างๆ ก็ใช้คำสั่งนี้ได้ถูกที่ |
| `url: ".../api/health"` | Playwright poll URL นี้จนตอบ 2xx ถึงถือว่าแอปพร้อม แล้วค่อยเริ่มรัน test |
| `reuseExistingServer: !process.env.CI` | ถ้ามีแอปรันอยู่แล้วที่ URL นั้น (ในเครื่องเรา) ใช้ตัวนั้นเลย ไม่สตาร์ตใหม่ ใน CI สตาร์ตใหม่เสมอ |
| `timeout: 180_000` | รอแอปพร้อมได้นานสุด 3 นาที (รอบแรกต้อง build ใช้เวลา) |

### 3. key อื่นที่ config ของบทนี้เพิ่ม

| key | ความหมาย |
|---|---|
| `testDir: "."` | ค้นหา test ในโฟลเดอร์เดียวกับ config นี้ |
| `timeout: 30_000` | เวลาสูงสุดของ test หนึ่งตัว (รวม hooks) เกินแล้ว fail ด้วย `Test timeout of 30000ms exceeded` ค่าเริ่มต้นคือ 30 วินาที |
| `expect: { timeout: 5_000 }` | เวลาสูงสุดที่ web-first assertion (`toBeVisible`, `toHaveText` ฯลฯ) รอ ค่าเริ่มต้นคือ 5 วินาที แยกจาก `timeout` ด้านบน ถ้า assertion ตัวไหนต้องการเวลาต่างออกไปเป็นพิเศษ ใส่ `{ timeout: ... }` ที่ assertion นั้นแทนได้ |

ลำดับความสำคัญ (มากไปน้อย): ค่าที่ระบุใน assertion หรือ action นั้นเอง, `test.use`/`test.setTimeout` ในไฟล์ test, `use` ใน `projects[]`, `use` ระดับบนสุดของ config, ค่าเริ่มต้นของ Playwright

### 4. use ระดับ config เทียบกับระดับ project

```ts
export default defineConfig({
  use: { viewport: { width: 390, height: 844 } },          // ระดับบนสุด
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } }, // devices มี viewport 1280x720
  ],
});
```

ตัวอย่างข้างบน viewport ที่ใช้จริงคือ **1280×720** ไม่ใช่ 390×844 เพราะ `use` ของ project ชนะ `use` ระดับบนสุด และ `devices["Desktop Chrome"]` ใส่ `viewport` มาให้ใน project ถ้าต้องการเปลี่ยน viewport ให้เขียนต่อท้ายหลัง spread ใน project:

```ts
{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } }
```

ใน JavaScript ถ้า key ซ้ำกัน ตัวที่เขียน **หลัง** ชนะ จึงต้องวางต่อท้าย `...devices[...]` เสมอ

### 5. ตัวอย่างอ่านค่า config จากใน test

```ts
test("page ใช้ viewport ตามที่ config กำหนด", async ({ page }, testInfo) => {
  await page.goto("/");
  expect(page.viewportSize()).toEqual(testInfo.project.use.viewport);
});
```

`testInfo.project` คือ project ที่ test รันอยู่ ให้ test รู้ค่า config ของตัวเองได้ เช่น `testInfo.project.use.viewport`, `testInfo.project.name`, `testInfo.timeout`

### 6. ค่าที่ตั้งเฉพาะไฟล์/กลุ่มได้โดยไม่แตะ config

| ต้องการ | ใส่ใน test file |
|---|---|
| timeout ของ test ในไฟล์นี้ | `test.setTimeout(60_000)` |
| ตัวเลือก browser ให้ทั้งไฟล์/กลุ่ม | `test.use({ viewport: { width: 390, height: 844 } })` |
| retries เฉพาะกลุ่ม | `test.describe.configure({ retries: 2 })` |

config คือค่าตั้งต้นของทั้งชุด ถ้ามีกรณีเฉพาะไฟล์ ใช้ตัวเลือกพวกนี้ใน test file แทนการแก้ config ที่ทุกคนใช้ร่วมกัน

## จุดที่มักพลาด

- **วาง `viewport` ที่ `use` บนสุดแต่ project ใช้ `devices`**: ไม่มีผล ต้องเขียนใน `use` ของ project หลัง `...devices[...]`
- **สับสน `timeout` กับ `expect.timeout`**: อันแรกคือทั้ง test (30 วินาที) อันหลังคือการรอของ assertion ตัวเดียว (5 วินาที) test ที่รอข้อมูลช้า 7 วินาทีล้มเพราะอันหลัง
- **ใช้ `retries` ซ่อน test ไม่เสถียร**: ผล `flaky` ต้องตามแก้สาเหตุ (บท 48)
- **ลืมครอบคำสั่งด้วย `--config`**: รัน `pnpm test 23-config` เฉยๆ จะไม่เจอ test เพราะ config หลักข้ามโฟลเดอร์นี้
- **path ใน config ผิดเมื่อ config อยู่ในโฟลเดอร์ลึก**: path ของ `testDir` เทียบกับไฟล์ config ส่วน `webServer.command` เทียบกับ `cwd` (ที่ตั้งเป็น root แล้ว)
- **แก้ config แล้วไม่เห็นผล**: ตรวจว่ารันด้วย config ที่แก้อยู่จริง (ดู `--config`)
- **ตั้ง `retries` สูงเกินไปในเครื่องตัวเอง**: จะบังไม่ให้เห็น test ที่ไม่เสถียร

## หน้าในแอปที่ใช้

**`/`** หน้าแรก มี header `<nav aria-label="เมนูหลัก">` จอกว้างน้อยกว่า 768px จะซ่อน nav แล้วแสดงปุ่ม "เปิดเมนู"
**`/products`** ใช้ตรวจ baseURL
**`/playground/slow`** อ่าน `?delay=` (มิลลิวินาที) ปุ่ม "โหลดข้อมูล" แสดง `role="status"` "กำลังโหลด..." แล้วเป็น "โหลดข้อมูลเสร็จแล้ว" เมื่อครบเวลา

## วิธีรันบทนี้

```bash
pnpm test --config lessons/23-config/playwright.config.ts
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `3 skipped`

## แบบฝึกหัดในบทนี้

แก้ไฟล์ `lessons/23-config/playwright.config.ts` (มีคอมเมนต์ `👉 แบบฝึกหัดข้อ N` กำกับจุดที่ต้องแก้) แล้วเปลี่ยน `test.fixme` ในไฟล์ `config.spec.ts` ให้เป็น `test` ต้องผ่านเมื่อแก้ config ถูก

1. ตั้ง `expect.timeout` เป็น 10 วินาที เพื่อให้ test ที่โหลดข้อมูลช้า 7 วินาทีผ่าน (ลองรันก่อนแก้เพื่อดูข้อความ error timeout 5000ms)
2. ตั้ง `retries: 1` เพื่อให้ test ที่ fail รอบแรกผ่านในรอบ retry (ดูผล `flaky` ในสรุป)
3. ตั้ง viewport ของ project เป็นมือถือ 390×844 เพื่อให้หน้าแรกแสดงปุ่ม "เปิดเมนู"

หมายเหตุ: ตัวอย่างที่ 1 และ 2 ผ่านทุกค่าที่คุณตั้ง (อ่านค่าจาก config เอง) จึงต้องผ่านตลอด

## อ่านเพิ่ม

- [Test configuration](https://playwright.dev/docs/test-configuration)
- [Test use options](https://playwright.dev/docs/test-use-options)
- [Web server](https://playwright.dev/docs/test-webserver)
