# บทที่ 32: evaluate, console และ pageerror

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- รันโค้ด JavaScript ในหน้าเว็บและอ่านค่ากลับมาด้วย `page.evaluate`
- ส่งค่าจาก test เข้าไปให้โค้ดในหน้าเว็บด้วย argument ของ `evaluate`
- เก็บข้อความที่หน้าเขียนลง console ด้วย `page.on("console")` และดูชนิดด้วย `msg.type()`
- จับ error ที่ไม่มีใครดักในหน้าด้วย `page.on("pageerror")`
- อ่านข้อความและ error ย้อนหลังด้วย `page.consoleMessages()` และ `page.pageErrors()`

## เชื่อมกับที่รู้แล้ว

ที่ผ่านมา test ของเรามองหน้าเว็บ "จากข้างนอก" เหมือนผู้ใช้ (ปุ่ม ข้อความ) บางครั้งเราอยากรู้สิ่งที่ผู้ใช้มองไม่เห็น เช่น ค่าตัวแปรในหน้า หรือ error ใน DevTools console ซึ่งเทียบได้กับการเปิด DevTools แล้วพิมพ์โค้ดในแท็บ Console ด้วยมือ Playwright ทำสิ่งนั้นผ่านโค้ดได้ ใน Jest ที่ทดสอบ Node ตรงๆ โค้ดกับ test อยู่ใน process เดียวกัน แต่ที่นี่ test รันใน Node ส่วนหน้าเว็บรันใน browser สองฝั่งแยกกัน นี่คือหัวใจของบทนี้

## เนื้อหา

### 1. page.evaluate: รันโค้ดในหน้าเว็บ

```ts
const version = await page.evaluate(() => window.dnShop.version);
```

ฟังก์ชันที่ส่งให้ `evaluate` **ถูกส่งไปรันใน browser** (มีสิทธิ์เข้าถึง `window`, `document` เหมือนโค้ดของหน้า) แล้วค่าที่ `return` ถูกส่งกลับมาให้ test ใน Node กฎสำคัญ:

- ฟังก์ชันนั้นเห็นตัวแปรของ test ไม่ได้ เพราะมันไปรันอีก process หนึ่ง (ดูหัวข้อ 2)
- ค่าที่คืนกลับต้อง "ส่งข้ามระหว่าง browser กับ Node ได้" (serializable): ข้อความ ตัวเลข บูลีน `null` `undefined` อาร์เรย์ object ธรรมดา รวมถึงชนิดอย่าง `Date` และ `NaN` แต่ส่ง DOM element หรือฟังก์ชันที่ผูกกับตัวแปรภายนอก (closure) กลับมาไม่ได้
- ถ้าฟังก์ชันคืน Promise จะรอให้เสร็จแล้วให้ค่า (ใส่ `async` ได้)
- `evaluate` ไม่รอเหมือน locator: มันรันทันทีที่สั่ง

หน้า `/playground/console` สร้างวัตถุ `window.dnShop = { version: "1.0.0", getGreeting() }` ให้ฝึก

**TypeScript**: โค้ดใน `evaluate` ถูกตรวจชนิดด้วย TypeScript ของ test ซึ่งไม่รู้จัก `window.dnShop` ในไฟล์ spec จึงบอกชนิดเองด้วยการ cast:

```ts
type DnShopWindow = Window & { dnShop?: { version: string; getGreeting(): string } };
await page.evaluate(() => (window as DnShopWindow).dnShop?.version);
```

### 2. ส่ง argument เข้า evaluate

```ts
const text = await page.evaluate((prefix) => `${prefix}${(window as DnShopWindow).dnShop?.version}`, "v");
// text = "v1.0.0"
```

อาร์กิวเมนต์ตัวที่สองของ `evaluate` ถูกส่งต่อเข้าไปเป็นพารามิเตอร์ของฟังก์ชัน ซึ่งต้องเป็นค่าที่ส่งข้าม process ได้แบบเดียวกัน (ข้อความ ตัวเลข อาร์เรย์ object ธรรมดา `Date` ฯลฯ ไม่ใช่ DOM element หรือฟังก์ชัน) ส่งได้ **ค่าเดียว** ถ้าต้องการหลายค่าให้ห่อเป็น object หรือ array:

```ts
const sum = await page.evaluate(({ a, b }) => a + b, { a: 2, b: 3 }); // 5
```

อย่าเขียนแบบนี้ (ผิด): `page.evaluate(() => prefix + "x")` เพราะ `prefix` เป็นตัวแปรของ test ไม่มีอยู่ใน browser จะเกิด error `prefix is not defined` ฝั่ง browser

### 3. ต้องรอให้หน้าพร้อมก่อน

`window.dnShop` ถูกสร้างหลังหน้า hydrate เสร็จ ไม่ใช่ทันทีที่ `goto` จบ ถ้า `evaluate` ทันที อาจได้ `undefined` เป็นบางรอบ และ `evaluate` ไม่รอให้เอง ใช้ `expect.poll` ซึ่งเรียกฟังก์ชันซ้ำจนผลตรงตามคาดหรือหมดเวลา:

```ts
await expect.poll(() => page.evaluate(() => (window as DnShopWindow).dnShop?.version)).toBe("1.0.0");
```

ใช้ `?.` เพื่อให้ได้ `undefined` แทนที่จะ error ตอนที่ `dnShop` ยังไม่มี `expect.poll` เหมาะกับค่าที่ต้องคำนวณเอง (ไม่ใช่ locator) และเป็น "สัญญาณพร้อม" ของหน้านี้ด้วย: ปุ่มต่างๆ ในหน้ามีอยู่ตั้งแต่ตอน server render แต่ตัวจัดการการคลิก (onClick) ถูกผูกหลัง hydrate ถ้ากดปุ่มก่อนหน้านั้น การกดจะไม่ทำอะไร จึงควรรอจนอ่าน `dnShop.version` ได้ก่อนกดปุ่ม

### 4. page.on("console"): เก็บข้อความ console

```ts
const messages: string[] = [];
page.on("console", (msg) => messages.push(`${msg.type()}: ${msg.text()}`));
await page.goto("/playground/console");
```

- `page.on("console", ฟังก์ชัน)` เรียกฟังก์ชันทุกครั้งที่หน้าเขียน `console.*` พารามิเตอร์คือ `ConsoleMessage`
- `msg.text()` ข้อความ และ `msg.type()` ชนิด: `log`, `warning` (จาก `console.warn`), `error`, `info`, `debug` ... สังเกตว่า `console.warn` มีชนิด `"warning"`
- **ลงทะเบียนก่อน `goto`** ไม่งั้นข้อความที่หน้าเขียนตอนโหลดจะพลาดไป (ตัวอย่าง: "หน้า console พร้อมแล้ว")
- listener ทำงานเป็นพื้นหลัง การตรวจผลจึงใช้ `expect.poll(() => messages).toContain("...")` เพื่อรอจนข้อความมาถึง

ถ้าอยากรอข้อความเฉพาะอย่างเดียว ใช้ `waitForEvent` แบบบท 26 สร้าง promise ก่อนกดแล้ว await ทีหลัง:

```ts
const warnPromise = page.waitForEvent("console", (msg) => msg.type() === "warning");
await page.getByRole("button", { name: "เตือน" }).click();
const msg = await warnPromise;
expect(msg.text()).toBe("ระวัง: สินค้าใกล้หมด");
```

### 5. page.on("pageerror"): error ที่ไม่มีใครดัก

ปุ่ม "ทำให้ error" โยน `new Error("เกิดข้อผิดพลาดที่ไม่คาดคิด")` แบบไม่มีใครดัก (uncaught) โดยโยนจาก `setTimeout` หลังกดเล็กน้อย event `pageerror` คือสัญญาณของ error แบบนี้ ได้ object `Error` ปกติ:

```ts
const errorPromise = page.waitForEvent("pageerror");
await page.getByRole("button", { name: "ทำให้ error" }).click();
const error = await errorPromise;
expect(error.message).toBe("เกิดข้อผิดพลาดที่ไม่คาดคิด");
```

`pageerror` ต่างจาก `console`: ข้อความที่เราเขียนเองด้วย `console.error("...")` มาทาง `console` ชนิด `error` ส่วนการ throw ที่ไม่มีใครดักมาทาง `pageerror`

ประโยชน์ในงานจริง: ใส่ `page.on("pageerror", ...)` ใน fixture เพื่อให้ทุก test ล้มทันทีถ้าหน้าเว็บมี error ที่ไม่ได้ตั้งใจ

### 6. consoleMessages() และ pageErrors(): อ่านย้อนหลัง

Playwright 1.65 มีสองเมธอดที่เก็บข้อความให้อัตโนมัติ ไม่ต้องลงทะเบียน listener ล่วงหน้า (เก็บล่าสุดไม่เกิน 200 รายการต่อหน้า):

```ts
const messages = await page.consoleMessages();          // ConsoleMessage[]
const errors = await page.pageErrors();                  // Error[]
await expect.poll(async () => (await page.pageErrors()).map((e) => e.message)).toContain("เกิดข้อผิดพลาดที่ไม่คาดคิด");
```

- ทั้งคู่รับ `{ filter: "since-navigation" }` เพื่อเอาเฉพาะรายการหลังการเปลี่ยนหน้าล่าสุด (ค่าเริ่มต้น `"all"`)
- มี `page.clearConsoleMessages()` และ `page.clearPageErrors()` ล้างรายการ
- คืนค่าเป็น Promise เหมือนเมธอดอื่น ต้อง `await`
- ใช้สะดวกเมื่อเพิ่งนึกได้หลังจบ flow ว่าอยากดู error ส่วน `page.on(...)` ยังจำเป็นเมื่อต้องการ callback ทันทีที่เกิดเหตุ

## จุดที่มักพลาด

- **ใช้ตัวแปรของ test ใน `evaluate` โดยไม่ส่ง argument**: ฟังก์ชันรันใน browser ไม่เห็นตัวแปรนั้น ให้ส่งเป็นอาร์กิวเมนต์ตัวที่สอง
- **ส่งหลาย argument แยกกัน**: ส่งได้ค่าเดียว ให้ห่อเป็น object
- **`evaluate` ทันทีหลัง `goto`**: ค่าอาจยังไม่พร้อม (hydrate) ให้ใช้ `expect.poll`
- **กดปุ่มก่อนหน้า hydrate**: onClick ยังไม่ผูก การกดไม่เกิดผล รอสัญญาณพร้อมก่อน (หัวข้อ 3)
- **ลงทะเบียน `page.on("console")` หลัง `goto`**: พลาดข้อความตอนโหลด (ถ้าใช้ `consoleMessages()` ไม่มีปัญหานี้)
- **ตรวจชนิด `console.warn` ว่า `"warn"`**: ที่ถูกคือ `"warning"`
- **คาดว่า `pageerror` จะจับแค่ error แบบเดียว**: `pageerror` คือ error ที่ไม่มีใครดักในหน้า (uncaught) ปุ่ม "ทำให้ error" ของหน้านี้โยน error จาก `setTimeout` และเราลองรันจริงแล้วว่าถึง `pageerror` พร้อมข้อความ "เกิดข้อผิดพลาดที่ไม่คาดคิด" ส่วน error ที่โค้ดดักไว้เอง (`try/catch`) หรือที่แค่เขียนด้วย `console.error(...)` จะไม่ใช่ `pageerror` (อย่างหลังมาทาง `console` ชนิด `error`) บทนี้ไม่ได้ทดสอบ error ที่โยนตรงใน `onClick` ของ React จึงไม่ยืนยันว่าเป็นอย่างไร
- **คืน element หรือฟังก์ชันจาก `evaluate`**: ส่งกลับไม่ได้ ให้คืนเป็นข้อมูลธรรมดา

## หน้าในแอปที่ใช้

**`/playground/console`** ตอนโหลดเขียน `console.log("หน้า console พร้อมแล้ว")` มีปุ่ม "log ข้อความ" (`console.log("กดปุ่มแล้ว")`), "เตือน" (`console.warn("ระวัง: สินค้าใกล้หมด")`), "ทำให้ error" (โยน `Error("เกิดข้อผิดพลาดที่ไม่คาดคิด")` แบบไม่มีใครดัก) และมี `window.dnShop = { version: "1.0.0", getGreeting() }`

## วิธีรันบทนี้

```bash
pnpm test 32-evaluate-console
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `6 skipped`

## แบบฝึกหัดในบทนี้

1. ตรวจว่า `dnShop.getGreeting` เป็นฟังก์ชันด้วย `typeof` ใน `evaluate`
2. ส่ง object เป็น argument ให้ `evaluate`
3. เรียก `getGreeting` ภายใต้เวลาที่ตั้งด้วย `page.clock` (ต่อจากบท 31)
4. จับ `console.warn` ด้วย `waitForEvent("console")`
5. จับ `pageerror` หลังกด "ทำให้ error"
6. อ่านย้อนหลังด้วย `page.consoleMessages()` และ `page.pageErrors()`

## อ่านเพิ่ม

- [Evaluating JavaScript](https://playwright.dev/docs/evaluating)
- [page.on("console") / ConsoleMessage](https://playwright.dev/docs/api/class-consolemessage)
- [page.consoleMessages](https://playwright.dev/docs/api/class-page#page-console-messages)
