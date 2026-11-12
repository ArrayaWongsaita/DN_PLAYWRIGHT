# บทที่ 14: Trace Viewer 🏫

## จบบทนี้แล้วทำอะไรได้

- เปิด trace ของ test ที่พัง ทั้งจาก HTML report และจากคำสั่ง `show-trace`
- ไล่ดู test ทีละ action พร้อม DOM snapshot ก่อนและหลังแต่ละขั้น
- ใช้แท็บ Network, Console และ Errors หาสาเหตุที่ test พัง
- แก้ test ที่พังโดยอาศัยหลักฐานจาก trace ไม่ใช่การเดา

## เชื่อมกับที่รู้แล้ว

บท 02 สอนเปิด HTML report และอ่านข้อความ error บทนี้ไปต่อจากนั้น เมื่อข้อความ error อย่างเดียวบอกไม่พอว่า "หน้าตอนนั้นหน้าตาเป็นอย่างไร" trace คือบันทึกของ test ทั้งรอบ เหมือนวิดีโอที่คลิกดูทีละขั้นได้ และจิ้มดู HTML ของหน้าในแต่ละขณะได้ด้วย ส่วนบท 13 ให้ความรู้เรื่อง assertion ที่รอ ซึ่งจะช่วยในข้อ 2

## เนื้อหา

### trace คืออะไร และมีเมื่อไร

trace คือไฟล์ `trace.zip` ที่เก็บ action ทุกขั้นของ test, DOM snapshot ก่อน/ระหว่าง/หลังแต่ละ action, ภาพหน้าจอ, console, และคำขอ network repo นี้ตั้งค่าไว้ใน `playwright.shared.ts` ว่า

```ts
trace: "retain-on-failure",
```

หมายถึง **บันทึก trace ทุก test แต่เก็บไว้เฉพาะ test ที่พัง** ผ่านแล้วไฟล์จะถูกลบทิ้ง ถ้าอยากได้ trace ของ test ที่ผ่านด้วย (เช่นตัวอย่างที่ 1) ให้รันพร้อม `--trace on`

```bash
pnpm test 14-trace-viewer --trace on
```

### เปิด trace จาก HTML report

หลังรันทุกครั้ง Playwright สร้าง HTML report ให้ (`open: "never"` ไม่เปิดเอง)

```bash
pnpm report
```

คำสั่งนี้เปิดเว็บ report ที่ `http://localhost:9323` ในเบราว์เซอร์ ให้ทำดังนี้

1. คลิกชื่อ test ที่พัง (สีแดง) เพื่อเข้าหน้ารายละเอียด
2. เลื่อนลงจนเจอส่วน **Traces** คลิกภาพ trace เพื่อเปิด Trace Viewer (ในหน้ารายการ test จะมีไอคอน trace ข้างชื่อไฟล์ให้คลิกเปิดได้เช่นกัน)

ปิด report ด้วย `Ctrl+C` ในเทอร์มินัลที่รัน `pnpm report`

### เปิด trace ด้วยคำสั่ง show-trace

ถ้า test พัง ข้อความท้ายแต่ละ test ในเทอร์มินัลจะบอกเส้นทางของ trace ให้พร้อมคำสั่งสำเร็จรูป:

```
attachment #3: trace (application/zip) ───
test-results/14-trace-viewer-.../trace.zip
Usage:

    pnpm exec playwright show-trace test-results/14-trace-viewer-.../trace.zip
```

คัดลอกบรรทัด `pnpm exec playwright show-trace ...` นั้นไปรันได้เลย:

```bash
pnpm exec playwright show-trace test-results/ชื่อโฟลเดอร์ที่ขึ้นในเทอร์มินัล/trace.zip
```

เส้นทางมักยาวและมีภาษาไทยปนอยู่ (เพราะชื่อโฟลเดอร์มาจากชื่อ test) คัดลอกมาจากเทอร์มินัลจะสะดวกกว่าพิมพ์เอง เปิดแล้วจะได้หน้าต่าง Trace Viewer แบบเดียวกับที่เปิดจาก report

### ส่วนต่างๆ ของ Trace Viewer

| ส่วน | ใช้ดูอะไร |
|---|---|
| **Actions** (ซ้าย) | รายการคำสั่งทุกขั้น พร้อม locator และเวลาที่ใช้ ขั้นที่พังมีสีแดง คลิกที่ขั้นไหนก็ดูสถานะของหน้า ณ ตอนนั้นได้ |
| **DOM snapshot** (กลาง) | หน้าเว็บจริงในขั้นที่เลือก เลือกแท็บ **Before** (ก่อนทำ) / **Action** (ตอนทำ เห็นตำแหน่งที่คลิก) / **After** (หลังทำ) คลิกดูและเปิด DevTools ตรวจ HTML ได้ |
| **Timeline** (บน) | ไล่ภาพหน้าจอตามเวลา ลากเมาส์เลือกช่วงเวลาเพื่อกรอง Console/Network ให้ตรงช่วงนั้น |
| **Call / Log** | พารามิเตอร์ของ action และ log ว่า Playwright รออะไรอยู่ (เช่น `waiting for getByRole(...)`) |
| **Errors** | ข้อความ error พร้อมบรรทัดของโค้ด |
| **Console** | ข้อความ `console.log` / error จากหน้าเว็บและจาก test |
| **Network** | คำขอทั้งหมด พร้อม method, status, body ของ request/response |
| **Source** | โค้ดของ test ที่บรรทัดของ action ที่เลือกจะถูกไฮไลต์ |

### วิธีหาสาเหตุ (ลำดับที่แนะนำ)

1. คลิก action สีแดงใน Actions แล้วอ่านแท็บ **Errors** กับ **Log**
2. ดู DOM snapshot ของขั้นนั้น: สิ่งที่ test บอกว่าหาเจอ/ไม่เจอ มีอยู่ในหน้าจริงหรือเปล่า ชื่อปุ่ม ข้อความ และสถานะตรงกับที่เขียนหรือไม่
3. ย้อนไปขั้นก่อนหน้าด้วย **Before/After** เพื่อดูว่าหน้าเปลี่ยนไปตอนไหน
4. เปิดแท็บ **Network** ดูว่าคำขอล้มเหลว (4xx/5xx) หรือไม่
5. ค่อยแก้โค้ด แล้วรันใหม่

## จุดที่มักพลาด

- **แก้ test ตามที่เดาโดยไม่เปิด trace**: ได้ test ที่ผ่านด้วยเหตุผลผิด เปิด trace ยืนยันสาเหตุก่อนแก้ทุกครั้ง
- **หา trace ไม่เจอเพราะ test ผ่าน**: `retain-on-failure` เก็บเฉพาะ test ที่พัง ใช้ `--trace on` ถ้าอยากดูของ test ที่ผ่าน
- **ผิดเส้นทางตอนพิมพ์เอง**: ชื่อโฟลเดอร์ใน `test-results` มาจากชื่อ test คัดลอกจากเทอร์มินัลแทน
- **คิดว่า `pnpm report` ค้างหรือเสีย**: มันเป็นเว็บเซิร์ฟเวอร์ที่ทำงานค้างไว้ กด `Ctrl+C` เมื่อดูเสร็จ
- **เปิด trace ของรอบเก่า**: `test-results` และ `playwright-report` ถูกเขียนทับทุกครั้งที่รัน ถ้ารันใหม่หลังแก้ test อย่าลืมเปิดรอบล่าสุด

## หน้าในแอปที่ใช้

- **`/products/p01`**: ปุ่ม "เพิ่มลงตะกร้า" และข้อความ "เพิ่มลงตะกร้าแล้ว"
- **`/playground/slow`**: ปุ่ม "ไปหน้าถัดไป" รอ 1 วินาทีแล้วไป `/playground/slow/done` (h1 "เสร็จแล้ว")
- **`/products/p07`**: หมอนอิงลายแมว คงเหลือ 5 ชิ้น ใช้ในข้อ 3

## วิธีรันบทนี้

ตัวอย่างที่ 1 (ผ่าน) พร้อมเก็บ trace:

```bash
pnpm test 14-trace-viewer --trace on
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `1 passed` และ `3 skipped` (ข้อ 1–3 เป็น `test.fixme` ที่ตั้งใจให้พังเมื่อเปิดใช้) จากนั้นเปิด report ด้วย `pnpm report` แล้วลองเปิด trace ของตัวอย่างที่ 1 ดูว่าแต่ละ action มี DOM snapshot ต่างกันอย่างไร

ทำแบบฝึกหัดทีละข้อ ข้อละหนึ่งรอบ:

1. เปลี่ยน `test.fixme` ของข้อนั้นเป็น `test` (ทีละข้อ)
2. รันเฉพาะข้อนั้น แล้วดูว่าพัง:

```bash
pnpm test 14-trace-viewer -g "ข้อ 1"
```

3. เปิด trace จาก report (`pnpm report`) หรือคัดลอกคำสั่ง `show-trace` จากเทอร์มินัล หาสาเหตุ แก้โค้ด รันซ้ำจนผ่าน
4. ทำข้อ 2 (`-g "ข้อ 2"`) และข้อ 3 (`-g "ข้อ 3"`) แบบเดียวกัน

## แบบฝึกหัดในบทนี้

1. ปุ่มที่ test หาไม่เจอ: ดู DOM snapshot ว่าปุ่มชื่ออะไร
2. URL ยังเป็นหน้าเดิม: ดู Actions ว่า action ถูกทำกี่ขั้น และบรรทัดตรวจ URL รอหรือไม่
3. ข้อความที่รอไม่มีวันขึ้น: ดูแท็บ Network (status ของคำขอ) และข้อความที่หน้าแสดงจริง

## อ่านเพิ่ม

- [Trace viewer](https://playwright.dev/docs/trace-viewer)
- [Trace viewer (แนะนำ)](https://playwright.dev/docs/trace-viewer-intro)
- [Reporters: HTML reporter](https://playwright.dev/docs/test-reporters#html-reporter)
