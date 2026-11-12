# บทที่ 35: บันทึกและเล่นซ้ำ network ด้วยไฟล์ HAR

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- อธิบายได้ว่า HAR คืออะไร และเปิดอ่านไฟล์ HAR ได้
- เล่นซ้ำ network จากไฟล์ HAR ด้วย `page.routeFromHAR` แทนการเรียก server จริง
- บันทึก HAR ใหม่จากแอปจริงด้วย `routeFromHAR(..., { update: true })`
- เลือกตัวเลือก `notFound`, `url`, `updateContent` ได้ถูกต้อง และรู้ข้อควรระวังเรื่องข้อมูลสำคัญในไฟล์ HAR

## เชื่อมกับที่รู้แล้ว

บท 33 เราเขียนข้อมูลตอบกลับเองทีละตัวด้วย `route.fulfill` ซึ่งตรงไปตรงมา แต่ถ้าหน้ามีคำขอหลายอันหรือข้อมูลซับซ้อน การแต่งเองทั้งหมดเหนื่อยและผิดรูปได้ง่าย HAR เป็นทางลัด: **ให้แอปจริงตอบครั้งเดียวแล้วเก็บไว้** ครั้งต่อไปเล่นซ้ำจากไฟล์ เทียบกับ Jest ได้ใกล้เคียงกับ "snapshot ของคำตอบ API" ที่บันทึกครั้งแรกแล้วใช้เป็นข้อมูลทดสอบต่อไป

## เนื้อหา

### 1. HAR คืออะไร

HAR (HTTP Archive) คือไฟล์ JSON มาตรฐานที่เก็บบันทึกคำขอ network (เบราว์เซอร์ทั่วไปส่งออกไฟล์นี้ได้จาก DevTools แท็บ Network) โครงหลักคือ:

```json
{
  "log": {
    "entries": [
      {
        "request":  { "method": "GET", "url": "http://localhost:3100/api/products?category=books", "headers": [] },
        "response": { "status": 200, "headers": [], "content": { "mimeType": "application/json", "text": "{\"products\":[...]}" } }
      }
    ]
  }
}
```

แต่ละ `entry` คือคำขอหนึ่งอัน มี `request` (method, url, headers) และ `response` (status, headers, `content.text` คือ body) ไฟล์ที่ commit ไว้ในบทนี้คือ `lessons/35-har/hars/products.har` ลองเปิดอ่านดูได้เลย มี 2 entries: `GET /api/products?` (รายการทั้งหมด 10 ชิ้น) และ `GET /api/products?category=books` (หมวดหนังสือ 3 ชิ้น)

ไฟล์นี้อัดจากแอปจริงด้วยวิธีในหัวข้อ 3 แล้ว **ตัด header ที่ไม่จำเป็นออก** (ดูหัวข้อ 5)

### 2. เล่นซ้ำ: page.routeFromHAR

```ts
await page.routeFromHAR("lessons/35-har/hars/products.har", { url: "**/api/products*" });
await page.goto("/products");
```

- เรียก **ก่อน `goto`** เหมือน `page.route`
- `url` (glob หรือ regular expression): ใช้ HAR เฉพาะคำขอที่ URL ตรง pattern นี้ คำขออื่นไปถึง server จริงตามปกติ ถ้าไม่ใส่ `url` จะพยายามเล่นซ้ำจาก HAR ทุกคำขอ รวมถึงหน้าเว็บและรูป เราลองแล้ว `page.goto("/products")` ล้มเหลวด้วย `net::ERR_FAILED` เพราะหน้า HTML ไม่อยู่ใน HAR ซึ่งไม่ใช่สิ่งที่ต้องการ
- Playwright จับคู่คำขอกับ entry ด้วย **URL และ method** ซึ่ง URL ต้องตรงกัน รวมถึง query string เช่น `/api/products?category=books` ตรงกับ entry ที่ 2 แต่ `/api/products?q=เมาส์` ไม่มีใน HAR (เราลองเพิ่มพารามิเตอร์ `&sort=price-asc` ต่อท้าย `?category=books` แล้วก็ไม่พบเช่นกัน)
- **path ของไฟล์ HAR นับจากโฟลเดอร์ที่รัน test (current working directory)** ไม่ใช่จากโฟลเดอร์ของไฟล์ test เราลองรันจากโฟลเดอร์ `lessons` (ด้วย `pnpm exec playwright test --config ../playwright.config.ts 35-har`) แล้วได้ error `ENOENT: no such file or directory, open 'lessons/35-har/hars/products.har'` ดังนั้นในคอร์สนี้ให้รัน test จากรากโปรเจกต์เสมอ (ตามที่ README ทุกบทบอก)

#### notFound: คำขอที่ไม่มีใน HAR

| ค่า | ผล |
|---|---|
| `"abort"` (ค่าเริ่มต้น) | คำขอที่ไม่พบใน HAR ล้มเหลว หน้าแสดง "โหลดสินค้าไม่สำเร็จ" (ตัวอย่างที่ 2) |
| `"fallback"` | คำขอที่ไม่พบไปถึง server จริง (หรือ handler ตัวถัดไป) (ข้อ 3) |

ค่าเริ่มต้น `abort` มีประโยชน์: ถ้าแอปส่งคำขอที่คุณไม่ได้คาดไว้ test จะล้มชัดเจน แทนที่จะแอบไปเรียก server จริงโดยไม่รู้ตัว

### 3. บันทึก: update: true

```ts
await page.routeFromHAR("lessons/35-har/hars/my-products.local.har", {
  url: "**/api/products*",
  update: true,
  updateContent: "embed",
});
await page.goto("/products");
// ... ทำให้หน้าส่งคำขอที่ต้องการอัด ...
await page.context().close(); // ไฟล์ถูกเขียนตอน context ปิด
```

ตัวเลือกเดียวกัน แต่ใส่ `update: true` ความหมายเปลี่ยนจาก "เล่นซ้ำ" เป็น "**ส่งไป server จริงแล้วบันทึกลงไฟล์**" (ไม่ได้ตอบจากไฟล์)

| ตัวเลือก | ความหมาย |
|---|---|
| `update: true` | บันทึกแทนที่จะเล่นซ้ำ ไฟล์ถูกเขียนเมื่อ `context.close()` ถูกเรียก (fixture `page` ของ test จะปิด context ให้เองตอนจบ test) ถ้าต้องอ่านไฟล์ภายใน test เดียวกันให้เรียก `await page.context().close()` เอง |
| `updateContent` | `"attach"` (ค่าเริ่มต้น): เก็บ body ของ response เป็นไฟล์แยก ตั้งชื่อด้วยรหัส hash `.json` ไว้โฟลเดอร์เดียวกับ HAR (เราลองรันแล้วได้ไฟล์ชื่อแบบ `15ad55d6....json` ข้างๆ) / `"embed"`: ใส่ body ไว้ในไฟล์ HAR เลย อ่านและแก้ง่ายกว่า บทนี้ใช้ `embed` |
| `updateMode` | `"minimal"` (ค่าเริ่มต้น) เก็บเฉพาะที่ใช้เล่นซ้ำ / `"full"` เก็บทุกอย่าง (เวลา ขนาด ฯลฯ) |

หมายเหตุจากที่เราลอง: อัดซ้ำลงไฟล์ชื่อเดิม ไฟล์ถูกเขียนทับ (entries ไม่เพิ่มซ้อน) ตอนอัดด้วย `update: true` แอปใช้ server จริง จึงต้องเปิดแอปอยู่

**วิธีอื่นในการอัด HAR** (ไม่ต้องเขียน test):

- ตัวเลือก context `recordHar: { path: "...har", urlFilter: "**/api/**" }` (ใน `browser.newContext` หรือ `use` ในไฟล์ config) อัดคำขอระหว่างที่ context เปิด และเขียนไฟล์ตอนปิด
- คำสั่ง `pnpm exec playwright codegen --save-har=products.har --save-har-glob="**/api/**" http://localhost:3100` อัดขณะคุณคลิกเองในหน้าเว็บ

### 4. เมื่อไหร่ควรใช้ HAR และข้อจำกัด

| | `route.fulfill` (บท 33) | HAR |
|---|---|---|
| ข้อมูลมาจาก | เราแต่งเอง | แอปจริงตอนอัด |
| เหมาะกับ | สถานการณ์เฉพาะ (ว่าง, 500) | ชุดข้อมูลสมจริงหลายคำขอ, ลดการพึ่ง server ภายนอก |
| ความเสี่ยง | แต่งผิดรูปแบบ | ไฟล์ล้าสมัยเมื่อ API เปลี่ยน |

- **ไฟล์ HAR ล้าสมัยเงียบๆ**: ถ้า API เปลี่ยนรูปแบบ test ที่เล่นซ้ำยังผ่านทั้งที่แอปจริงพังแล้ว (เพราะไม่ได้คุยกับ server จริงเลย) ควรมี test ที่คุยกับ API จริงควบคู่ (บท 36) และอัด HAR ใหม่เป็นระยะ
- **คำขอที่ไม่ตรง URL เป๊ะ**: เปลี่ยน query แม้นิดเดียวก็ไม่พบ entry (ตามหัวข้อ 2)
- **มีสถานะต่อเนื่อง**: HAR จับคู่ด้วย URL/method ถ้าคำขอเดียวกันควรได้คำตอบต่างกันตามสถานะ (เช่น เพิ่มสินค้าแล้วรายการเปลี่ยน) HAR ไม่เหมาะ ใช้ `route.fulfill` ที่มีตัวนับแทน (บท 33)

### 5. ระวังข้อมูลสำคัญในไฟล์ HAR

HAR ที่อัดแบบปกติเก็บ **request header ทั้งหมด** ไว้ด้วย ซึ่งรวมถึง `Cookie` (ในแอปเรามีรหัส session `dn_sid`), `Authorization`, token ของผู้ใช้ และข้อมูล User-Agent ของเครื่องที่อัด เราเปิดไฟล์ที่อัดดิบๆ ดูแล้วพบ `Cookie: dn_sid=...` และ User-Agent จริงอยู่ในไฟล์ ถ้าเอาไฟล์แบบนี้ขึ้น Git คนอื่นจะเห็น (และ token จริงอาจนำไปใช้ได้)

ไฟล์ `products.har` ที่ commit ในบทนี้ จึงผ่านขั้นตอนเหล่านี้: อัดจากแอปจริงด้วย `update: true`, แล้วตัด request header ที่ไม่จำเป็น (เหลือแค่ `Accept`) และ response header (เหลือแค่ `content-type`) ออก แล้วลองเล่นซ้ำว่ายังผ่านเหมือนเดิม (ใช้ได้ เพราะการจับคู่ใช้ URL กับ method เป็นหลัก) หลักปฏิบัติ:

- ตรวจไฟล์ HAR ก่อน commit เสมอ ค้นหาคำว่า `cookie`, `authorization`, `token`, `password`
- ไฟล์ที่อัดเองระหว่างทำแบบฝึกหัดตั้งชื่อลงท้าย `.local.har` ซึ่งอยู่ใน `.gitignore` ของโปรเจกต์ จะไม่ถูก commit โดยไม่ตั้งใจ
- ถ้าต้องใช้ HAR ร่วมกันทั้งทีม ให้อัดจากบัญชีทดสอบที่ไม่มีสิทธิ์จริง

## จุดที่มักพลาด

- **path ผิดโฟลเดอร์**: path นับจาก cwd ถ้ารัน test จากโฟลเดอร์อื่นจะได้ `ENOENT` (ดูหัวข้อ 2)
- **ลืมเรียก `routeFromHAR` ก่อน `goto`**: คำขอแรกหลุดไป server จริง
- **ไม่ใส่ `url`**: HAR พยายามเล่นซ้ำทุกคำขอ รวมหน้า HTML และรูป คำขอที่ไม่อยู่ใน HAR ถูก abort ทำให้หน้าเว็บไม่ขึ้น
- **คาดว่าเล่นซ้ำจะจับคู่แบบหลวมๆ**: URL ต้องตรงกัน (รวม query) เมื่อไม่พบ ค่าเริ่มต้นคือ abort
- **อัดแล้วไม่ปิด context**: ไฟล์ยังไม่ถูกเขียน (เขียนตอน `context.close()`) ถ้าอ่านไฟล์ใน test เดียวกันต้องเรียก `await page.context().close()` ก่อน
- **ลืม `updateContent: "embed"`**: ได้ไฟล์ `.json` แยกอยู่ข้างๆ ซึ่ง `.gitignore` (`*.local.har`) ไม่ครอบคลุม
- **ลืมว่า `update: true` ต้องมี server จริงเปิดอยู่**: คำขอไปที่แอปจริง
- **commit ไฟล์ HAR ที่มี cookie/token**: ตรวจก่อนเสมอ (หัวข้อ 5)
- **ไฟล์ HAR ล้าสมัย**: อัดใหม่เมื่อ API เปลี่ยน
- **เขียนไฟล์เดียวกันจากหลาย worker พร้อมกัน**: ตอนรันหลายรอบพร้อมกัน (`--repeat-each` กับหลาย worker) ไฟล์ที่ test เขียนควรมีชื่อไม่ชนกัน (แบบฝึกหัดใช้ `testInfo.parallelIndex` ต่อท้ายชื่อ)

## หน้าในแอปที่ใช้

**`/products`**: ดึง `GET /api/products?...` ฝั่ง browser เหมือนบท 33 พารามิเตอร์ที่หน้าส่ง: ไม่มีตัวกรอง = `/api/products?` (มี `?` ท้าย URL แต่ไม่มีพารามิเตอร์), `?category=books` เมื่อเปิด `/products?category=books`, `?q=...` เมื่อค้นหา ลำดับในไฟล์ HAR ที่ commit คือลำดับ "แนะนำ": หูฟังไร้สาย DN Buds, เสื้อยืด DN สีขาว, หมอนอิงลายแมว, ... สมุดโน้ตลายจุด

## วิธีรันบทนี้

```bash
pnpm test 35-har
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped` (ต้องรันจากรากโปรเจกต์ เพราะ path ของไฟล์ HAR นับจากตรงนั้น)

## แบบฝึกหัดในบทนี้

1. เล่นซ้ำ HAR แล้วตรวจชื่อสินค้าแรกและสุดท้าย
2. เล่นซ้ำคำตอบของหมวดหนังสือที่อยู่ใน HAR
3. ให้คำขอที่ไม่อยู่ใน HAR ไปถึง server จริงด้วย `notFound: "fallback"`
4. อัด HAR ของตัวเองด้วย `update: true` ลงไฟล์ `.local.har`
5. แก้เนื้อหาในไฟล์ HAR แล้วเล่นซ้ำ เพื่อพิสูจน์ว่าข้อมูลมาจากไฟล์

## อ่านเพิ่ม

- [Mocking with HAR files](https://playwright.dev/docs/mock#mocking-with-har-files)
- [Record and replay requests](https://playwright.dev/docs/mock#recording-a-har-file)
- [Page.routeFromHAR](https://playwright.dev/docs/api/class-page#page-route-from-har)
