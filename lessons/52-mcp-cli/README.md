# บทที่ 52: ให้ AI เปิด browser สำรวจแอป (Playwright MCP และ playwright cli)

บทนี้เขียนให้อ่านเองได้ ส่วนที่ใช้ AI เขียนสำหรับ **Claude Code** เท่านั้น แต่ทุกขั้นอ่านเข้าใจได้แม้ไม่มี AI และมีทางเลือกที่ไม่ต้องใช้ AI ในหัวข้อ 3 และแบบฝึกหัดทุกข้อ

บทนี้ยังไม่ได้ลองเปิด session ของ AI จริง จึงไม่มีตัวอย่างข้อความที่ AI ตอบกลับ สิ่งที่รันแล้วและยืนยันผลได้คือ `pnpm exec playwright cli` (หัวข้อ 3) และคำสั่ง `claude mcp add` (หัวข้อ 2 ตรวจว่าเขียนไฟล์ `.mcp.json` ตามที่เอกสารบอก) ส่วนผลลัพธ์ที่ AI สำรวจแล้วเขียน test ให้ จะต่างกันในแต่ละครั้งที่ใช้ ให้ถือเกณฑ์ตรวจในหัวข้อ 4 เป็นหลัก

## จบบทนี้แล้วทำอะไรได้

- เพิ่ม Playwright MCP เข้า Claude Code เพื่อให้ AI เปิด browser จริงและอ่านหน้าเว็บได้
- ใช้ `playwright cli` สั่ง browser ทีละคำสั่งจาก terminal (ใช้เองหรือให้ AI ใช้ก็ได้)
- สั่ง AI ให้สำรวจแอปแล้วเขียน test ด้วย prompt ที่ชัดเจน
- ตรวจ test ที่ AI เขียนด้วยเกณฑ์ 4 ข้อ ก่อนเก็บเข้า repo

## เชื่อมกับที่รู้แล้ว

บท 10 (codegen) อัดการกดของคุณเป็นโค้ด บทนี้คล้ายกัน แต่ให้ AI เป็นคนกดและอ่านหน้าจอแทน และ AI อ่านหน้าด้วย **accessibility snapshot** (รายการ role และชื่อของ element ในหน้า) ซึ่งตรงกับที่คุณใช้ `getByRole` มาตลอดตั้งแต่บท 04 ยิ่งหน้ามี role และชื่อที่ดี AI ยิ่งเขียน locator ได้ตรง บท 46 (aria snapshot) ใช้รูปแบบ YAML เดียวกันนี้

## เนื้อหา

### 1. ภาพรวม: MCP กับ CLI ต่างกันอย่างไร

AI เขียน test จากการ "เดา" ได้ แต่จะแม่นกว่ามากถ้ามันเปิดแอปจริงแล้วดูเอง Playwright มีสองทางให้ AI ทำแบบนั้น:

| | Playwright MCP | playwright cli |
|---|---|---|
| คืออะไร | MCP server (โปรแกรมที่ AI เรียกเป็น tool เช่น `browser_click`) | คำสั่งใน terminal เช่น `click`, `snapshot` |
| ใครสั่ง | AI เรียก tool ผ่าน Claude Code | คุณพิมพ์เอง หรือให้ AI พิมพ์ผ่าน Bash |
| ต้องตั้งค่า | ต้องเพิ่ม server เข้า Claude Code (หัวข้อ 2) | ไม่ต้อง ใช้ได้ทันทีเพราะมากับ `@playwright/test` ที่ติดตั้งแล้ว |
| ผลลัพธ์ | ส่ง snapshot กลับให้ AI ตรงๆ | เขียน snapshot เป็นไฟล์ใน `.playwright-cli/` แล้วพิมพ์ path |

(ทั้งสองอย่างอ่านหน้าเป็น snapshot ชนิดเดียวกัน)

### 2. เพิ่ม Playwright MCP เข้า Claude Code

ต้องมี Node.js 20 ขึ้นไป (repo นี้ใช้ 24 อยู่แล้ว) คำสั่งในเอกสารของ Playwright คือ `claude mcp add playwright npx @playwright/mcp@latest` ส่วนเอกสารของ Claude Code แนะนำให้คั่นคำสั่งของ server ด้วย `--` เพื่อไม่ให้ Claude Code เอา flag ของ server ไปตีความเป็นของตัวเอง ใช้รูปนี้:

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

คำสั่งนี้ (ตั้งค่าเริ่มต้นแบบ `local` เห็นเฉพาะคุณในโปรเจกต์นี้) ถ้าอยากให้ไฟล์ตั้งค่าอยู่ใน repo ใช้ `--scope project` ซึ่งจะเขียนไฟล์ `.mcp.json` ที่รากโปรเจกต์ รูปแบบไฟล์ที่ได้:

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {}
    }
  }
}
```

ตรวจและจัดการ server:

```bash
claude mcp list
claude mcp get playwright
claude mcp remove playwright
```

ใน session ของ Claude Code พิมพ์ `/mcp` เพื่อดูสถานะ (connected หรือ failed), เชื่อมต่อใหม่ หรือปิด server ชั่วคราว ถ้าเพิ่งเพิ่ม server ให้เปิด session ใหม่ก่อน

ตัวเลือกที่พบบ่อยของ Playwright MCP (ใส่ต่อท้ายหลัง `@playwright/mcp@latest`):

| ตัวเลือก | ทำอะไร |
|---|---|
| `--headless` | ไม่แสดงหน้าต่าง browser (ค่าเริ่มต้นคือแสดง) |
| `--browser=firefox` | เลือก `chrome`, `firefox`, `webkit` หรือ `msedge` |
| `--isolated` | เริ่ม session ใหม่ทุกครั้ง ไม่ใช้โปรไฟล์ที่จำไว้ |
| `--storage-state path` | โหลด cookie/สถานะ login (ใช้ร่วมกับ `--isolated`) |

ตัวอย่าง: `claude mcp add playwright -- npx @playwright/mcp@latest --headless`

> ความปลอดภัย: Playwright MCP ให้ AI คลิกและกรอกข้อมูลในเว็บที่คุณชี้ให้ อย่าให้มันเปิดเว็บที่คุณไม่ไว้ใจ หรือเว็บที่ login ด้วยบัญชีจริงของคุณ บทนี้ใช้แอป DN Shop ในเครื่อง ซึ่งไม่มีข้อมูลจริง

### 3. ใช้ playwright cli ด้วยตัวเอง (ไม่ต้องมี AI)

เปิดแอป DN Shop ไว้ใน terminal หนึ่งหน้าต่าง (ปล่อยค้างไว้):

```bash
pnpm app
```

แล้วเปิด terminal อีกหน้าต่างหนึ่ง (ในโฟลเดอร์โปรเจกต์) รันทีละบรรทัด:

```bash
pnpm exec playwright cli open http://localhost:3100/products
pnpm exec playwright cli snapshot
```

ผลที่ควรเห็น: หัวข้อ `### Page` บอก URL กับ title (`สินค้าทั้งหมด | DN Shop`) และบรรทัด `Snapshot` บอก path ของไฟล์ใน `.playwright-cli/` เปิดไฟล์นั้นจะเห็นหน้าเป็นรายการ role กับชื่อ แต่ละ element มีรหัสอ้างอิง (ref) เช่น `searchbox "ค้นหาสินค้า" [ref=e13]` และ `button "ค้นหา" [ref=e14]` (ตัวเลข ref อาจต่างจากนี้ ให้ดูจากไฟล์ของคุณ) คำสั่งต่อไปใช้ ref เหล่านี้:

```bash
pnpm exec playwright cli fill e13 "หมอน"
pnpm exec playwright cli press Enter
pnpm exec playwright cli generate-locator e14
pnpm exec playwright cli console
pnpm exec playwright cli close
```

- `fill` กรอกข้อความลงใน element ตาม ref, `press` กดแป้น
- `generate-locator` บอก locator ของ element นั้น ใช้ดูว่า Playwright จะอ้างถึงมันอย่างไร (ผลที่ได้ไม่ใช่ locator ที่ดีที่สุดเสมอไป เช่น ปุ่ม "เพิ่มลงตะกร้า" ของสินค้าหนึ่งอาจได้ `getByRole('listitem').filter({ hasText: '...' }).getByRole('button')` ซึ่งไม่ระบุชื่อปุ่ม ให้ปรับเองให้ชัดขึ้น)
- `console` ดูข้อความใน console ของหน้า (ในแอปนี้จะเห็น error 404 ของ `favicon.ico` ซึ่งไม่เกี่ยวกับ test)
- `close` ปิด browser ที่เปิดไว้ ก่อนเริ่มรอบใหม่ให้ `close` เสมอ ถ้าลืมดูรายการด้วย `pnpm exec playwright cli list`

คำสั่งทั้งหมดดูได้ด้วย `pnpm exec playwright cli --help` โฟลเดอร์ `.playwright-cli/` ที่ถูกสร้างขึ้นอยู่ใน `.gitignore` แล้ว ไม่ต้อง commit

ในเอกสารจะเห็นชื่อ `playwright-cli` (ติดตั้งแยกด้วย `npm install -g @playwright/cli@latest`) เป็นคำสั่งเดียวกัน repo นี้ใช้รูป `pnpm exec playwright cli` เพื่อไม่ต้องติดตั้งเพิ่ม

### 4. สั่ง AI สำรวจ แล้วเขียน test

เมื่อเพิ่ม MCP แล้ว เปิด Claude Code ในโฟลเดอร์โปรเจกต์ (เปิดแอปด้วย `pnpm app` ค้างไว้) แล้วใช้ prompt ใน `prompts.md` (ข้อ A ถึง D) ตัวอย่างโครงของ prompt ที่ดี:

1. บอก URL ที่ให้เปิด และสิ่งที่ให้ลองทำเป็นขั้นๆ
2. ให้มัน **รายงานสิ่งที่เห็นจริง** ก่อนเขียน test (จะได้จับได้ถ้ามันเห็นผิด)
3. ใส่กติกาของโค้ด: `getByRole`, ห้าม `waitForTimeout`, ต้องมี assertion

**เกณฑ์ตรวจ test ที่ AI เขียน 4 ข้อ** (ใช้ทุกครั้งก่อนเก็บ test):

1. หา element ด้วย `getByRole`/`getByLabel` (ไม่ใช่ CSS selector หรือ XPath)
2. ใช้ `expect(locator).toBeXxx()` ที่รอเอง ไม่ใช้ `waitForTimeout`
3. ทุก test จบด้วย assertion ที่ตรวจผลลัพธ์จริง ไม่ใช่แค่กดแล้วจบ
4. test ทำงานคนเดียวได้ รันตัวเดียวหรือสลับลำดับก็ผ่าน (ลองด้วย `--repeat-each=5`)

และ **ต้องรันก่อนเสมอ** เพราะ AI เขียนได้ดูสมเหตุสมผลแต่ผิดได้ ตัวอย่างที่เจอบ่อย: ลืมว่าหน้ามี `role="alert"` ว่างๆ จาก Next.js ทำให้ `getByRole("alert")` เฉยๆ เจอ element สองตัวแล้วล้มด้วย strict mode violation ให้ใช้ `filter({ hasText })` แทน (อธิบายไว้ตั้งแต่บท 07)

บท 54 จะฝึกตรวจ test ที่ AI เขียนละเอียดขึ้น

## จุดที่มักพลาด

- **ไม่ได้เปิดแอปก่อน**: AI หรือ cli เปิด `http://localhost:3100` ไม่ได้ ต้องรัน `pnpm app` ค้างไว้อีกหน้าต่าง
- **เพิ่ม MCP แล้วไม่เห็น tool**: ต้องเปิด session ใหม่ของ Claude Code แล้วดู `/mcp` ว่า playwright เป็น connected
- **ลืม `--` ใน `claude mcp add`**: ถ้า server ต้องการ flag (เช่น `--headless`) Claude Code จะเอาไปตีความเอง
- **เชื่อโค้ดที่ AI เขียนโดยไม่รัน**: ต้องรันทุกครั้ง และรันซ้ำด้วย `--repeat-each=5` ก่อนเก็บ
- **ลืม `close` ของ cli**: browser ที่เปิดค้างอยู่ใช้ทรัพยากรและทำให้รอบใหม่สับสน
- **ให้ AI เปิดเว็บจริงที่ login ไว้**: MCP คลิกแทนคุณได้จริง ใช้กับแอปทดลองเท่านั้น
- **ใช้ locator ที่ cli สร้างให้ตรงๆ**: ตรวจก่อนว่าชัดเจนพอ (ดูหัวข้อ 3)

## หน้าในแอปที่ใช้

- **`/products`**: ช่อง "ค้นหาสินค้า", ปุ่ม "ค้นหา", select "หมวดหมู่" และ "เรียงตาม", ข้อความ "พบสินค้า N รายการ"
- **`/cart`**: ช่อง "โค้ดส่วนลด" + ปุ่ม "ใช้โค้ด", ยอด `subtotal`/`discount`/`total` (data-testid)
- **`/login`**: ใช้เป็นหน้าสำหรับ prompt ข้อ D

## วิธีรันบทนี้

```bash
pnpm test 52-mcp-cli
```

ผลที่ควรได้: `2 passed` และ `3 skipped` (แบบฝึกหัดทั้งสามข้อเป็น `test.fixme` จนกว่าคุณจะเปลี่ยนเป็น `test`)

## แบบฝึกหัดในบทนี้

ทุกข้อทำได้โดยไม่มี AI: ใช้ `pnpm exec playwright cli` ดูหน้าเอง แล้วเขียน test เอง ถ้ามี Claude Code ให้ใช้ prompt ใน `prompts.md` แล้วนำผลมาตรวจด้วยเกณฑ์ 4 ข้อ

1. เรียงสินค้าราคาต่ำไปสูงแล้วสินค้าแรกต้องเป็น "สมุดโน้ตลายจุด" (prompt ข้อ A)
2. ใส่โค้ด DN10 กับเมาส์ไร้สาย (590 บาท) ต้องลด 59 บาท (prompt ข้อ B)
3. ใส่โค้ดส่วนลดผิด ต้องเห็น alert "โค้ดส่วนลดไม่ถูกต้อง" และยอดส่วนลดยังเป็น 0 บาท

(ทำเสร็จแล้วลองรันซ้ำ `pnpm test 52-mcp-cli --repeat-each=5`) เฉลยอยู่ที่ branch `solutions`

## อ่านเพิ่ม

- [Playwright MCP](https://playwright.dev/docs/getting-started-mcp)
- [Playwright CLI](https://playwright.dev/docs/getting-started-cli)
- [Claude Code: เชื่อมต่อ MCP server](https://code.claude.com/docs/en/mcp)
