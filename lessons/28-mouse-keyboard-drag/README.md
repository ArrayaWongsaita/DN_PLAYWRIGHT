# บทที่ 28: เมาส์ คีย์บอร์ด และลากวาง 🏫

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- ลาก element ไปวางด้วย `dragTo` และด้วย `mouse.move/down/up`
- กดคีย์และคีย์ลัดด้วย `keyboard.press` เช่น `ControlOrMeta+K`, `Escape`, `/`
- พิมพ์ข้อความที่ละตัวอักษรด้วย `keyboard.type`
- รู้ว่าคีย์ลัดของหน้าเว็บขึ้นกับว่า "โฟกัสอยู่ที่ไหน"

## เชื่อมกับที่รู้แล้ว

บท 06–07 ใช้ `click`, `hover`, `fill` ซึ่งเป็นคำสั่งระดับ locator (ต้องบอกว่าทำกับ element ไหน) บทนี้ใช้คำสั่งระดับ "อุปกรณ์": `page.keyboard` ส่งคีย์ไปยังสิ่งที่โฟกัสอยู่ตอนนี้ และ `page.mouse` ขยับเมาส์ตามพิกัดบนหน้า

## เนื้อหา

### 1. dragTo: ลากแล้วปล่อย

```ts
const doing = page.getByRole("region", { name: "กำลังทำ" });
const card = page.getByRole("region", { name: "ต้องทำ" }).getByRole("listitem").filter({ hasText: "แพ็กสินค้า" });
await card.dragTo(doing);
```

`dragTo(เป้าหมาย)` ทำให้: เมาส์ไปอยู่กลาง element ต้นทาง -> กดค้าง -> ลากไปกลาง element เป้าหมาย -> ปล่อย (และรอ actionability ของทั้งสองฝั่ง ตามบท 24) หน้า `/playground/drag-drop` ใช้ HTML5 drag and drop ของ browser (ไม่ใช่ไลบรารี) ซึ่ง Playwright ลากได้ตามปกติ

แต่ละช่องของกระดานเป็น `<section aria-label="ต้องทำ">` ฯลฯ ซึ่งมี role เป็น `region` จึงหาด้วย `getByRole("region", { name })` ได้ ตรวจผลด้วยการหาการ์ดภายในช่องปลายทาง และตรวจว่าช่องต้นทางไม่มีการ์ดนั้นแล้ว (`toHaveCount(0)`)

### 2. mouse.move / down / up: ทางเลือกเมื่อ dragTo ไม่พอ

เมื่อต้องควบคุมละเอียด (เช่นหยุดกลางทาง ลากผ่านหลายจุด) ทำเองได้ด้วยเมาส์ระดับล่าง:

```ts
const from = await card.boundingBox(); // กรอบของ element: { x, y, width, height } หรือ null ถ้าไม่เห็น
const to = await doing.boundingBox();
if (!from || !to) throw new Error("หา element ไม่เจอ");

await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2); // ไปกลางการ์ด
await page.mouse.down();                                                    // กดเมาส์ค้าง
await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 }); // ลากไปกลางช่องเป้าหมาย
await page.mouse.up();                                                       // ปล่อย
```

- พิกัดเป็น "พิกเซลของ viewport" ไม่ใช่ของ element
- `{ steps: 10 }` แบ่งการเคลื่อนที่เป็น 10 ช่วง เพราะ drag and drop ต้องการ event `mousemove` ต่อเนื่องหลายครั้ง ถ้ากระโดดทีเดียวหน้าอาจไม่เริ่มลาก
- `boundingBox()` ได้ `null` ถ้า element ไม่ปรากฏ จึงต้องตรวจก่อนใช้ (TypeScript บังคับให้ตรวจ)
- ใช้ `dragTo` เป็นหลัก ใช้วิธีนี้เฉพาะเมื่อ `dragTo` ทำงานไม่ถูกกับหน้านั้น

### 3. keyboard.press และคีย์ลัด

```ts
await page.keyboard.press("Escape");           // คีย์เดี่ยว ชื่อคีย์ตามมาตรฐาน เช่น Enter, Tab, ArrowDown
await page.keyboard.press("ControlOrMeta+K");  // กดพร้อมกัน (คั่นด้วย +)
```

- `ControlOrMeta` แปลว่า Control บน Windows/Linux และ Cmd (Meta) บน macOS ใช้แทนการเขียน `Control+K` กับ `Meta+K` แยกกัน
- `press` = กดแล้วปล่อย ส่งไปยัง element ที่ **โฟกัสอยู่** ถ้าไม่มีอะไรโฟกัสก็ส่งไปที่ `body` / เอกสาร
- หน้า `/playground/keyboard`: กด `ControlOrMeta+K` เปิด `role="dialog"` ชื่อ "ค้นหาด่วน" (ช่อง "ค้นหา" ถูกโฟกัสให้เอง) กด `Escape` ปิด และ `role="status"` แสดง "คีย์ล่าสุด: {key}" ของทุกคีย์ที่กด
- ถ้ามี element เฉพาะอยู่แล้ว ใช้ `locator.press("Enter")` ได้เลย (โฟกัส element นั้นให้ก่อน)

### 4. keyboard.type เทียบกับ fill

`page.keyboard.type("abc")` พิมพ์ทีละตัวอักษรเหมือนผู้ใช้ (เกิด keydown/keyup ของแต่ละตัว) ใช้กับสิ่งที่โฟกัสอยู่ ส่วน `locator.fill("abc")` ตั้งค่าทั้งก้อนทีเดียวเร็วกว่ามาก ใช้ `fill` เป็นหลัก และใช้ `keyboard.type` เมื่อต้องการให้หน้าได้รับ event ของแต่ละคีย์ (เช่นหน้า `/playground/keyboard` ที่แสดงคีย์ล่าสุด) หรือเมื่อไม่มี locator ของช่องกรอก (เช่น กล่องค้นหาด่วนที่โฟกัสให้เอง)

ต้องโฟกัสช่องก่อนพิมพ์ เช่น `await page.getByLabel("พิมพ์ที่นี่").click()`

### 5. คีย์ลัด `/` บนหน้าสินค้า และเรื่องโฟกัส

หน้า `/products` กด `/` เพื่อโฟกัสช่องค้นหา (เหมือนเว็บใหญ่ๆ หลายแห่ง) แต่ถ้าตอนนั้นโฟกัสอยู่ในช่องกรอก (input, textarea, select) คีย์ `/` จะถูกพิมพ์ลงไปเป็นตัวอักษรตามปกติ ไม่ใช่คีย์ลัด ดังนั้นต้องแน่ใจว่าโฟกัสอยู่ที่หน้าทั่วไป (body) ก่อนกด หลัง `goto` ไม่มีอะไรโฟกัส จึงกดได้เลย แต่ต้องรอให้หน้าพร้อมก่อน (ตรวจข้อความ "พบสินค้า 10 รายการ") เพราะคีย์ลัดทำงานด้วย JavaScript ที่ต้องโหลดเสร็จก่อน

### 6. หน้าที่ต้อง hydrate ก่อน

หน้า `/playground/drag-drop` และ `/playground/keyboard` ส่งมาจากเซิร์ฟเวอร์เป็น HTML ก่อน แล้ว JavaScript ของ React ค่อยผูกตัวจัดการ event (drag, keydown) เข้าไป (เรียกว่า hydrate) ถ้าเราลากหรือกดคีย์ในช่วงสั้นๆ ก่อน hydrate เสร็จ Playwright ทำคำสั่งสำเร็จแต่หน้า "ไม่ตอบสนอง" และ test จะ fail ที่การตรวจผลลัพธ์ `page.goto` รอ `load` ให้แล้ว จึงเจอน้อยมาก แต่เครื่องช้าหรือรันหลาย test พร้อมกันอาจเจอ สองหน้านี้ไม่มี element ที่บอกว่า "พร้อมแล้ว" ให้รอ ตัวอย่างในบทนี้จึงไม่มีขั้นตอนรอเพิ่ม ถ้า test fail เป็นครั้งคราวให้นึกถึงสาเหตุนี้ สำหรับ `/products` เรามี signal ที่ใช้ได้: รายการสินค้าและข้อความ "พบสินค้า 10 รายการ" ขึ้นหลัง JavaScript ทำงานแล้ว จึงรอข้อความนี้ก่อนกด `/` (ตัวอย่างข้อ 6)

## จุดที่มักพลาด

- **ใช้ `Control+K` อย่างเดียว**: บน macOS แอปรับ Cmd+K ใช้ `ControlOrMeta+K`
- **กดคีย์ลัดก่อนหน้าพร้อม**: JavaScript ของหน้ายังไม่ทำงาน เลยไม่มีอะไรเกิดขึ้น ให้รอ element ที่แสดงว่าหน้าพร้อมก่อน
- **โฟกัสอยู่ในช่องกรอกแล้วกดคีย์ลัด**: `/` กลายเป็นตัวอักษร
- **`mouse.move` กระโดดทีเดียว**: ลืมใส่ `steps` แล้วลากไม่ติด
- **ใช้ `boundingBox()` โดยไม่ตรวจ `null`**: TypeScript จะเตือน
- **ใช้พิกัดเก่า**: หลัง scroll หรือหน้าเปลี่ยนขนาด ต้องหา `boundingBox()` ใหม่
- **ใช้ `keyboard.type` ทุกที่**: `fill` เร็วและเสถียรกว่ากรณีทั่วไป

## หน้าในแอปที่ใช้

**`/playground/drag-drop`** 3 ช่อง (`section`) "ต้องทำ", "กำลังทำ", "เสร็จแล้ว" เริ่มต้นการ์ด "แพ็กสินค้า", "ส่งของ", "ตอบแชทลูกค้า" อยู่ใน "ต้องทำ"
**`/playground/keyboard`** ช่อง "พิมพ์ที่นี่", `role="status"` "คีย์ล่าสุด: {key}", `ControlOrMeta+K` เปิด dialog "ค้นหาด่วน", `Escape` ปิด
**`/products`** ช่อง "ค้นหาสินค้า" และคีย์ลัด `/`

## วิธีรันบทนี้

```bash
pnpm test 28-mouse-keyboard-drag
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `6 skipped`

## แบบฝึกหัดในบทนี้

1. ลากการ์ด "ส่งของ" ไปช่อง "กำลังทำ" (เหมือนตัวอย่างที่ 1)
2. ลากการ์ด "ตอบแชทลูกค้า" ไป "เสร็จแล้ว" แล้วตรวจว่าไม่อยู่ใน "ต้องทำ"
3. ลากด้วย `mouse.move/down/up` แทน `dragTo`
4. พิมพ์ด้วย `keyboard.type` แล้วตรวจ "คีย์ล่าสุด"
5. เปิดค้นหาด่วนด้วย `ControlOrMeta+K` พิมพ์คำค้น แล้วปิดด้วย `Escape`
6. กด `/` บนหน้าสินค้าให้โฟกัสช่องค้นหา

## อ่านเพิ่ม

- [Keyboard](https://playwright.dev/docs/input#keys-and-shortcuts)
- [Drag and drop](https://playwright.dev/docs/input#drag-and-drop)
- [Mouse (API)](https://playwright.dev/docs/api/class-mouse)
