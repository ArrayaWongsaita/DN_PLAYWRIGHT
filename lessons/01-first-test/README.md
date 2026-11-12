# บทที่ 01: test แรกของคุณ 🏫

## จบบทนี้แล้วทำอะไรได้

- เขียน test ของ Playwright ได้ 1 ข้อ ตั้งแต่ `import` จนถึง `expect`
- อธิบายได้ว่า `{ page }` คืออะไร และ `page.goto("/")` เปิดหน้าไหน
- ตรวจ title ของหน้าเว็บด้วย `toHaveTitle`
- รัน test ด้วย `pnpm test 01-first-test` แล้วอ่านผลได้ว่า passed / skipped

## เชื่อมกับที่รู้แล้ว

คุณเคยเขียน test ด้วย Jest/Vitest และ Supertest มาแล้ว Playwright ก็ใช้ `test("ชื่อ", async () => { ... })` กับ `expect(...)` เหมือนกัน ที่ต่างมีไม่กี่จุด:

| เรื่อง | Jest / Vitest | Playwright |
|---|---|---|
| `test`, `expect` | เป็น global (Jest) หรือ import จาก `vitest` | **ต้อง import เอง** จาก `@playwright/test` |
| ตัวช่วยที่ test ใช้ | สร้างเอง เช่น `request(app)` ของ Supertest | รับจากวงเล็บ `async ({ page }) => ...` เรียกว่า **fixture** Playwright สร้างให้ใหม่ทุก test |
| สิ่งที่ทดสอบ | ฟังก์ชัน / API | **หน้าเว็บจริงใน browser จริง** (Chromium) |
| `expect` กับหน้าเว็บ | `expect(a).toBe(b)` ตรวจทันที | `await expect(page).toHaveTitle(...)` ต้อง `await` เพราะมัน **รอและลองตรวจซ้ำ** จนกว่าจะผ่านหรือหมดเวลา |
| ข้อที่ยังไม่ทำ | `test.todo(...)` | `test.fixme(...)` (Playwright ไม่มี `test.todo`) ขึ้นเป็น skipped |

ใน Supertest เราส่ง request เข้า `app` ตรงๆ แต่ใน Playwright เราเปิด browser จริง เข้าเว็บจริงที่รันอยู่ แล้วตรวจสิ่งที่ผู้ใช้เห็น

## เนื้อหา

### โครงของ test

```ts
import { test, expect } from "@playwright/test";

test("หน้าแรกต้องมี title ว่า หน้าแรก | DN Shop", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("หน้าแรก | DN Shop");
});
```

- `import { test, expect } from "@playwright/test"` ทุกไฟล์ต้องมีบรรทัดนี้
- `async ({ page })` คือ test ขอ fixture ชื่อ `page` มาใช้ `page` คือ **แท็บ browser หนึ่งแท็บ** ที่เปิดมาใหม่เอี่ยมให้ test นี้โดยเฉพาะ test ข้ออื่นได้แท็บของตัวเอง จึงไม่ปนกัน
- `page.goto("/")` สั่งให้แท็บเปิดหน้า `/` เมื่อเขียน path แบบนี้ Playwright จะเอาไปต่อท้าย `baseURL` ที่ตั้งไว้ใน `playwright.config.ts` ซึ่งในคอร์สนี้คือ `http://localhost:3100`
- `await expect(page).toHaveTitle("...")` ตรวจว่า `<title>` ของหน้าตรงกับข้อความที่ระบุ ถ้ายังไม่ตรง Playwright จะรอและลองใหม่ให้อีกสักพัก (ค่าเริ่มต้น 5 วินาที) ก่อนจะบอกว่าไม่ผ่าน
- ทุกบรรทัดที่คุยกับหน้าเว็บมี `await` นำหน้า ตอนนี้จำไว้ก่อนว่า "ใส่ไปเลย" ส่วนเหตุผลอยู่ในบท 03

### ทุกหน้าของแอปมี title แบบ `{ชื่อหน้า} | DN Shop`

เช่น หน้าแรกคือ `หน้าแรก | DN Shop` ใช้ตรวจว่าเปิดหน้าถูกหน้าได้ง่ายที่สุด เป็นจุดเริ่มต้นที่ดีก่อนจะไปหา element ในบทถัดไป

### รอ build ครั้งแรก

`pnpm test` จะเปิดแอป DN Shop ขึ้นมาให้เอง (ตั้งไว้ใน `webServer` ของ `playwright.config.ts`) ถ้าเป็นการรันครั้งแรกบนเครื่อง ระบบจะ build แอปก่อน ใช้เวลาประมาณ **1 นาที** ระหว่างนั้นจะเห็นข้อความของ Next.js ขึ้นมาเยอะ ไม่ใช่ error ให้รอจนเริ่มรัน test ครั้งต่อๆ ไปจะเริ่มทันที เพราะ build เก็บไว้แล้ว (จะ build ใหม่ก็ต่อเมื่อโค้ดในโฟลเดอร์ `src/` เปลี่ยน)

## จุดที่มักพลาด

- **ลืม `import { test, expect }`**: ถ้าลืม จะเจอ error ว่าหา `test` ไม่เจอ ต่างจาก Jest ที่ใช้ได้เลย
- **ลืม `async` หรือ `await`**: บท 03 จะพาดูอาการ
- **พิมพ์ title ไม่ตรง**: ต้องตรงทุกตัวอักษร รวมถึงช่องว่างรอบเครื่องหมาย `|` ให้ดู `Expected` กับ `Received` ใน error เทียบกัน
- **ลืมเปลี่ยน `test.fixme` เป็น `test`**: ข้อที่ยังเป็น `test.fixme` จะถูกข้าม (skipped) ไม่ได้รันจริง ดูผลแล้วเขียว ก็ไม่ได้แปลว่าทำเสร็จ
- **ใส่ URL เต็ม**: ไม่ต้องเขียน `http://localhost:3100/products` เขียน `/products` พอ

## หน้าในแอปที่ใช้

| หน้า | title |
|---|---|
| `/` | `หน้าแรก \| DN Shop` |
| `/products` | `สินค้าทั้งหมด \| DN Shop` |
| `/cart` | `ตะกร้าสินค้า \| DN Shop` |
| `/login` | `เข้าสู่ระบบ \| DN Shop` |
| `/stores` | `สาขาของเรา \| DN Shop` |

อยากเห็นหน้าจริงให้รัน `pnpm app` แล้วเปิด http://localhost:3100 ดูใน browser ของคุณ (กด Ctrl+C เพื่อหยุด) title ดูได้จากแท็บของ browser

## วิธีรันบทนี้

```bash
pnpm test 01-first-test
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `1 passed` และ `4 skipped`

ทำแบบฝึกหัดไปทีละข้อ แต่ละข้อรันซ้ำด้วยคำสั่งเดิมได้เลย เสร็จครบแล้วจะเหลือ `5 passed`

## แบบฝึกหัดในบทนี้

เปิด `first-test.spec.ts` ดูตัวอย่างก่อน แล้วทำข้อ 1–4 โดยเปลี่ยน `test.fixme` เป็น `test` แล้วเขียนตรง 👉

1. title ของหน้า `/products`
2. title ของหน้า `/cart`
3. title ของหน้า `/login`
4. title ของหน้า `/stores` (ลองทำให้ test พังหนึ่งครั้งแล้วอ่าน error ก่อนแก้กลับ)

## อ่านเพิ่ม

- [Installation (เริ่มต้นใช้ Playwright Test)](https://playwright.dev/docs/intro)
- [Writing tests](https://playwright.dev/docs/writing-tests)
- [Assertions: `toHaveTitle`](https://playwright.dev/docs/api/class-pageassertions)
