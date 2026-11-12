# บทที่ 53: Test Agents (planner, generator, healer)

บทนี้เขียนให้อ่านเองได้ ส่วนที่ใช้ agent เขียนสำหรับ **Claude Code** เท่านั้น ส่วนที่เหลือ (อ่านแผน อ่านโค้ดที่ generator เขียน และฝึกแก้ test ตามแบบ healer) ทำได้โดยไม่ต้องมี AI

สิ่งที่รันแล้วและยืนยันผลได้: `pnpm exec playwright init-agents --help` และ `pnpm exec playwright init-agents --loop=claude` (ใน Playwright 1.65 ได้ไฟล์ตามหัวข้อ 2) และ test ทุกไฟล์ในโฟลเดอร์บทนี้ สิ่งที่ยังไม่ได้ลอง: การเปิด session ของ Claude Code เพื่อให้ planner, generator และ healer ทำงานจริง ดังนั้น `example-plan.md` และ `generated.spec.ts` เป็นตัวอย่างที่เขียนมือตามรูปแบบที่เอกสารและไฟล์นิยามของ agent กำหนด ผลจริงของ agent จะต่างออกไป

## จบบทนี้แล้วทำอะไรได้

- สร้างไฟล์ agent ของ Playwright ในโปรเจกต์ด้วย `init-agents` และบอกได้ว่าแต่ละไฟล์คืออะไร
- อธิบายหน้าที่ของ planner, generator และ healer และสิ่งที่แต่ละตัวรับเข้าและส่งออก
- เขียน seed test และอ่านแผนทดสอบ (Markdown) กับ test ที่ generator เขียนได้
- แก้ test ที่ล้มเพราะหน้าเว็บเปลี่ยน แบบที่ healer ทำ และตัดสินได้ว่าเมื่อไรควรแก้ test หรือควรรายงานบั๊ก

## เชื่อมกับที่รู้แล้ว

บท 52 ให้ AI เปิด browser สำรวจหน้า บทนี้จัดขั้นตอนนั้นเป็น "สายงาน" สามขั้นที่ Playwright เตรียมไว้ให้ เหมือนที่คุณเคยทำเองเป็นขั้นๆ: คิดว่าจะทดสอบอะไร (แผน) เขียน test แล้วแก้เมื่อมันพัง บทนี้ใช้ความรู้จากบท 14 (หาสาเหตุที่ test ล้ม), บท 33 และ 34 (`page.route`) และเกณฑ์ตรวจ test 4 ข้อจากบท 52

## เนื้อหา

### 1. Test Agents สามตัว

| agent | ทำอะไร | รับเข้า | ส่งออก |
|---|---|---|---|
| planner | เปิดแอปสำรวจ แล้วเขียนแผนทดสอบ | คำขอของคุณ + seed test (+ เอกสารความต้องการถ้ามี) | ไฟล์แผน Markdown ใน `specs/` |
| generator | เปลี่ยนแผนเป็นไฟล์ test โดยลองทำตามขั้นตอนในหน้าจริงเพื่อตรวจ locator และผลที่คาดหวัง | ไฟล์แผน | ไฟล์ `.spec.ts` |
| healer | รัน test, ถ้าล้มจะดูหน้าปัจจุบัน แก้ test แล้วรันซ้ำ | test ที่ล้ม | test ที่แก้แล้ว หรือ test ที่ถูกข้ามไว้ถ้ามันเห็นว่าฟีเจอร์พังจริง |

(ตามเอกสาร [Test agents](https://playwright.dev/docs/test-agents) ของ Playwright) ข้อสำคัญ: agent ไม่ใช่ของวิเศษ คุณยังต้องตรวจทุกอย่างที่มันเขียน (หัวข้อ 5 และบท 54) โดยเฉพาะ healer ที่ "แก้จนผ่าน" อาจแก้ผิดทิศ เช่นแก้ให้ test ยอมรับบั๊กแทนที่จะรายงานบั๊ก

### 2. ติดตั้ง agent ด้วย `init-agents`

ดู flag ที่มีจริงใน Playwright 1.65 ที่ติดตั้งในโปรเจกต์นี้:

```bash
pnpm exec playwright init-agents --help
```

flag ที่มี: `--loop <loop>` เลือกผู้ให้บริการ agent (`claude`, `codex`, `copilot`, `opencode`, `vscode`, `vscode-legacy`), `--config <file>` และ `--project <project>` เลือก project ที่ใช้สร้าง seed, `--prompts` ใส่ prompt ด้วย บทนี้ใช้ `--loop=claude`:

```bash
pnpm exec playwright init-agents --loop=claude
```

ในโปรเจกต์นี้ได้ผลดังนี้ (ไฟล์ที่ถูกสร้างขึ้น):

| ไฟล์ | คืออะไร |
|---|---|
| `.claude/agents/playwright-test-planner.md` | นิยาม planner สำหรับ Claude Code (คำสั่งและรายชื่อ tool) |
| `.claude/agents/playwright-test-generator.md` | นิยาม generator |
| `.claude/agents/playwright-test-healer.md` | นิยาม healer |
| `.mcp.json` | ตั้งค่า MCP server ชื่อ `playwright-test` รันด้วย `npx playwright run-test-mcp-server` เป็นชุด tool ที่ agent ใช้ (เปิดหน้า รัน test ฯลฯ) |
| `specs/README.md` | โฟลเดอร์สำหรับเก็บแผน (ว่างๆ) |
| `lessons/seed.spec.ts` | seed test เริ่มต้นที่ Playwright สร้างให้ (ว่างๆ) |

หมายเหตุสำคัญของโปรเจกต์นี้:

- ไฟล์เหล่านี้อยู่นอกโฟลเดอร์บท จึง **ไม่ถูก commit**: ชื่อทั้งหมดถูกเพิ่มใน `.gitignore` แล้ว (`.claude/agents/playwright-test-*.md`, `.mcp.json`, `specs/`, `lessons/seed.spec.ts`) อย่าใช้ `git add .` โดยไม่ดู `git status`
- seed ที่ Playwright สร้างไปอยู่ที่ `lessons/seed.spec.ts` เพราะ `testDir` ของ config คือ `lessons` และเป็น test ว่างๆ ถ้ารัน `pnpm test` ทั้งโปรเจกต์มันจะรันด้วย (ผ่านเพราะไม่มีอะไรทำ) เราไม่ใช้ไฟล์นั้น แต่ใช้ seed ของบทนี้ `lessons/53-test-agents/seed.spec.ts` แทน (บอก agent ในคำสั่งเสมอ ดูหัวข้อ 4)
- ให้รันคำสั่งนี้ซ้ำเมื่ออัปเดต Playwright เพื่อได้ agent เวอร์ชันใหม่ (เอกสารของ Playwright แนะนำไว้)
- ไฟล์ `.mcp.json` เป็นไฟล์ตั้งค่า MCP ระดับโปรเจกต์ Claude Code จะถามให้ยืนยันก่อนใช้ ดูสถานะด้วย `claude mcp list` หรือ `/mcp`

### 3. seed test คืออะไร

seed คือ test เล็กๆ ที่พา browser ไปถึง "จุดเริ่มต้นที่ใช้ได้" (เปิดหน้า ตั้งค่า login หรือ fixture ที่ต้องใช้) ทั้ง planner และ generator รัน seed ก่อนเริ่มงานเพื่อให้ได้หน้าที่พร้อม ถ้าแอปของคุณต้อง login หรือเตรียมข้อมูลก่อน ให้ทำใน seed

ไฟล์ `seed.spec.ts` ของบทนี้เปิด `/products` แล้วรอจนเห็นหัวข้อและสินค้าครบ 10 รายการ เพราะ agent ควรเริ่มสำรวจตอนหน้าพร้อมแล้ว ไม่ใช่ตอนที่ยังว่าง

### 4. ใช้ agent ใน Claude Code

หลังรัน `init-agents` ให้เปิดแอปค้างไว้ (`pnpm app` ในอีกหน้าต่าง) แล้วเปิด Claude Code ใหม่ในโฟลเดอร์โปรเจกต์ (เพื่อให้เห็น agent กับ `.mcp.json`) ขอให้ใช้ agent ตามชื่อ ตัวอย่างข้อความ:

```text
ใช้ playwright-test-planner agent สร้างแผนทดสอบสำหรับการค้นหาและกรองสินค้า และตะกร้ากับโค้ดส่วนลด DN10 ของแอปที่ http://localhost:3100
ใช้ lessons/53-test-agents/seed.spec.ts เป็น seed และบันทึกแผนในโฟลเดอร์ specs
```

```text
ใช้ playwright-test-generator agent เขียน test จากแผนข้อ 1.3 ใน specs/ (ชื่อไฟล์แผนตามที่ planner บันทึก)
เก็บไฟล์ใน lessons/53-test-agents
```

```text
ใช้ playwright-test-healer agent รัน test ใน lessons/53-test-agents แล้วแก้เฉพาะ test ที่ล้ม
```

ผลที่ควรได้ (ตามเอกสารและนิยามของ agent): ไฟล์แผนอยู่ใน `specs/` (หัวข้อเลขลำดับ แต่ละข้อมีขั้นตอนและผลที่คาดหวัง และบรรทัด `Seed:`), ไฟล์ test หนึ่งไฟล์ต่อหนึ่งสถานการณ์ และ test ที่ healer แก้แล้วผ่าน ชื่อไฟล์และถ้อยคำจะต่างกันทุกครั้ง

**ดูแผนตัวอย่างและ test ตัวอย่างในบทนี้:**

- `example-plan.md` คือรูปแบบแผนที่ planner เขียน อ่านแล้วเทียบกับสิ่งที่ planner ของคุณสร้าง
- `generated.spec.ts` คือรูปแบบ test ที่ generator เขียนจากแผนนั้น (ตามตัวอย่างใน prompt ของ generator): มี comment `// spec:` กับ `// seed:` ด้านบน, `describe` ตรงกับหัวข้อใหญ่ของแผน, ชื่อ test ตรงกับสถานการณ์, มี comment ของแต่ละขั้นก่อนโค้ด

### 5. ตรวจสิ่งที่ agent สร้างก่อนเก็บ

ใช้เกณฑ์ 4 ข้อจากบท 52 (getByRole, ไม่มี `waitForTimeout`, มี assertion ที่ตรวจผลจริง, ทำงานคนเดียวได้) เพิ่มอีกสามข้อ:

- แผนครอบคลุมสิ่งที่คุณต้องการจริงไหม (agent มักเขียนสถานการณ์เยอะเกินจำเป็น ลบทิ้งได้)
- ผลที่คาดหวังเป็นพฤติกรรมที่ถูกต้องจริง หรือแค่ "สิ่งที่หน้าแสดงตอนนี้" ซึ่งอาจเป็นบั๊ก
- รันซ้ำ `--repeat-each=5` ก่อนเก็บ

### 6. ฝึกแบบ healer

healer ทำสามอย่างซ้ำๆ: อ่านข้อความผิดพลาด, ดูหน้าตอนนี้, แก้ test ให้ตรงหน้า คุณทำได้เองโดยไม่ต้องมี AI ไฟล์ `healer.spec.ts` จำลองว่าทีมพัฒนาเปลี่ยนสินค้า p01 (ชื่อเป็น "หูฟังไร้สาย DN Buds Pro" และราคา 1,490 บาท) โดยดักคำตอบของ `/api/products` ด้วย `page.route` ไม่ได้แก้แอปจริง `route.fetch()` ขอข้อมูลจริงมาก่อนแล้วเราแก้ข้อมูลของ p01 แล้วส่งให้หน้าเว็บ

หลักของ healer ที่ดี:

1. **แก้น้อยที่สุด**: แก้เฉพาะค่าที่เปลี่ยน ไม่เขียน test ใหม่ทั้งหมด
2. **แก้ตามความตั้งใจ**: ถ้าการเปลี่ยนเป็นของตั้งใจ (เปลี่ยนชื่อ ราคา) แก้ test ถ้าเป็นบั๊ก (ราคากลายเป็นติดลบ) อย่าแก้ ปล่อยให้ล้มแล้วแจ้งทีม healer เองก็จะข้ามเทสต์ (`test.fixme`) ถ้ามันเห็นว่าฟีเจอร์พัง
3. **ไม่แก้ให้ผ่านด้วยการทำให้ test อ่อนลง**: เช่นเปลี่ยน `toHaveText("1,490 บาท")` เป็น `toBeVisible()` เฉยๆ
4. รันซ้ำหลังแก้เสมอ

## จุดที่มักพลาด

- **ไม่ได้บอก seed**: agent ใช้ `lessons/seed.spec.ts` ที่ว่างเปล่าแทน ทำให้แผนไม่รู้จุดเริ่มต้น ให้ระบุ `lessons/53-test-agents/seed.spec.ts` ในคำสั่ง
- **commit ไฟล์ที่ init-agents สร้าง**: ไม่ควร (อยู่ใน `.gitignore` แล้ว) ถ้าไฟล์ไม่ถูกซ่อน ตรวจ `.gitignore`
- **เปิด Claude Code ก่อนรัน `init-agents`**: ต้องเปิด session ใหม่หลังสร้างไฟล์ ไม่งั้นไม่เห็น agent และ MCP server
- **เชื่อแผนหรือ test ที่ได้โดยไม่รัน**: รันและตรวจเสมอ
- **ให้ healer แก้จนผ่านทุกข้อ**: test ที่ล้มเพราะบั๊กจริงต้องไม่ถูก "รักษา"
- **แก้ `mockRenamedHeadphones` ในแบบฝึกหัด healer**: ฟังก์ชันนี้คือ "การเปลี่ยนของแอป" ให้แก้เฉพาะ test
- **ชื่อสินค้าใหม่มีชื่อเดิมเป็นส่วนหนึ่ง**: `getByRole("link", { name })` แบบไม่ใส่ `exact: true` ยังเจอชื่อใหม่ จึงไม่ล้ม ระวัง test ที่ผ่านด้วยเหตุผลผิด

## หน้าในแอปที่ใช้

- **`/products`**: ช่อง "ค้นหาสินค้า", ปุ่ม "ค้นหา", select "หมวดหมู่", ข้อความ "พบสินค้า N รายการ", ข้อความ "ไม่พบสินค้าที่ค้นหา" เมื่อไม่เจอ, ปุ่ม "เพิ่มลงตะกร้า" ในแต่ละสินค้า
- **`/cart`**: ช่อง "โค้ดส่วนลด" + ปุ่ม "ใช้โค้ด", `data-testid` subtotal/discount/total

## วิธีรันบทนี้

```bash
pnpm test 53-test-agents
```

ผลที่ควรได้: `4 passed` และ `6 skipped` (แบบฝึกหัด 3 ข้อใน `generated.spec.ts` และ 3 ข้อใน `healer.spec.ts` เป็น `test.fixme`)

(ถ้าลองใช้ `--loop=claude` จริง ให้ตรวจด้วย `git status` ว่าไม่มีไฟล์ที่ init-agents สร้างโผล่ในรายการ)

## แบบฝึกหัดในบทนี้

1. `generated.spec.ts` ข้อ 1: เขียน test ของแผนข้อ 1.3 (กรองหมวดเสื้อผ้า) ในรูปแบบเดียวกับ generator (ทำเองหรือให้ generator เขียนแล้วตรวจก็ได้)
2. `generated.spec.ts` ข้อ 2: เขียน test ของแผนข้อ 2.1 (เพิ่มสินค้าลงตะกร้า)
3. `generated.spec.ts` ข้อ 3: เขียน test ของแผนข้อ 2.2 (ใช้โค้ด DN10 ต้องเพิ่มของลงตะกร้าใน test ของตัวเอง)
4. `healer.spec.ts` ข้อ 1: ลิงก์ชื่อเก่าหาไม่เจอ แก้ locator ให้ตรงชื่อใหม่
5. `healer.spec.ts` ข้อ 2: ราคาเปลี่ยน แก้ค่าที่คาดหวัง
6. `healer.spec.ts` ข้อ 3: ข้อความสถานะหลังเพิ่มลงตะกร้ามีชื่อใหม่ แก้ข้อความที่รอ

เฉลยอยู่ที่ branch `solutions`

## อ่านเพิ่ม

- [Test agents (planner, generator, healer)](https://playwright.dev/docs/test-agents)
- [Playwright MCP](https://playwright.dev/docs/getting-started-mcp)
- [Claude Code: เชื่อมต่อ MCP server](https://code.claude.com/docs/en/mcp)
