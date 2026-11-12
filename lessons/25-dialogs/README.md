# บทที่ 25: dialog (alert, confirm, prompt

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- จัดการกล่องโต้ตอบของ browser (`alert`, `confirm`, `prompt`) ด้วย `page.once("dialog", ...)`
- เลือกกด ตกลง (`accept`) หรือ ยกเลิก (`dismiss`) และตอบ prompt ด้วยข้อความ
- อ่านข้อความของ dialog ด้วย `dialog.message()` และตรวจ **นอก** handler
- ทดสอบการลบของในตะกร้าที่ถามยืนยันด้วย `confirm`

## เชื่อมกับที่รู้แล้ว

ใน Jest ฟังก์ชัน `window.confirm` ถูก mock ด้วย `jest.spyOn(window, "confirm").mockReturnValue(true)` ใน Playwright เราใช้ browser จริง `confirm` จึงเปิดกล่องจริง และ Playwright ให้เรา "ตอบ" กล่องนั้นผ่าน event `dialog`

## เนื้อหา

### 1. dialog คืออะไร และเกิดอะไรขึ้นถ้าไม่มี handler

`alert("...")`, `confirm("...")` และ `prompt("...")` เป็นกล่องที่ browser แสดงและ **หยุดการทำงานของหน้า** จนกว่าผู้ใช้จะตอบ ใน Playwright ถ้าเราไม่ฟัง event `dialog` เลย Playwright จะ **ปิดกล่องให้เองโดยการ dismiss** (confirm = ยกเลิก, prompt = ยกเลิก) test จึงไม่ค้าง แต่ถ้ามีคนฟัง event `dialog` อยู่แล้วไม่ตอบ ตัวคำสั่งที่ทำให้กล่องเด้ง (เช่น `click()`) จะค้างจนหมดเวลา เพราะหน้าถูกหยุดไว้

### 2. รูปแบบมาตรฐาน: ตั้ง handler ก่อน แล้วค่อยกด

```ts
let message = "";
page.once("dialog", async (dialog) => {
  message = dialog.message();
  await dialog.accept();
});
await page.getByRole("button", { name: "แสดง alert" }).click();
expect(message).toBe("นี่คือ alert");
```

- **ตั้ง handler ก่อนกด** เพราะกล่องเด้งทันทีที่กด ถ้าตั้งทีหลังจะไม่ทัน (กล่องถูกปิดแบบ dismiss ไปแล้ว หรือ test ค้าง)
- `page.once` ทำงานครั้งเดียวแล้วเลิกฟัง เหมาะกับ test ที่คาดว่ามี dialog ครั้งเดียว (`page.on` ฟังตลอด ต้องไปเลิกฟังเอง)
- `dialog.message()` คือข้อความในกล่อง, `dialog.type()` คือ `"alert"`, `"confirm"` หรือ `"prompt"`
- `await dialog.accept()` กด OK, `await dialog.dismiss()` กดยกเลิก ทั้งสองต้อง `await`
- `dialog.accept("สมชาย")` ใช้กับ `prompt` เพื่อใส่คำตอบก่อนกด OK

### 3. ทำไมต้องเก็บ message ไว้ตรวจนอก handler

ถ้าเขียน `expect(dialog.message()).toBe(...)` ข้างใน handler แล้วไม่ตรง error จะเกิดใน event handler ซึ่งไม่ใช่ตัว test โดยตรง ผลที่ได้คือ handler โยน error ก่อนจะถึงบรรทัด `accept()`/`dismiss()` dialog จึงไม่ถูกตอบ และ `click()` ที่ทำให้กล่องเด้งค้างจนหมดเวลา ข้อความ error ที่เห็นคือ timeout ของ `click` ไม่ใช่ข้อความ "ค่าไม่ตรง" ที่แท้จริง ยากต่อการอ่านสาเหตุ และถ้า dialog ไม่เด้งเลย assertion ในนั้นไม่ถูกรันเลย test ผ่านแบบหลอกๆ

วิธีที่ปลอดภัย: ใน handler ทำแค่ "เก็บค่า + ตอบกล่อง" แล้วตรวจค่าที่เก็บ **หลัง** `click()` นอก handler ถ้า dialog ไม่เด้ง ตัวแปรยังเป็น `""` และ `expect(message).toBe("นี่คือ alert")` จะ fail ให้เห็นทันที

### 4. confirm และ prompt

```ts
// confirm: ตกลง
page.once("dialog", async (dialog) => { message = dialog.message(); await dialog.accept(); });
// confirm: ยกเลิก
page.once("dialog", async (dialog) => { message = dialog.message(); await dialog.dismiss(); });
// prompt: ตอบ "สมชาย"
page.once("dialog", async (dialog) => { message = dialog.message(); await dialog.accept("สมชาย"); });
```

หน้า `/playground/dialogs` ใส่ผลลัพธ์ไว้ใน `role="status"` ("ผลลัพธ์: ตกลง", "ผลลัพธ์: ยกเลิก", "สวัสดี, สมชาย") ตรวจต่อจากการกดได้เลย

### 5. ลบของในตะกร้า (confirm จริงในแอป)

ปุ่ม "ลบ" ในตะกร้าถามด้วย `confirm` ข้อความรูปแบบ `ต้องการลบ "{ชื่อสินค้า}" ออกจากตะกร้าใช่ไหม?` ถ้าตกลง สินค้าถูกลบ ถ้ายกเลิก สินค้ายังอยู่ ลำดับที่ควรเขียน: เพิ่มของ -> เปิด `/cart` -> ตั้ง handler -> กด "ลบ" -> ตรวจข้อความที่เก็บไว้ -> ตรวจสภาพตะกร้า

ปุ่ม "ลบ" ต้องหาภายในรายการของสินค้านั้น (`getByRole("listitem").filter({ hasText: "ชื่อสินค้า" })`) เพื่อไม่ให้ชนกับปุ่ม "ลบ" ของสินค้าอื่น

### 6. หน้าที่ต้อง hydrate ก่อน

หน้า playground ส่วนใหญ่ (รวม `/playground/dialogs`) ถูกสร้างจากเซิร์ฟเวอร์เป็น HTML ก่อน แล้ว JavaScript ของ React ค่อยโหลดและ "ผูก" ตัวจัดการ onClick เข้ากับปุ่ม (เรียกว่า hydrate) ช่วงสั้นๆ ก่อน hydrate เสร็จ ปุ่มมองเห็นและกดได้ (Playwright จึงกด) แต่ยังไม่มีอะไรเกิดขึ้น: dialog ไม่เด้ง และ test จะ fail ที่การตรวจข้อความหรือผลลัพธ์ โดยปกติ `page.goto` รอให้หน้าโหลดเสร็จ (`load`) ก่อนไปต่อ ซึ่งทำให้เจอกรณีนี้น้อยมาก แต่เครื่องที่ช้าหรือรันหลาย test พร้อมกันอาจเจอได้ หน้านี้ไม่มีข้อความหรือ element ที่แสดงว่า "พร้อมแล้ว" ให้รอ จึงทำได้แค่เข้าใจที่มาของอาการ ถ้า test ของหน้าแบบนี้ fail เป็นครั้งคราวทั้งที่โค้ดถูก ให้นึกถึงเรื่องนี้ และเมื่อหน้ามี element ที่ขึ้นหลังจาก JavaScript ทำงานแล้ว (เช่นรายการสินค้าที่โหลดด้วย fetch ในหน้า `/products`) ให้รอ element นั้นก่อนกดเสมอ

## จุดที่มักพลาด

- **กดก่อนตั้ง handler**: ตั้ง `page.once("dialog", ...)` ก่อน `click()` เสมอ
- **ลืม `await` ที่ `dialog.accept()` หรือ `dismiss()`**: คำสั่งยังไม่ทันเสร็จก่อนที่ test จะไปต่อ
- **assert ใน handler**: ใช้เก็บค่าไว้ตัวแปรแล้วตรวจนอก handler
- **ใช้ `page.on` แล้วลืมว่ามัน "ทำงานทุกครั้ง"**: dialog ที่สองก็ถูก handler เดิมจัดการ ใช้ `once` ถ้าคาดว่ามีครั้งเดียว
- **คิดว่า dialog ปิดเองไม่ต้องทำอะไร**: ถ้าไม่ตั้ง handler Playwright จะ dismiss ให้ ซึ่งอาจทำให้ confirm ตอบ "ยกเลิก" โดยที่เราไม่ได้ตั้งใจ
- **ใช้ `alert` ของแอปเป็น `role="alert"`**: คนละอย่างกัน `role="alert"` คือ element ในหน้า ส่วน `alert()` คือกล่องของ browser

## หน้าในแอปที่ใช้

**`/playground/dialogs`** ปุ่ม "แสดง alert" (`นี่คือ alert`), "แสดง confirm" (`ยืนยันใช่ไหม?` -> `ผลลัพธ์: ตกลง` / `ผลลัพธ์: ยกเลิก`), "แสดง prompt" (`กรุณาใส่ชื่อของคุณ` -> `สวัสดี, {ชื่อ}` หรือ `ผลลัพธ์: ยกเลิก`) ผลลัพธ์อยู่ใน `role="status"`
**`/products`** ปุ่ม "เพิ่มลงตะกร้า" ในการ์ดสินค้า
**`/cart`** รายการใน `<ul aria-label="สินค้าในตะกร้า">` แต่ละรายการมีปุ่ม "ลบ" ที่ถาม confirm; ตะกร้าว่างแสดง "ตะกร้าของคุณยังว่างอยู่"

## วิธีรันบทนี้

```bash
pnpm test 25-dialogs
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

## แบบฝึกหัดในบทนี้

1. confirm กดตกลง ได้ "ผลลัพธ์: ตกลง" และข้อความ dialog "ยืนยันใช่ไหม?"
2. confirm กดยกเลิก ได้ "ผลลัพธ์: ยกเลิก"
3. prompt ตอบ "สมชาย" ได้ "สวัสดี, สมชาย"
4. prompt กดยกเลิก ได้ "ผลลัพธ์: ยกเลิก"
5. ลบแก้วกาแฟออกจากตะกร้าแต่กดยกเลิก ของต้องยังอยู่

## อ่านเพิ่ม

- [Dialogs](https://playwright.dev/docs/dialogs)
- [Dialog (API)](https://playwright.dev/docs/api/class-dialog)
