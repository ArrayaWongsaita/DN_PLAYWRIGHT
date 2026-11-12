# DN_PLAYWRIGHT — เรียนเขียน test เว็บด้วย Playwright

คอร์สนี้สอนเขียน end-to-end test ด้วย Playwright Test ตั้งแต่ test ข้อแรกจนถึงการใช้งานจริงและการใช้ AI ช่วยเขียน test มี **55 บท 13 ช่วง** เรียงจากง่ายไปยาก ทุกบทมี README อธิบายเนื้อหา ไฟล์ `.spec.ts` ที่มีตัวอย่างและแบบฝึกหัด และทุกบททดสอบเว็บเดียวกันคือ **DN Shop** ร้านค้าออนไลน์ตัวอย่างที่อยู่ใน repo นี้ รันได้บนเครื่องของคุณ ไม่ต้องต่ออินเทอร์เน็ตหรือฐานข้อมูล

เหมาะกับคนที่รู้ TypeScript และเคยเขียน test ด้วย Jest/Supertest หรือ Vitest มาแล้ว (ต่อจาก [DN_JEST_SUPERTEST](https://github.com/ArrayaWongsaita/DN_JEST_SUPERTEST))

บท 01–15 มีเครื่องหมาย 🏫 คือบทที่สอนในห้อง ส่วนบท 16 เป็นต้นไปให้เรียนต่อเองจาก README ของแต่ละบท

## ก่อนเริ่ม

- **Node.js 24 ขึ้นไป** (ตรวจด้วย `node -v`)
- **pnpm 12** (ตัวจัดการแพ็กเกจของ repo นี้) ติดตั้งหรืออัปเกรดด้วยคำสั่งเดียวกันทั้ง macOS และ Windows:

  ```bash
  npm install -g pnpm@12
  ```

  แล้วตรวจด้วย `pnpm -v` ต้องขึ้นเลข 12.x
- **VS Code + ส่วนขยาย [Playwright Test for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)** (แนะนำ ใช้รัน test จากในโปรแกรมและเลือก locator ได้ ไม่ติดตั้งก็เรียนได้)
- Git

## ติดตั้ง

พิมพ์ทีละบรรทัด (ใช้ได้ทั้ง macOS terminal และ Windows PowerShell):

```bash
git clone https://github.com/ArrayaWongsaita/DN_PLAYWRIGHT.git
cd DN_PLAYWRIGHT
pnpm install
pnpm exec playwright install chromium
```

บรรทัดสุดท้ายดาวน์โหลด browser Chromium ที่ Playwright ใช้รัน test ต้องทำครั้งเดียวต่อเครื่อง (ตอนเริ่มลงแค่ Chromium บท 43 ค่อยบอกให้ลง Firefox และ WebKit)

### รันครั้งแรกต้องรอ build

`pnpm test` จะเปิดแอป DN Shop ขึ้นมาให้เอง ถ้าเป็นการรันครั้งแรกแอปต้อง build ก่อน **ใช้เวลาประมาณ 1 นาที** ระหว่างนั้นจะมีข้อความของ Next.js เยอะๆ และ test ยังไม่เริ่ม ไม่ใช่อาการผิดปกติ ให้รอ ครั้งต่อไปจะเริ่มทันที เพราะ build เก็บไว้ในเครื่องแล้ว และจะ build ใหม่เองก็ต่อเมื่อโค้ดในโฟลเดอร์ `src/` เปลี่ยน (เช่นหลัง `git pull`)

อยากเปิดเว็บดูเอง: รัน `pnpm app` แล้วเปิด http://localhost:3100 (กด `Ctrl+C` เพื่อหยุด)

### ผู้ใช้ตัวอย่างในแอป

| บทบาท | อีเมล | รหัสผ่าน |
|---|---|---|
| ผู้ใช้ทั่วไป | `user@dnshop.test` | `password123` |
| ผู้ดูแลระบบ (admin) | `admin@dnshop.test` | `admin123` |

ข้อมูลทั้งหมดของแอปเก็บในหน่วยความจำ และแยกตาม browser context ของแต่ละ test จึงรัน test พร้อมกันได้โดยข้อมูลไม่ชนกัน ปิดแอปแล้วข้อมูลหายหมด

โฟลเดอร์ `internal/` เป็นของผู้สอน (test ที่ใช้ตรวจแอปเอง) ผู้เรียนไม่ต้องสนใจ

## วิธีทำแบบฝึกหัด

1. เปิดโฟลเดอร์ของบท เช่น `lessons/01-first-test/` อ่าน `README.md` ของบทก่อน
2. เปิดไฟล์ `.spec.ts` ดู **ตัวอย่าง** ที่เขียนไว้แล้ว (ผ่านอยู่แล้ว)
3. ไปที่แบบฝึกหัดข้อ 1 อ่านโจทย์และ "แนวทาง"
4. เปลี่ยน `test.fixme(` เป็น `test(` แล้วเขียนโค้ดตรงบรรทัดที่มี 👉
5. รัน test ของบทนั้น ทำให้ผ่าน แล้วไปข้อถัดไป

ข้อที่ยังเป็น `test.fixme` ถือว่า "ยังไม่ได้ทำ" Playwright จะข้ามไป (skipped) ไม่ขึ้นสีแดง

## วิธีรัน

คำสั่งทั้งหมดรันที่โฟลเดอร์ `DN_PLAYWRIGHT`

| ต้องการ | คำสั่ง |
|---|---|
| รันทุกบท | `pnpm test` |
| รันเฉพาะบท | `pnpm test 01-first-test` |
| รันเฉพาะไฟล์ | `pnpm test first-test.spec.ts` |
| รันเฉพาะข้อที่ชื่อมีคำนี้ | `pnpm test 01-first-test -g "ชื่อ"` |
| ดู browser ทำงานจริง | `pnpm test 01-first-test --headed` |
| UI mode (ดูทีละขั้นพร้อมภาพหน้าจอ) | `pnpm test:ui` |
| เปิด HTML report ของรอบล่าสุด | `pnpm report` |
| รันเฉพาะข้อที่พังรอบก่อน | `pnpm test --last-failed` |
| ตรวจโค้ด (ESLint) | `pnpm lint` |
| อัดการใช้งานเว็บเป็นโค้ด (บท 10) | `pnpm codegen` |

รายละเอียดอยู่ในบท 02

หมายเหตุ: ใน Windows PowerShell บางเวอร์ชันภาษาไทยที่พิมพ์ในคำสั่งอาจแสดงเพี้ยน ถ้า `-g` ไม่เจอ test ให้ใช้คำภาษาอังกฤษที่อยู่ในชื่อ test (เช่น `/cart`) หรือรันด้วยชื่อโฟลเดอร์/ไฟล์แทน

## วิธีอ่านผล

```text
Running 7 tests using 6 workers
  -  1 [chromium] › ... › ข้อที่ยังเป็น test.fixme
  ✓  6 [chromium] › ... › ข้อที่ผ่าน (411ms)
  5 skipped
  2 passed (2.0s)
```

- `✓` / **passed** = test ผ่าน
- `-` / **skipped** = ข้อที่ยังเป็น `test.fixme` (ยังไม่ได้ทำ) ไม่ได้แปลว่าผ่าน อย่ารีบดีใจเมื่อเห็นสีเขียวแต่ยังมี skipped เหลือ
- `✘` / **failed** = test ไม่ผ่าน ให้เลื่อนดูรายละเอียดด้านล่าง:
  - `Expected` คือค่าที่คุณคาดหวัง `Received` คือค่าที่เจอจริง
  - `Call log` บอกว่า Playwright รออะไรอยู่ ลองมาแล้วกี่ครั้ง
  - ลูกศร `>` ชี้บรรทัดในโค้ดที่พัง
- เมื่อ test พัง Playwright เก็บภาพหน้าจอไว้ให้ เปิด `pnpm report` เพื่อดูภาพและรายละเอียด

## สารบัญ

### ช่วงที่ 1: เริ่มต้น 🏫

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 01 🏫 | `01-first-test` | โครง test, `{ page }` คืออะไร, `page.goto`, `toHaveTitle`, `pnpm test`, ต่างจาก Jest/Vitest ยังไง |
| 02 🏫 | `02-running-tests` | รันบางไฟล์/บางข้อ, `--headed`, UI mode, HTML report, `--last-failed` |
| 03 🏫 | `03-await` | ทำไมต้อง `await`, อาการตอนลืม, ESLint `no-floating-promises` |
| 04 🏫 | `04-get-by-role` | `getByRole` + `name`, `toBeVisible` |
| 05 🏫 | `05-other-locators` | `getByText`, `getByLabel`, `getByPlaceholder`, `getByAltText`, `getByTitle`, `getByTestId` (และเมื่อไหร่ควรใช้), `toHaveText`, `toContainText` |

### ช่วงที่ 2: ลงมือกับหน้าเว็บ 🏫

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 06 🏫 | `06-click-hover` | `click`, `dblclick`, `hover` |
| 07 🏫 | `07-typing` | `fill`, `clear`, `press`, `pressSequentially` |
| 08 🏫 | `08-form-controls` | checkbox (`check`/`uncheck`), radio, `selectOption` |
| 09 🏫 | `09-navigation` | กดลิงก์ไปหน้าอื่น, `toHaveURL`, `goBack`, `goForward`, `reload` |
| 10 🏫 | `10-codegen` | `playwright codegen`, เลือก locator, เกลาโค้ดที่อัดได้ |

### ช่วงที่ 3: Assertion และการ debug 🏫

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 11 🏫 | `11-state-assertions` | `toBeEnabled`/`toBeDisabled`, `toBeChecked`, `toBeEditable`, `toBeFocused`, `toBeHidden`, `toBeEmpty` |
| 12 🏫 | `12-value-assertions` | `toHaveValue`, `toHaveAttribute`, `toHaveClass`, `toHaveCount`, `.not` |
| 13 🏫 | `13-web-first-assertions` | assertion ที่รอและลองใหม่เองได้ ต่างจาก `toBe` ยังไง, ทำไมห้ามใช้ `expect(await x.isVisible())`, timeout ของ expect |
| 14 🏫 | `14-trace-viewer` | เปิด trace ของ test ที่พัง, ไล่ดูทีละ action, ดู DOM snapshot/network/console |
| 15 🏫 | `15-debugging` | `--debug`, `page.pause()`, VS Code extension (breakpoint, pick locator) |

### ช่วงที่ 4: Locator ขั้นกลาง

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 16 | `16-chaining-filter` | ต่อ locator (chaining), `filter({ hasText, has, hasNot, hasNotText })` |
| 17 | `17-lists` | `nth`, `first`, `last`, `count`, `all()`, `toHaveCount`, `toHaveText([...])` |
| 18 | `18-css-xpath` | `locator("css")`, XPath, `and`/`or` และเหตุผลที่ควรเลี่ยง |

### ช่วงที่ 5: จัดระเบียบ test

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 19 | `19-describe-hooks` | `test.describe`, `beforeEach`/`afterEach`/`beforeAll`/`afterAll` (ทวน Jest บท 10–11) |
| 20 | `20-isolation` | test แต่ละข้อได้ browser context ใหม่, ทำไมข้อมูลไม่ข้ามไปมา, ระวัง `beforeAll` |
| 21 | `21-annotations-tags` | `skip`, `only`, `fixme`, `fail`, `slow`, tag, `--grep` |
| 22 | `22-steps-parameterize` | `test.step`, วนสร้าง test จากข้อมูลหลายชุด |
| 23 | `23-config` | อ่านและแก้ `playwright.config.ts`: `baseURL`, `use`, `timeout`, `retries`, `webServer`, `testDir`, ทำความรู้จัก `projects` เบื้องต้น |

### ช่วงที่ 6: สถานการณ์พิเศษบนหน้าเว็บ

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 24 | `24-auto-waiting` | auto-waiting, actionability, `waitForURL`, เลี่ยง `waitForTimeout` |
| 25 | `25-dialogs` | `page.on("dialog")`, alert / confirm / prompt |
| 26 | `26-new-tab-popup` | `context.waitForEvent("page")`, `page.waitForEvent("popup")` |
| 27 | `27-upload-download` | `setInputFiles` (ไฟล์เดียว/หลายไฟล์), `waitForEvent("download")` |
| 28 | `28-mouse-keyboard-drag` | `dragTo`, `keyboard.press` (รวม `ControlOrMeta`), `mouse` |
| 29 | `29-iframes` | `frameLocator`, `contentFrame` |
| 30 | `30-locator-handler` | `page.addLocatorHandler` ปิดป๊อปอัปที่โผล่ไม่แน่นอน |
| 31 | `31-clock` | `page.clock` (`install`, `fastForward`, `setFixedTime`, `pauseAt`) |
| 32 | `32-evaluate-console` | `page.evaluate`, `page.on("console")`, `page.on("pageerror")` |

### ช่วงที่ 7: Network และ API

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 33 | `33-mock-api` | `page.route` + `route.fulfill` จำลองข้อมูลว่าง, error 500, ข้อมูลพิเศษ |
| 34 | `34-modify-wait-response` | `route.fetch` แล้วแก้ response, `route.abort`, `waitForResponse`, `waitForRequest` |
| 35 | `35-har` | บันทึก HAR, `routeFromHAR` เล่นซ้ำ |
| 36 | `36-api-testing` | fixture `request`: `get`/`post`/`delete`, ตรวจ status/body (เทียบกับ Supertest) |
| 37 | `37-api-ui-setup` | เตรียมข้อมูลผ่าน API แล้วไปตรวจบนหน้าเว็บ, `page.request` ใช้ cookie ร่วมกับหน้าเว็บ |

### ช่วงที่ 8: โค้ดที่ใช้ซ้ำได้

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 38 | `38-page-object` | Page Object Model แบบ class |
| 39 | `39-custom-fixtures` | `test.extend`, fixture ที่ setup/teardown ให้ |
| 40 | `40-pom-fixtures` | ส่ง Page Object ผ่าน fixture, รู้จัก worker fixture เบื้องต้น |

### ช่วงที่ 9: Login และหลาย browser

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 41 | `41-auth-storage-state` | setup project, `storageState`, `dependencies` |
| 42 | `42-multiple-roles` | ผู้ใช้ทั่วไปกับ admin, สอง context ใน test เดียว |
| 43 | `43-browsers-emulation` | projects Chromium/Firefox/WebKit, `devices` (มือถือ), `viewport`, `locale`, `timezoneId`, `colorScheme`, `geolocation`, `permissions`, offline |

### ช่วงที่ 10: Visual และ Accessibility

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 44 | `44-screenshots-video` | `page.screenshot`, `locator.screenshot`, config `screenshot`/`video`/`trace` |
| 45 | `45-visual-comparison` | `toHaveScreenshot`, `--update-snapshots`, `mask`, threshold, ทำไมภาพแต่ละ OS ต่างกัน |
| 46 | `46-aria-snapshot` | `toMatchAriaSnapshot` |
| 47 | `47-accessibility` | `toHaveRole`, `toHaveAccessibleName`, `toHaveAccessibleDescription`, `@axe-core/playwright` |

### ช่วงที่ 11: ใช้งานจริง

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 48 | `48-parallel-retries` | `workers`, `fullyParallel`, `test.describe.configure({ mode })`, `retries`, test ที่ผลไม่คงที่ (flaky), `--repeat-each`, `--fail-on-flaky-tests` |
| 49 | `49-global-setup-env` | global setup/teardown, ตัวแปร env (`process.env`, `.env`) |
| 50 | `50-reporters` | list/line/dot/html/json/junit, ใช้หลาย reporter พร้อมกัน, เลือกตาม CI |
| 51 | `51-ci-github-actions` | workflow GitHub Actions, ลงเฉพาะ browser ที่ใช้, เก็บ report เป็น artifact, sharding |

### ช่วงที่ 12: ใช้ AI ช่วยเขียน test

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 52 | `52-mcp-cli` | Playwright MCP และ `playwright-cli` ให้ AI เปิด browser สำรวจแอป |
| 53 | `53-test-agents` | `playwright init-agents --loop=...`, planner → generator → healer, seed test |
| 54 | `54-review-ai-tests` | อ่านและแก้ test ที่ AI เขียนให้ถูกตาม best practices, `eslint-plugin-playwright` |

### ช่วงที่ 13: โปรเจกต์ปิดท้าย

| บท | โฟลเดอร์ | ฝึก |
|---|---|---|
| 55 | `55-capstone` | เขียน test ทั้งเส้นทาง login → ค้นหา → ตะกร้า → ชำระเงิน → ใบเสร็จ ใช้ Page Object + fixture + API setup + storageState |

## เฉลย

ลองทำเองก่อน แล้วค่อยเปิดดูเฉลยบนเว็บ (ไม่ต้อง checkout branch): https://github.com/ArrayaWongsaita/DN_PLAYWRIGHT/tree/solutions/lessons

เฉลยมีคอมเมนต์อธิบาย "ทำไม" ว่าทำไมเลือก locator หรือ assertion ตัวนั้น

## เมื่อเรียนจบในห้องแล้ว

บท 01–15 (🏫) สอนในห้อง ที่เหลือเรียนต่อเองได้ตั้งแต่บท 16:

1. เปิด `README.md` ของบทและอ่านให้จบก่อนเริ่มเขียน บทที่ 16 เป็นต้นไปอธิบายละเอียดกว่าบทในห้อง ทำตามได้โดยไม่ต้องมีผู้สอน
2. ทำแบบฝึกหัดตามลำดับ ข้อแรกของแต่ละบทใกล้เคียงกับตัวอย่าง ข้อหลังๆ ยากขึ้นเรื่อยๆ
3. ติดข้อไหนให้ลองรันด้วย `pnpm test:ui` หรืออ่าน error ใน `pnpm report` ก่อน แล้วค่อยเปิดเฉลย
4. ช่วงที่ 12 (บท 52–54) ใช้ AI ช่วยเขียน test เรียนเมื่อผ่านช่วงก่อนหน้ามาแล้ว จะได้ตรวจ test ที่ AI เขียนได้ และบท 55 เป็นโปรเจกต์ปิดท้ายรวมทุกเรื่อง
