# บทที่ 26: แท็บใหม่และหน้าต่างป๊อปอัป 🏫

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- รับแท็บใหม่ที่เปิดจากลิงก์ `target="_blank"` ด้วย `context.waitForEvent("page")`
- รับหน้าต่างป๊อปอัปที่เปิดด้วย `window.open` ด้วย `page.waitForEvent("popup")`
- ทำงานกับหลายหน้าพร้อมกัน (หน้าเดิมกับหน้าใหม่) ได้ถูกตัว
- ส่งข้อความในหน้าต่างแชทที่เปิดขึ้นมา

## เชื่อมกับที่รู้แล้ว

ใน Jest/Supertest ไม่มีเรื่อง "หน้าต่างอื่น" ใน Playwright, `page` คือแท็บหนึ่งแท็บ และ browser context (บท 20) เป็นเจ้าของหลายแท็บได้ เมื่อหน้าหนึ่งเปิดอีกหน้า Playwright ส่ง event ออกมา เราต้อง "ฟัง" event นั้นก่อนที่หน้าใหม่จะเปิด

## เนื้อหา

### 1. ทำไมต้องสร้าง promise ก่อนกด

หน้าใหม่เกิดขึ้นเพราะเรากดลิงก์/ปุ่ม แต่ event "หน้าใหม่เปิด" ผ่านไปแล้วไม่มีให้ย้อนกลับมาฟัง ถ้าเรากดก่อนแล้วค่อย `waitForEvent` อาจพลาดจังหวะ และ test จะค้างจนหมดเวลา วิธีที่ถูกคือ:

1. สร้าง promise ที่รอ event **โดยยังไม่ `await`**
2. กดลิงก์/ปุ่ม
3. `await` promise เพื่อรับหน้าใหม่

```ts
const pagePromise = context.waitForEvent("page");
await page.getByRole("link", { name: "เปิดคู่มือการสั่งซื้อในแท็บใหม่" }).click();
const newPage = await pagePromise;
```

บรรทัดแรกไม่มี `await` เป็นความตั้งใจ (สร้างตัวรอไว้ก่อน) แต่ต้อง `await` ตัวแปรนั้นทีหลังเสมอ ไม่งั้นรับหน้าไม่ได้

### 2. สองวิธีรับหน้าใหม่

| วิธี | ฟัง event ที่ | ใช้เมื่อ |
|---|---|---|
| `context.waitForEvent("page")` | browser context ทั้งหมด | ทุกหน้าใหม่ใน context ไม่ว่าใครเปิด |
| `page.waitForEvent("popup")` | หน้านี้ (ที่เป็นคนเปิด) | หน้าใหม่ที่ถูกเปิดโดย `page` นี้ (`window.open`, `target="_blank"`) |

ในบทนี้ทั้งลิงก์ `target="_blank"` และ `window.open` เกิด popup ทั้งคู่ ใช้วิธีไหนก็ได้ผลเหมือนกัน เลือกอย่างหลังถ้าอยากให้ชัดว่ารอหน้าที่ "หน้านี้" เปิด

### 3. ใช้หน้าใหม่เหมือน page ปกติ

หน้าที่ได้มาเป็น `Page` ตัวหนึ่ง ใช้ locator และ `expect` ได้ทุกอย่าง อย่าลืมว่าตัวแปร `page` เดิมยังชี้ที่แท็บเดิม

```ts
await expect(newPage).toHaveURL(/\/help\/ordering$/);
await expect(newPage.getByRole("heading", { level: 1, name: "คู่มือการสั่งซื้อ" })).toBeVisible();
```

ข้อควรระวัง: หน้าใหม่เพิ่งเปิดอาจยังโหลดไม่เสร็จ ถ้าจะกรอกฟอร์มทันทีให้ `await newPage.waitForLoadState("load")` ก่อน (ไม่งั้นฟอร์มอาจยังไม่พร้อมรับการพิมพ์ ข้อความที่กรอกจะหาย) ส่วนการตรวจด้วย `expect` รอเองอยู่แล้ว

### 4. หน้าต่างแชท

ปุ่ม "เปิดหน้าต่างแชท" เรียก `window.open("/playground/chat", "chat", "popup,width=400,height=600")` ได้หน้าต่างเล็กที่มีหัวข้อ "แชทกับร้าน" ช่องกรอก "ข้อความ" และปุ่ม "ส่ง" ข้อความที่ส่งไปต่อท้ายใน `<ul aria-label="ข้อความแชท">`

ข้อสังเกตเรื่อง locator: `getByLabel("ข้อความ")` จับได้ทั้งช่องกรอก (label "ข้อความ") และรายการ (aria-label "ข้อความแชท" มีคำว่า "ข้อความ") เพราะโดยปกติ getByLabel ค้นแบบ "มีข้อความนี้อยู่ในชื่อ" จึงต้องใส่ `{ exact: true }` ให้ตรงทั้งชื่อ

```ts
await chat.getByLabel("ข้อความ", { exact: true }).fill("สวัสดีครับ");
await chat.getByRole("button", { name: "ส่ง", exact: true }).click();
await expect(chat.getByRole("list", { name: "ข้อความแชท" }).getByRole("listitem")).toHaveText("สวัสดีครับ");
```

### 5. ปิดหน้าต่าง

`await chat.close()` ปิดหน้านั้น (ไม่กระทบ `page` เดิม) `chat.isClosed()` บอกว่าปิดแล้วหรือยัง (คืนค่าทันที ไม่ต้อง await)

## จุดที่มักพลาด

- **`await` promise ตั้งแต่ตอนสร้าง**: `const p = await context.waitForEvent("page")` จะค้างเพราะยังไม่ได้กดอะไร สร้างแบบไม่มี `await`
- **กดก่อนแล้วค่อยรอ event**: อาจพลาดหน้าใหม่ ให้สร้าง promise ก่อนกดเสมอ
- **ใช้ `page` แทน `newPage`**: ตัวแปรเดิมยังชี้ที่แท็บเดิม คำสั่งไปทำงานผิดหน้า
- **กรอกฟอร์มในหน้าที่เพิ่งเปิดเร็วเกินไป**: รอ `waitForLoadState("load")` ก่อน
- **`getByLabel("ข้อความ")` ชนกัน**: ใส่ `{ exact: true }`
- **ลืมว่าแต่ละ test มี context ใหม่**: หน้าใหม่ที่เปิดมาอยู่ใน context เดียวกับ `page` ของ test นั้นและถูกปิดเมื่อจบ test

## หน้าในแอปที่ใช้

**`/playground/new-tab`** ลิงก์ "เปิดคู่มือการสั่งซื้อในแท็บใหม่" (`target="_blank"` ไป `/help/ordering`) และปุ่ม "เปิดหน้าต่างแชท"
**`/help/ordering`** h1 "คู่มือการสั่งซื้อ"
**`/playground/chat`** h1 "แชทกับร้าน" ช่อง "ข้อความ" ปุ่ม "ส่ง" และรายการ "ข้อความแชท"

## วิธีรันบทนี้

```bash
pnpm test 26-new-tab-popup
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

## แบบฝึกหัดในบทนี้

1. เปิดคู่มือในแท็บใหม่ แล้วตรวจว่าแท็บเดิมยังอยู่ที่ `/playground/new-tab`
2. รับแท็บคู่มือด้วย `page.waitForEvent("popup")` แทน `context.waitForEvent("page")`
3. ส่งข้อความแชทอีกข้อความหนึ่ง
4. ส่งสองข้อความแล้วตรวจลำดับ
5. ปิดหน้าต่างแชทแล้วกลับมาใช้แท็บเดิม

## อ่านเพิ่ม

- [Pages: Handling new pages](https://playwright.dev/docs/pages#handling-new-pages)
- [Handling popups](https://playwright.dev/docs/pages#handling-popups)
- [page.waitForEvent](https://playwright.dev/docs/api/class-page#page-wait-for-event)
