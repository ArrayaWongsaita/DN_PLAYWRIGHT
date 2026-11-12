# บทที่ 27: อัปโหลดและดาวน์โหลดไฟล์ 🏫

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- อัปโหลดไฟล์ด้วย `setInputFiles` จาก path, หลายไฟล์, และ buffer ที่สร้างในโค้ด
- ล้างไฟล์ที่เลือกด้วย `setInputFiles([])`
- ดาวน์โหลดไฟล์ด้วย `page.waitForEvent("download")` แล้วอ่านชื่อและเนื้อหา
- ทดสอบการเปลี่ยนรูปโปรไฟล์ที่หน้า `/account`

## เชื่อมกับที่รู้แล้ว

ใน Supertest เราอัปโหลดด้วย `.attach("avatar", "path/file.png")` ใน Playwright ทำกับ `<input type="file">` ในหน้าจริง ส่วนการดาวน์โหลดใช้แนวคิดเดียวกับบท 26: สร้างตัวรอ event ไว้ก่อนกด แล้วค่อยรับผลทีหลัง

## เนื้อหา

### 1. ไฟล์ตัวอย่าง (fixtures)

ไฟล์ที่ใช้อัปโหลดอยู่ใน `lessons/27-upload-download/fixtures/`: `profile.png` (รูป PNG ขนาด 1x1 พิกเซล), `photo.jpg` (รูป JPG ขนาดเล็กมาก) และ `notes.txt` (ข้อความธรรมดา) ทั้งหมดเล็กมาก เหมาะกับ test ไฟล์ในโค้ดทดสอบอ้างด้วย path แบบไม่ผูกกับเครื่องใคร:

```ts
import path from "node:path";
const fixture = (name: string) => path.join(import.meta.dirname, "fixtures", name);
```

`import.meta.dirname` คือโฟลเดอร์ของไฟล์ spec ที่เขียนบรรทัดนี้ `path.join` ต่อ path ให้ถูกต้องทั้ง macOS และ Windows อย่าเขียน path แบบ `"C:\\Users\\..."` หรือ `"/Users/..."` ตายตัว

### 2. setInputFiles: อัปโหลด

```ts
// ไฟล์เดียว
await page.getByLabel("เลือกไฟล์ (หลายไฟล์ได้)").setInputFiles(fixture("profile.png"));
// หลายไฟล์ (input ต้องมี attribute multiple)
await input.setInputFiles([fixture("profile.png"), fixture("photo.jpg")]);
// ล้างไฟล์ที่เลือก
await input.setInputFiles([]);
// สร้างไฟล์ในโค้ด ไม่ต้องมีไฟล์จริง
await input.setInputFiles({ name: "hello.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
```

- `setInputFiles` ตั้งค่าให้ `<input type="file">` ตรงๆ แล้วทำให้เกิด event `input` และ `change` เหมือนผู้ใช้เลือกไฟล์เอง หน้าเว็บจึงตอบสนองตามปกติ ไม่ต้องคลิกปุ่มเปิดหน้าต่างเลือกไฟล์ของระบบ
- หา input ด้วย label ของมัน (`getByLabel`) เป็นวิธีที่ดีที่สุด
- ถ้าเป็น `<input>` ที่ซ่อนไว้ และมีปุ่มกดเปิด file chooser เอง ก็รอด้วย `page.waitForEvent("filechooser")` ได้ (ไม่ใช้ในบทนี้)
- การระบุ `buffer` ใช้เมื่อไม่อยากเก็บไฟล์จริงใน repo เช่นต้องการไฟล์ขนาดเฉพาะหรือเนื้อหาเฉพาะ `Buffer.from("hello")` ได้ 5 ไบต์

หน้า `/playground/files` แสดงไฟล์ที่เลือกเป็นรายการ `{ชื่อ} ({ขนาด} bytes)` ตรวจด้วย `toHaveText` (ส่ง array ได้เมื่อมีหลายรายการ) และใช้ regex กับขนาดถ้าไม่ต้องการล็อกตัวเลข

### 3. รูปโปรไฟล์ที่ /account

หน้า `/account` ต้อง login ก่อน (ถ้ายังไม่ login จะถูกพาไป `/login`) ช่อง "รูปโปรไฟล์" รับเฉพาะ PNG/JPG ขนาดไม่เกิน 1MB (ตรวจที่เซิร์ฟเวอร์) เลือกไฟล์แล้วหน้าแสดง "ไฟล์ที่เลือก: {ชื่อไฟล์}" กดปุ่ม "บันทึกรูป" แล้วได้ `role="status"` "บันทึกรูปโปรไฟล์แล้ว" ถ้าไฟล์ไม่ผ่านเงื่อนไข จะได้ `role="alert"` ข้อความ "รองรับเฉพาะไฟล์ PNG หรือ JPG ขนาดไม่เกิน 1MB" (ใช้ `getByRole("alert").filter({ hasText: ... })` เหมือนบทก่อนๆ เพราะ Next.js มี alert ว่างๆ ประจำหน้าอยู่แล้ว)

หมายเหตุ: `accept="image/png,image/jpeg"` ของ input เป็นแค่ตัวกรองในหน้าต่างเลือกไฟล์ `setInputFiles` ข้ามตัวกรองนี้ได้ ลองเลือก `notes.txt` ในช่องนี้ดูว่าเซิร์ฟเวอร์ปฏิเสธอย่างไร

### 4. ดาวน์โหลด

```ts
const downloadPromise = page.waitForEvent("download"); // ยังไม่ await
await page.getByRole("link", { name: "ดาวน์โหลดรายการสินค้า (CSV)" }).click();
const download = await downloadPromise;

download.suggestedFilename(); // "products.csv" ชื่อที่เซิร์ฟเวอร์เสนอ (Content-Disposition หรือ attribute download)

// ทางเลือก ก: เก็บสำเนาไว้ใต้ test-results/ แล้วอ่านจากสำเนา (ได้ไฟล์ไว้ดูเองทีหลังด้วย)
const savedPath = testInfo.outputPath("products.csv");
await download.saveAs(savedPath);
const content = await readFile(savedPath, "utf8");

// ทางเลือก ข: ไม่ต้องเก็บสำเนา อ่านจากไฟล์ชั่วคราวที่ Playwright เก็บให้
const content2 = await readFile(await download.path(), "utf8");
```

สองทางเลือกนี้ใช้อย่างใดอย่างหนึ่งก็พอ (ในตัวอย่างของบทใช้ทางเลือก ก ส่วนข้อ 5 ลองทางเลือก ข)

- ลำดับเหมือนบท 26: สร้างตัวรอก่อน กดทีหลัง
- `download.suggestedFilename()` เป็นชื่อไฟล์ ไม่ใช่ path
- `download.path()` คืน path ของไฟล์ชั่วคราวที่ Playwright เก็บไว้ (คืนค่าเป็น Promise ต้อง `await`) ใช้อ่านเนื้อหาได้เลย
- `download.saveAs(path)` คัดลอกไปเก็บที่ที่เราต้องการ ใช้ `testInfo.outputPath("ชื่อไฟล์")` (รับ `testInfo` เป็นอาร์กิวเมนต์ที่สองของฟังก์ชัน test: `async ({ page }, testInfo) => ...`) จะได้ไฟล์ใต้ `test-results/` ซึ่ง git ไม่เก็บอยู่แล้ว **ห้าม commit ไฟล์ที่ test สร้างขึ้นมา**
- อ่านไฟล์ด้วย `readFile` จาก `node:fs/promises` แล้วตรวจเนื้อหาด้วย `expect(...).toContain(...)` (อ่านไฟล์ผ่าน Node ทั้งหมด ไม่ใช่ API ของ Playwright)

ลิงก์ `ดาวน์โหลดรายการสินค้า (CSV)` ได้ไฟล์ `products.csv` (หัวคอลัมน์ `id,name,category,price,stock`) ส่วน `ดาวน์โหลดคู่มือ (TXT)` ได้ `guide.txt` ที่ขึ้นต้นด้วย "คู่มือการใช้งาน DN Shop"

## จุดที่มักพลาด

- **ลืมตั้ง `waitForEvent("download")` ก่อนกด**: test ค้างหรือพลาด event
- **ใส่ path ตายตัวของเครื่องเรา**: ใช้ `path.join(import.meta.dirname, ...)` ให้รันได้ทุกเครื่อง
- **ไฟล์ตัวอย่างใหญ่เกิน 1MB หรือไม่ใช่ PNG/JPG**: เซิร์ฟเวอร์ปฏิเสธรูปโปรไฟล์ (และ repo ไม่ควรเก็บไฟล์ใหญ่)
- **`setInputFiles` กับ input ที่ไม่ใช่ `type="file"`**: error ให้ตรวจ locator
- **เก็บไฟล์ที่ดาวน์โหลดไว้ใน repo**: เก็บใต้ `test-results/` (`testInfo.outputPath`) เท่านั้น
- **ลืม `await download.path()`**: ได้ Promise ไม่ใช่ path
- **ขนาดไฟล์ในข้อความไม่ตรงบนเครื่องอื่น**: ใช้ regex `\d+ bytes` ถ้าไม่จำเป็นต้องล็อกตัวเลข

## หน้าในแอปที่ใช้

**`/playground/files`** ช่อง "เลือกไฟล์ (หลายไฟล์ได้)" แสดงผลใน `<ul aria-label="ไฟล์ที่เลือก">` ปุ่ม "ล้างไฟล์" ลิงก์ "ดาวน์โหลดรายการสินค้า (CSV)" และ "ดาวน์โหลดคู่มือ (TXT)"
**`/login`** อีเมล `user@dnshop.test` รหัสผ่าน `password123`
**`/account`** ช่อง "รูปโปรไฟล์" ปุ่ม "บันทึกรูป" และ `role="status"` "บันทึกรูปโปรไฟล์แล้ว"

## วิธีรันบทนี้

```bash
pnpm test 27-upload-download
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `6 skipped`

## แบบฝึกหัดในบทนี้

1. เลือกไฟล์ `notes.txt` (เหมือนตัวอย่างที่ 1)
2. เลือกหลายไฟล์พร้อมกัน
3. ล้างไฟล์ที่เลือกด้วย `setInputFiles([])` และด้วยปุ่ม "ล้างไฟล์"
4. อัปโหลดจาก buffer (ชื่อ `hello.txt` เนื้อหา `hello`)
5. ดาวน์โหลด `guide.txt` และตรวจเนื้อหา
6. เปลี่ยนรูปโปรไฟล์ที่ `/account` (login ก่อน)

## อ่านเพิ่ม

- [Upload files](https://playwright.dev/docs/input#upload-files)
- [Downloads](https://playwright.dev/docs/downloads)
- [Download (API)](https://playwright.dev/docs/api/class-download)
