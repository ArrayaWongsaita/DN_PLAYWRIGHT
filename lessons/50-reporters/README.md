# บทที่ 50: reporter (list, line, dot, html, json, junit)

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน บทนี้มี config ของตัวเอง

## จบบทนี้แล้วทำอะไรได้

- บอกได้ว่า reporter แต่ละตัว (`list`, `line`, `dot`, `html`, `json`, `junit`) หน้าตาเป็นอย่างไรและเหมาะกับงานอะไร
- ตั้ง reporter หลายตัวพร้อมกันใน config พร้อมตัวเลือก `outputFolder` / `outputFile`
- เลือกชุด reporter ต่างกันระหว่างบนเครื่องเรากับบน CI ด้วย `process.env.CI`
- เปิดรายงาน html และอ่านไฟล์ json/junit ที่ได้ได้

## เชื่อมกับที่รู้แล้ว

Jest มี reporter เหมือนกัน (`--reporters`, `jest-junit`) และคุณน่าจะเคยเห็นผลแบบ `PASS`/`FAIL` ทีละไฟล์ Playwright มี reporter ในตัวให้เลือกหลายแบบ และใช้ได้พร้อมกัน เช่นแสดงผลสั้นๆ บนหน้าจอ แล้วเขียนไฟล์ XML ให้เครื่องมือ CI อ่านไปด้วย

## เนื้อหา

### 1. reporter มีกี่แบบ

reporter ที่ใช้ในบทนี้ (มีในตัวทั้งหมด):

| reporter | แสดงอะไร | เหมาะกับ |
|---|---|---|
| `list` | บรรทัดเดียวต่อ test พร้อมเครื่องหมายผ่าน/ล้ม และเวลา | บนเครื่องเรา (ค่าเริ่มต้นเมื่อไม่ได้อยู่บน CI) |
| `line` | แสดง test ที่กำลังรันอยู่บรรทัดเดียวแล้วเขียนทับ ล้มค่อยขึ้นรายละเอียด | มี test เยอะ ไม่อยากให้จอเลื่อน |
| `dot` | จุดหนึ่งตัวต่อหนึ่ง test | log บน CI ที่ต้องการให้สั้นที่สุด |
| `html` | รายงานเว็บ เปิดดูละเอียด มี step, screenshot, trace | อ่านผลอย่างละเอียด |
| `json` | ไฟล์ JSON ของผลทั้งหมด | ให้สคริปต์หรือเครื่องมืออื่นอ่านต่อ |
| `junit` | ไฟล์ XML รูปแบบ JUnit | CI หลายตัวอ่านรูปแบบนี้ได้ (แสดงผล test ในหน้า CI) |

เราลองรันบทนี้ด้วยแต่ละตัวแล้ว ผลที่เห็นจริง:

- `dot`: บรรทัดเดียว `°°°··` โดย `·` คือ test ที่ผ่าน และ `°` คือ test ที่ถูกข้าม (skipped) ตามด้วยสรุป
- `line`: ขึ้น `[1/5] [chromium] › ...` ทีละ test ตามด้วยสรุป
- `list`: `✓` ผ่าน และ `-` ข้าม ทีละบรรทัดพร้อมเวลา

### 2. ตั้ง reporter ใน config

```ts
reporter: [
  ["list"],
  ["html", { outputFolder: path.join(outputDir, "html"), open: "never" }],
],
```

- `reporter` เป็น array ของ `[ชื่อ, ตัวเลือก]` ใส่ได้หลายตัว ทุกตัวทำงานพร้อมกัน
- `html` ใช้ `outputFolder` กำหนดโฟลเดอร์ผลลัพธ์ และ `open: "never"` ไม่ให้เปิดเบราว์เซอร์เองหลังรันเสร็จ (ค่าเริ่มต้นคือเปิดเองเมื่อมี test ล้ม ซึ่งไม่เหมาะกับ CI)
- `json` และ `junit` ใช้ `outputFile` กำหนดไฟล์ผลลัพธ์
- บทนี้เก็บผลทั้งหมดไว้ใต้ `lessons/50-reporters/output/` และตั้ง `outputDir` (โฟลเดอร์ของ screenshot/trace รายต่อ test) ให้อยู่ใต้ output ด้วย โฟลเดอร์นี้ถูก ignore ใน `.gitignore` แล้ว

### 3. เลือกตาม process.env.CI

```ts
const isCI = !!process.env.CI;
reporter: isCI ? [["dot"], ["html", ...], ["json", ...], ["junit", ...]] : [["list"], ["html", ...]],
```

`process.env.CI` มีค่าเมื่อรันบน CI (GitHub Actions ตั้งให้เอง) และไม่มีบนเครื่องเรา ผลที่เห็นจริงจากการรันด้วย `CI=1`:

- บนเครื่อง (ไม่ตั้ง CI): ได้ `output/html/` เท่านั้น
- ตั้ง CI: หน้าจอเป็น `dot` และได้ `output/html/index.html`, `output/results.json`, `output/junit.xml` ครบ

ถ้าอยากลองบนเครื่องตัวเอง ตั้งตัวแปร `CI` แล้วรัน (ทำทีละบรรทัด):

macOS / Linux:

```bash
export CI=1
pnpm test --config lessons/50-reporters/playwright.config.ts
unset CI
```

Windows (PowerShell):

```powershell
$env:CI = "1"
pnpm test --config lessons/50-reporters/playwright.config.ts
Remove-Item Env:CI
```

(ผู้เขียนทดสอบวิธีตั้งตัวแปรบน macOS ส่วนบน PowerShell เป็นรูปแบบมาตรฐาน ผู้เขียนไม่ได้ทดสอบบน Windows) อย่าลืมคำสั่งบรรทัดสุดท้ายที่ลบตัวแปรออก ไม่งั้นการรันบทอื่นในหน้าต่างเดิมจะอยู่ในโหมด CI ด้วย (เช่น `reuseExistingServer` ของ webServer ถูกปิด)

### 4. เปลี่ยน reporter จากบรรทัดคำสั่ง

`--reporter=line` ทับ reporter ที่ตั้งใน config **ทั้งหมด** (ไม่ได้เพิ่มจากของเดิม) ลองเทียบ:

```bash
pnpm test --config lessons/50-reporters/playwright.config.ts --reporter=line
pnpm test --config lessons/50-reporters/playwright.config.ts --reporter=dot
```

เมื่อใช้ `--reporter` ตัวเลือกของ reporter ใน config (เช่น `outputFolder`) จะไม่มีผลด้วย เพราะ config ถูกทับ reporter ที่ไม่มีตัวเลือกเขียนไฟล์ตามค่าเริ่มต้น (html ไปที่ `playwright-report/`) และ `--reporter=json` ที่ไม่มี `outputFile` พิมพ์ JSON ลงหน้าจอ (ผู้เขียนลองแล้ว) จึงควรกำหนดตัวเลือกใน config เสมอ

### 5. เปิดรายงาน html

รันแล้วสั่งเปิดด้วย `show-report` โดยบอกโฟลเดอร์ที่เราตั้งไว้:

```bash
pnpm exec playwright show-report lessons/50-reporters/output/html
```

คำสั่งนี้เปิดเว็บเซิร์ฟเวอร์เล็กๆ (ค่าเริ่มต้นพอร์ต 9323) แล้วค้างอยู่ กด Ctrl+C เพื่อหยุด ในรายงานจะเห็นรายชื่อ test กรองตามสถานะได้ ถ้า test ล้มคลิกเข้าไปดู error, screenshot และ trace ได้ (ตามเอกสารของ Playwright) บทนี้ไม่มี test ที่ล้ม ผู้เขียนตรวจว่าไฟล์ `index.html` ถูกสร้างจริง แต่ไม่ได้เปิดดูในเบราว์เซอร์

ถ้าไม่ระบุโฟลเดอร์ `pnpm report` ของ repo (คือ `playwright show-report`) จะเปิดโฟลเดอร์ `playwright-report/` ของ config หลัก ไม่ใช่ของบทนี้

### 6. อ่านไฟล์ json และ junit

หลังรันด้วย `CI=1` ที่ `output/`:

- `results.json`: มี key ระดับบน `config`, `suites`, `errors`, `stats` โดย `stats` สรุปผล (ที่เราเห็นจริง: `expected: 2, skipped: 3, unexpected: 0, flaky: 0`) ส่วน `suites` มีผลละเอียดทุก test รวมถึง step ที่ตั้งด้วย `test.step` (ผู้เขียนตรวจว่ามีชื่อ step "เปิดหน้าสินค้า" ฯลฯ ในไฟล์)
- `junit.xml`: เริ่มด้วย `<testsuites ... tests="5" failures="0" skipped="3" ...>` แล้วตามด้วย `<testcase name="..." classname="reporters.spec.ts" ...>` ของแต่ละ test เครื่องมือ CI ส่วนใหญ่อ่านรูปแบบนี้เพื่อแสดงรายการ test ในหน้าผลของ build

คำเตือน: reporter `json` และ `junit` บน config นี้เปิดเฉพาะตอนมี `CI` เท่านั้น ถ้าไม่เห็นไฟล์ ให้ตรวจก่อนว่าตั้งตัวแปรแล้ว

## จุดที่มักพลาด

- **คิดว่า `--reporter` เพิ่ม reporter**: มันแทนที่ของใน config ทั้งหมด ตัวเลือก `outputFolder` / `outputFile` จึงหายไปด้วย
- **ลืม `open: "never"` ของ html**: บน CI หรือเมื่อมี test ล้ม reporter อาจพยายามเปิดเบราว์เซอร์
- **เขียนผลลงโฟลเดอร์ที่ถูก commit**: บทนี้ใช้ `output/` ที่ ignore ไว้แล้ว ถ้าเปลี่ยนโฟลเดอร์ต้องเพิ่มใน `.gitignore` ด้วย
- **ตั้ง `CI` แล้วลืมลบ**: การรันครั้งต่อไปในหน้าต่างเดิมยังอยู่ในโหมด CI
- **คาดว่า `outputFolder` ของ html ล้างให้ทุกครั้งโดยไม่เป็นปัญหา**: รายงานใหม่ทับของเดิม ถ้าต้องการเก็บหลายรอบให้ตั้งโฟลเดอร์ต่างกัน
- **ใช้ `dot` ตอนอยากรู้ว่า test ไหนช้า**: `dot` ไม่แสดงชื่อ test ใช้ `list` ดีกว่า

## หน้าในแอปที่ใช้

**`/`** h1 "DN Shop"
**`/products`** ปุ่ม "เพิ่มลงตะกร้า" แล้วขึ้น status `เพิ่ม "{ชื่อสินค้า}" ลงตะกร้าแล้ว` และตัวเลขใน `data-testid="cart-count"` เพิ่มเป็น 1
**`/stores`** h1 "สาขาของเรา"
**`/help/ordering`** h1 "คู่มือการสั่งซื้อ"

## วิธีรันบทนี้

```bash
pnpm test --config lessons/50-reporters/playwright.config.ts
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `3 skipped` (บนเครื่องใช้ `list` และได้ `lessons/50-reporters/output/html/index.html`)

## แบบฝึกหัดในบทนี้

เปลี่ยน `test.fixme` ในไฟล์ `reporters.spec.ts` ให้เป็น `test` แล้วเขียนตามแนวทางในคอมเมนต์ จากนั้นลองรันกับ reporter หลายแบบ (`--reporter=line`, `--reporter=dot`) และตั้ง `CI` ดูไฟล์ json/junit

1. test ที่แบ่งเป็นสอง `test.step` (เปิดหน้าสาขา / ตรวจหัวข้อ)
2. test ที่ติด tag `@smoke` แล้วรันเฉพาะ tag ด้วย `--grep @smoke --reporter=line`
3. แนบข้อความหัวเว็บเข้ารายงานด้วย `testInfo.attach`

## อ่านเพิ่ม

- [Reporters](https://playwright.dev/docs/test-reporters)
- [Test annotations (tag)](https://playwright.dev/docs/test-annotations)
