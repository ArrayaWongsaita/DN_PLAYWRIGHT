# บทที่ 13: web-first assertions และการรอ 🏫

## จบบทนี้แล้วทำอะไรได้

- อธิบายได้ว่า `await expect(locator).toBeVisible()` ต่างจาก `expect(await locator.isVisible()).toBe(true)` อย่างไร
- เลือกใช้ assertion ที่ "รอเอง" กับส่วนของหน้าที่แสดงผลช้า
- เพิ่มเวลารอของ assertion ด้วย `{ timeout }` เมื่องานช้ากว่าค่าเริ่มต้น
- อ่านข้อความ error ของ `Expected` / `Received` เพื่อดูว่า assertion ไม่รอ

## เชื่อมกับที่รู้แล้ว

บท 03 สอนว่าทุกคำสั่งต้อง `await` และบท 11–12 ใช้ `await expect(locator)...` มาตลอด บทนี้อธิบายว่าทำไมรูปแบบนี้ถึงถูกต้อง และเปรียบเทียบกับรูปแบบที่หลายคนเขียนโดยไม่รู้ตัวแล้วทำให้ test ผ่านบ้างไม่ผ่านบ้าง บทนี้เป็นบทที่ **ตั้งใจให้ดูโค้ดที่ไม่ควรเขียน** (อยู่ใน `test.fixme` เพื่อให้เปิดดูเมื่อพร้อม)

## เนื้อหา

### web-first assertion คืออะไร

assertion ที่ส่ง **locator** เข้าไปใน `expect` (เช่น `expect(page.getByRole(...))`) เรียกว่า web-first assertion มันไม่ตรวจครั้งเดียวแล้วจบ แต่ **ลองตรวจซ้ำเรื่อยๆ** จนเงื่อนไขเป็นจริง หรือจนหมดเวลา (ค่าเริ่มต้น 5 วินาที) ถึงจะล้มเหลว

```ts
await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
await expect(page.getByRole("status").filter({ hasText: "เพิ่มลงตะกร้าแล้ว" })).toBeVisible();
```

บนหน้าสินค้า แอปรอ API ตอบแล้วหน่วงอีก 800ms ก่อนแสดงข้อความ "เพิ่มลงตะกร้าแล้ว" `toBeVisible` ลองซ้ำจนข้อความขึ้นมา test จึงผ่านโดยไม่ต้องเขียนอะไรเพิ่ม

### รูปแบบที่ไม่รอ

```ts
expect(await message.isVisible()).toBe(true);   // ไม่ควรใช้
```

แยกเป็นสองขั้นจะเห็นปัญหา:

1. `await message.isVisible()` ตอบ **ทันที** ว่า "ตอนนี้ เห็นไหม" ซึ่งยังไม่เห็น (ข้อความยังไม่ขึ้น) ได้ค่า `false` ตรงนี้ Playwright ไม่รอ
2. `expect(false).toBe(true)` เป็นการเทียบค่าธรรมดา ตรวจครั้งเดียว ล้มเหลวทันที

ผลคือ test พังด้วยข้อความ `Expected: true / Received: false` ทั้งที่ผ่านไปอีกไม่ถึงวินาทีข้อความก็ขึ้นแล้ว ที่น่ากลัวกว่าคือบนเครื่องที่เร็วมาก test อาจผ่านบางครั้ง แล้วพังบนเครื่อง CI ที่ช้ากว่า (flaky) ให้เปิดตัวอย่างที่ 3 ในไฟล์ test เพื่อดูของจริง

### ตารางเทียบ

| เขียนแบบนี้ (ไม่รอ) | เขียนแบบนี้แทน (รอ) |
|---|---|
| `expect(await x.isVisible()).toBe(true)` | `await expect(x).toBeVisible()` |
| `expect(await x.isDisabled()).toBe(true)` | `await expect(x).toBeDisabled()` |
| `expect(await x.textContent()).toBe("ก")` | `await expect(x).toHaveText("ก")` |
| `expect(await x.inputValue()).toBe("1")` | `await expect(x).toHaveValue("1")` |
| `expect(await x.count()).toBe(2)` | `await expect(x).toHaveCount(2)` |

หลักจำ: ถ้าใน `expect(...)` มี `await` ซ้อนอยู่ข้างใน แปลว่ากำลังดึงค่ามาตรวจครั้งเดียว ให้เปลี่ยนเป็นส่ง locator เข้าไปตรงๆ

### เวลารอของ assertion

| ค่าเริ่มต้น | ความหมาย |
|---|---|
| 5 วินาที | เวลารอของ `expect` แต่ละบรรทัด |
| 30 วินาที | เวลารวมของ test หนึ่งตัว |

ถ้างานช้ากว่า 5 วินาทีจริงๆ (เช่นหน้า `/playground/slow?delay=6000`) ให้เพิ่มเวลาเฉพาะ assertion นั้น:

```ts
await expect(done).toBeVisible({ timeout: 10_000 });
```

เวลาที่ใส่คือ **เพดาน** ไม่ใช่การหน่วง ถ้าข้อความขึ้นที่วินาทีที่ 2 ก็ผ่านที่วินาทีที่ 2 (ตัวเลข `10_000` คือ 10000 เขียนขีดล่างให้อ่านง่าย) การเพิ่ม timeout ใช้เมื่อ "ช้าตามธรรมชาติ" ไม่ใช่เพื่อซ่อน test ที่ไม่เสถียร การตั้งค่ากลางของทั้งโปรเจกต์อยู่ใน `playwright.config.ts` (ดูบท 23)

## จุดที่มักพลาด

- **ใช้ `expect(await x.isVisible()).toBe(true)`**: ไม่รอ ดูตัวอย่างที่ 3
- **ลืม `await` หน้า `expect`**: `expect(locator).toBeVisible()` ไม่มี `await` จะไม่รอและ test จบก่อนตรวจ (บท 03)
- **ใส่ timeout สูงๆ ทุกบรรทัด**: ซ่อนปัญหาว่าแอปช้าเกินไป เพิ่มเฉพาะที่ช้าตามธรรมชาติ
- **ตรวจข้อความที่ "ยังไม่ขึ้น" ด้วย `toBeHidden` แล้วผ่านทันที**: ถ้าต้องการยืนยันว่าข้อความหายไปหลังเกิดเหตุการณ์ ให้ตรวจก่อนว่าข้อความเคยขึ้นแล้ว
- **คิดว่า timeout ของ test กับ expect เป็นอันเดียวกัน**: คนละค่า (30 วินาที กับ 5 วินาที) ถ้า test ใช้เวลารวมเกิน 30 วินาทีจะล้มด้วยข้อความ test timeout

## หน้าในแอปที่ใช้

- **`/products/p01`**, **`/products/p02`**: ปุ่ม "เพิ่มลงตะกร้า" แล้วข้อความ `role="status"` "เพิ่มลงตะกร้าแล้ว" ขึ้นหลังหน่วง 800ms ตัวเลขใน header (`data-testid="cart-count"`) อัปเดตตามหลัง
- **`/playground/slow`**: อ่าน `?delay=` (ค่าเริ่ม 2000 ms) ปุ่ม "โหลดข้อมูล" → "กำลังโหลด..." → "โหลดข้อมูลเสร็จแล้ว" และปุ่ม "ส่งฟอร์ม" ที่ disabled (แสดง "รอสักครู่...") อยู่ราว 1.5 วินาทีหลังโหลดหน้า นอกจากนี้ยังมี overlay "กำลังเตรียมหน้า..." บังหน้า 1 วินาทีแรก (คำสั่ง `click` จะรอให้หายบังเอง)

## วิธีรันบทนี้

```bash
pnpm test 13-web-first-assertions
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `6 skipped` (หนึ่งในหก skipped คือตัวอย่างที่ 3 ที่ตั้งใจให้พัง)

ลองดูตัวอย่างที่ 3: เปลี่ยน `test.fixme` เป็น `test` รันบทนี้อีกครั้ง จะเห็น `1 failed` พร้อม `Expected: true` / `Received: false` ดูเสร็จให้เปลี่ยนกลับเป็น `test.fixme`

## แบบฝึกหัดในบทนี้

1. กดเพิ่ม p02 ลงตะกร้าแล้วเห็นข้อความยืนยัน
2. ตัวเลขตะกร้าที่ header เปลี่ยนเป็น 1
3. หน้า slow เห็น "กำลังโหลด..." แล้วเห็น "โหลดข้อมูลเสร็จแล้ว"
4. หน้า slow ที่ delay 7 วินาทีต้องใส่ `{ timeout }`
5. รอปุ่ม "ส่งฟอร์ม" พร้อมกดแล้วกดส่ง

## อ่านเพิ่ม

- [Auto-waiting (actionability)](https://playwright.dev/docs/actionability)
- [Assertions: auto-retrying](https://playwright.dev/docs/test-assertions#auto-retrying-assertions)
- [Timeouts](https://playwright.dev/docs/test-timeouts)
