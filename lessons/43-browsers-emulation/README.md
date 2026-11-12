# บทที่ 43: หลาย browser และการจำลองสภาพแวดล้อม (emulation)

บทนี้เขียนให้อ่านเองได้ ผู้เขียนรันตัวอย่างและเฉลยทุกข้อจริงบน chromium, webkit และ Mobile Safari แล้ว ส่วน firefox ผู้เขียนไม่ได้รัน (อธิบายในหัวข้อ 10) ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- ตั้งหลาย project ใน config ให้ test ชุดเดียวรันบน chromium, firefox, webkit และมือถือ (Mobile Safari)
- จำลองขนาดจอมือถือ ภาษา เขตเวลา โหมดมืด ตำแหน่งที่ตั้ง และสถานะออฟไลน์ ด้วย option ของ browser context
- ใช้ `page.clock` ร่วมกับ `timezoneId` เพื่อตรวจข้อความที่ขึ้นกับเวลาได้โดยไม่ต้องรอเวลาจริง
- รู้ว่าการจำลองแบบไหนตั้งใน config และแบบไหนตั้งใน test

## เชื่อมกับที่รู้แล้ว

Jest รัน test ในสภาพแวดล้อมเดียว (Node + jsdom ตามที่ตั้ง) ส่วนเว็บจริงถูกเปิดโดยผู้ใช้หลากหลาย: Chrome, Safari, Firefox บนจอและภาษาและเวลาต่างกัน Playwright ช่วยให้ "สลับสภาพแวดล้อม" ได้ด้วยการตั้งค่า ไม่ต้องแก้โค้ด test บทก่อนหน้า: บท 23 สอน `use` และ `projects` บท 31 สอน `page.clock` บทนี้เอามาใช้จริงกับหลาย browser

## เนื้อหา

### 1. ติดตั้ง browser เพิ่ม

`pnpm install` ของ repo นี้ลง Playwright แล้ว แต่ browser ที่ใช้ตอนแรกคือ chromium เท่านั้น บทนี้ใช้ firefox และ webkit ด้วย ติดตั้งก่อนรัน:

```bash
pnpm exec playwright install firefox webkit
```

ถ้ายังไม่ได้ติดตั้ง browser ที่ project ต้องการ test ใน project นั้นจะรันไม่ได้ ใช้ `pnpm exec playwright install` เฉยๆ เพื่อติดตั้งครบทุกตัว

### 2. หลาย project ใน config

```ts
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
  { name: "Mobile Safari", use: { ...devices["iPhone 15"] } },
],
```

- ทุก test จะรัน **ซ้ำครบทุก project** (test 1 ตัว x 4 project = 4 การรัน) ผลรันขึ้นชื่อ project ในวงเล็บเหลี่ยม เช่น `[webkit] › ...`
- `devices[...]` คือชุดค่าสำเร็จรูป (userAgent, viewport, `isMobile`, `hasTouch`, `deviceScaleFactor` และ browser ที่ใช้) ชื่อ `"iPhone 15"` เป็นชื่อที่มีใน Playwright 1.65 ตรวจจาก `devices` ของ 1.65 แล้ว (มี iPhone 13 ถึง 16 ฯลฯ ด้วย) ถ้าเขียนชื่อผิด `devices["..."]` จะได้ `undefined` และ spread แล้วไม่มีค่าอะไรใส่เข้ามา ระวังพิมพ์ชื่อให้ตรง
- ใช้รันเฉพาะ project เดียวด้วย `--project`:

```bash
pnpm test --config lessons/43-browsers-emulation/playwright.config.ts --project=webkit
```

### 3. จำลองสภาพแวดล้อมด้วย option ของ context

option ทั้งหมดนี้ตั้งได้ที่ `use` ใน config (ทุก test) หรือ `test.use({ ... })` ในไฟล์ (เฉพาะไฟล์หรือกลุ่ม) เหมือนที่ทำกับ `storageState` ในบท 41:

| ต้องการจำลอง | option | ตัวอย่าง |
|---|---|---|
| ขนาดจอ | `viewport` | `{ width: 390, height: 844 }` |
| ภาษา | `locale` | `"en-US"` (ค่าเริ่มต้นของ repo นี้คือ `th-TH`) |
| เขตเวลา | `timezoneId` | `"America/New_York"` (ค่าเริ่มต้นของ repo คือ `Asia/Bangkok`) |
| โหมดมืด/สว่าง | `colorScheme` | `"dark"` |
| ตำแหน่ง | `geolocation` | `{ latitude: 13.7563, longitude: 100.5018 }` |
| อนุญาตสิทธิ์ | `permissions` | `["geolocation"]` |
| ออฟไลน์ | (เรียกใน test) | `await context.setOffline(true)` |

เหตุผลที่ `locale` กับ `timezoneId` ตั้งไว้ใน `sharedUse` ของ repo: ให้ผลเหมือนกันทุกเครื่อง ไม่ว่าเครื่องคุณจะตั้งภาษาหรือเขตเวลาเป็นอะไร (ดูบท 23)

### 4. ตัวอย่างที่ 1: โหมดมืด

```ts
test.describe("โหมดมืด", () => {
  test.use({ colorScheme: "dark" });

  test("พื้นหลังหน้าเว็บเป็นสีเข้ม", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(17, 24, 39)");
  });
});
```

`colorScheme: "dark"` ทำให้ `prefers-color-scheme: dark` เป็นจริง แอปจึงเปลี่ยนสี `toHaveCSS` ตรวจค่า style ที่ browser คำนวณแล้ว (ตอน light คือ `rgb(255, 255, 255)`) ผู้เขียนรันตัวอย่างนี้ผ่านบน chromium, webkit และ Mobile Safari (firefox ไม่ได้รัน)

### 5. ตัวอย่างที่ 2: fixture isMobile ให้ test เดียวใช้ได้ทุก project

```ts
test("หัวเว็บแสดงเมนูต่างกัน...", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "เปิดเมนู" })).toBeVisible({ visible: isMobile });
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" }).getByRole("link", { name: "สินค้า" })).toBeVisible({
    visible: !isMobile,
  });
});
```

`isMobile` มาจาก `use.isMobile` ของ project (`devices["iPhone 15"]` ตั้งเป็น true) จอแคบกว่า 768px แอปซ่อน nav แล้วแสดงปุ่ม "เปิดเมนู" ใน project `Mobile Safari` ปุ่มนี้จึงเห็น ส่วน project อื่นใช้ viewport 1280x720 เห็น nav ตามปกติ `toBeVisible({ visible: isMobile })` หมายถึง "ต้องเห็น" เมื่อ `isMobile` เป็น true และ "ต้องไม่เห็น" เมื่อเป็น false ทำให้ test เดียวตรวจได้ทุก project โดยไม่ต้องเขียน `if` ครอบ `expect` (ซึ่ง lint เตือน) ควรใช้แบบนี้เฉพาะเมื่อพฤติกรรมต่างกันจริงตามอุปกรณ์

### 6. ตำแหน่งที่ตั้งและ permission

หน้า `/stores` กดปุ่ม "หาสาขาใกล้ฉัน" แล้วแอปเรียก `navigator.geolocation` ใน test ต้องตั้ง 2 อย่างคู่กัน:

```ts
test.use({
  geolocation: { latitude: 13.7563, longitude: 100.5018 },
  permissions: ["geolocation"],
});
```

`geolocation` กำหนดพิกัดที่ browser จะตอบ ส่วน `permissions` คืออนุญาตสิทธิ์ให้เว็บ ผู้เขียนลองตั้งแค่ `geolocation` ไม่ใส่ `permissions` ใน chromium และ webkit แล้วเว็บแสดง `role="alert"` "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง" (ถูกปฏิเสธ) เมื่อใส่ครบจึงได้ "สาขาที่ใกล้ที่สุดคือ สาขาสยาม"

> หมายเหตุ: ตัวอย่างโหมดมืด, geolocation และออฟไลน์ ผู้เขียนยืนยันบน chromium และ webkit (รวม Mobile Safari) เท่านั้น ไม่ได้รันบน firefox

### 7. เขตเวลา และ page.clock

คำทักทายบนหน้าแรก (`data-testid="greeting"`) เปลี่ยนตามชั่วโมงในเครื่องผู้ใช้: 05:00-11:59 "สวัสดีตอนเช้า", 12:00-16:59 "สวัสดีตอนบ่าย", ที่เหลือ "สวัสดีตอนเย็น" ถ้าใช้เวลาจริง test จะผ่านหรือไม่ผ่านขึ้นกับว่ารันตอนไหน จึงต้องควบคุมเวลา:

```ts
test.use({ timezoneId: "America/New_York" });
test("...", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-06-01T01:00:00Z") });
  await page.goto("/");
  await expect(page.getByTestId("greeting")).toHaveText("สวัสดีตอนเย็น");
});
```

- `page.clock.install({ time })` ตั้งเวลาปลอมของหน้า ต้องเรียกก่อน `goto` เพื่อให้โค้ดของหน้าเห็นเวลาปลอมตั้งแต่เริ่ม (บท 31)
- `new Date("2026-06-01T01:00:00Z")` คือ 01:00 UTC เป็นเวลาที่ตรงกันทั่วโลก แต่ "ชั่วโมงบนนาฬิกา" ต่างกันตามเขตเวลา: `Asia/Bangkok` (UTC+7) เป็น 08:00 จึง "ตอนเช้า" ส่วน `America/New_York` เป็น 21:00 ของวันก่อน (ตั้งวันที่ในฤดูร้อนที่เขตนี้เป็น UTC-4) จึง "ตอนเย็น"
- ผู้เขียนรันสองเขตเวลานี้ผ่านบน chromium, webkit และ Mobile Safari

### 8. locale: วันที่เปลี่ยนภาษา

หน้าแรกแสดงวันที่ใน `data-testid="today"` ด้วย `Intl.DateTimeFormat(navigator.language, { dateStyle: "full" })` เมื่อ `locale: "en-US"` `navigator.language` เป็น `en-US` วันที่จึงเป็นภาษาอังกฤษ เช่น "Thursday, November 12, 2026" วันที่เปลี่ยนทุกวัน จึง **อย่า** เทียบข้อความเต็ม ให้ตรวจรูปแบบด้วย regular expression เช่น `/^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}$/`

### 9. ออฟไลน์

```ts
await context.setOffline(true);
await expect(page.getByRole("status").filter({ hasText: "ไม่มีการเชื่อมต่ออินเทอร์เน็ต" })).toBeVisible();
```

`setOffline` เป็นของ `context` (ไม่ใช่ `page`) ตอนออฟไลน์ browser ยิง event `offline` แอปจึงแสดงแถบแจ้งเตือน และเมื่อเรียก `setOffline(false)` แถบนี้หาย ผู้เขียนลองแล้วได้ผลเหมือนกันบน chromium และ webkit (ยืนยันเฉพาะสองตัวนี้ ไม่ได้รันบน firefox) ให้ `goto` ให้เสร็จก่อนค่อยออฟไลน์ เพราะ `goto` ตอนออฟไลน์ไม่ได้หน้า

### 10. ถ้า firefox รันไม่ขึ้น

ผู้เขียนไม่ได้รัน test ของบทนี้บน firefox (เครื่องที่ใช้เขียนเปิด firefox ไม่ขึ้น) ผลที่ยืนยันแล้วจึงมีเฉพาะ chromium, webkit และ Mobile Safari ส่วน firefox ให้ถือว่ายังไม่ได้ยืนยัน (จะตรวจบน CI หรือเครื่องอื่นภายหลัง)

ถ้า firefox บนเครื่องคุณรันไม่ขึ้น ลองตามลำดับ:

1. อ่านข้อความ error: ถ้าเป็น `Executable doesn't exist` แปลว่ายังไม่ได้ติดตั้ง ให้รัน `pnpm exec playwright install firefox`
2. ถ้าติดตั้งแล้วแต่ยังเปิดไม่ขึ้น (เช่น `Could not find profile folder`) ให้ลองติดตั้งซ้ำด้วย `pnpm exec playwright install --force firefox` ถ้ายังไม่หาย ให้รันเฉพาะ project อื่นด้วยคำสั่งในหัวข้อ "วิธีรันบทนี้"
3. แจ้งผู้สอน และ **อย่าลบ project firefox ออกจาก config**

ถ้า test ผ่านใน browser อื่นแต่ล้มใน firefox ที่เปิดขึ้นปกติ ก็แจ้งผู้สอนเช่นกัน

## จุดที่มักพลาด

- **ลืมติดตั้ง browser**: test ใน firefox/webkit รันไม่ได้ ให้รัน `pnpm exec playwright install firefox webkit`
- **ใส่แค่ `geolocation` ไม่ใส่ `permissions`**: เว็บถูกปฏิเสธการเข้าถึงตำแหน่ง (เห็นข้อความ "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง")
- **เรียก `page.clock.install` หลัง `goto`**: โค้ดของหน้าอ่านเวลาไปแล้วตอนโหลด ต้องเรียกก่อน
- **เทียบวันที่ด้วยข้อความเต็ม**: ผ่านวันนี้ ล้มพรุ่งนี้ ใช้ regular expression ของรูปแบบแทน
- **ตั้ง `timezoneId` แต่ไม่คุมเวลา**: ชั่วโมงขึ้นกับเวลาจริงที่รัน ต้องใช้ `page.clock` ควบคู่
- **พิมพ์ชื่อใน `devices[...]` ผิด**: ได้ `undefined` ไม่ error ตอน spread (ให้ editor ช่วยเติมชื่อ)
- **คิดว่าทุก browser เหมือนกัน**: ตัวอย่างในบทนี้ผ่านเหมือนกันใน chromium, webkit, Mobile Safari แต่ test ของแอปอื่นอาจต่าง ต้องรันจริงทุก project
- **`isMobile` ไม่ใช่การตั้งขนาดจอ**: viewport ต้องตั้งแยก (ใน `devices` ตั้งให้พร้อมกันแล้ว) ในข้อ 1 ใช้ `viewport` ตรงๆ

## หน้าในแอปที่ใช้

**`/`** หน้าแรก: `data-testid="greeting"` (คำทักทายตามเวลาในเครื่อง), `data-testid="today"` (วันที่ตาม `navigator.language`), ปุ่ม "เปิดเมนู" เมื่อจอแคบกว่า 768px
**`/stores`** สาขาของเรา: ปุ่ม "หาสาขาใกล้ฉัน" ผลคือ `role="status"` "สาขาที่ใกล้ที่สุดคือ สาขาสยาม" หรือ `role="alert"` "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง"
**ทุกหน้า** ตอนออฟไลน์แสดง `role="status"` "ไม่มีการเชื่อมต่ออินเทอร์เน็ต" และพื้นหลัง body เป็น `rgb(17, 24, 39)` เมื่อ `prefers-color-scheme: dark`

## วิธีรันบทนี้

```bash
pnpm exec playwright install firefox webkit
```

```bash
pnpm test --config lessons/43-browsers-emulation/playwright.config.ts
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด เมื่อทั้ง 4 project เปิดได้: `8 passed` และ `24 skipped` (ตัวอย่าง 2 ข้อ x 4 project และแบบฝึกหัด 6 test x 4 project)

ถ้า firefox รันไม่ขึ้น ให้รันเฉพาะ project อื่น (เครื่องผู้เขียนรันคำสั่งนี้ใน zsh ผ่าน ส่วน PowerShell 5.1 ไม่ได้ลองรันจริง แต่เครื่องหมาย `'` ครอบ argument ใน PowerShell ส่งค่าตรงตัว และเลี่ยงช่องว่างในชื่อ `Mobile Safari` ด้วยเครื่องหมาย `*`):

```bash
pnpm test --config lessons/43-browsers-emulation/playwright.config.ts '--project=chromium' '--project=webkit' '--project=Mobile*'
```

ผลที่ได้ตอนรัน 3 project นี้: `6 passed` และ `18 skipped`

## แบบฝึกหัดในบทนี้

เปลี่ยน `test.fixme` ในไฟล์ `browsers-emulation.spec.ts` ให้เป็น `test` ตามแนวทางในคอมเมนต์ (ข้อที่ใช้ `test.use` ใส่ใน `describe` ที่เตรียมไว้)

1. ตั้ง `viewport` เป็น 390x844 แล้วตรวจปุ่ม "เปิดเมนู" และ `aria-expanded` ตอนกดปุ่ม
2. ตั้ง `locale: "en-US"` แล้วตรวจว่าวันที่บนหน้าแรกเป็นภาษาอังกฤษ (ด้วย regular expression)
3. ใช้ `timezoneId` สองเขต (Asia/Bangkok และ America/New_York) กับ `page.clock.install` เวลาเดียวกัน ตรวจคำทักทายที่ต่างกัน
4. ตั้ง `geolocation` กับ `permissions` แล้วหาสาขาใกล้ฉันที่หน้า `/stores` ได้สาขาสยาม
5. ใช้ `context.setOffline(true)` ตรวจแถบ "ไม่มีการเชื่อมต่ออินเทอร์เน็ต" แล้วตั้งกลับเป็นออนไลน์แล้วแถบหาย

## อ่านเพิ่ม

- [Emulation](https://playwright.dev/docs/emulation)
- [Browsers](https://playwright.dev/docs/browsers)
- [Projects](https://playwright.dev/docs/test-projects)
