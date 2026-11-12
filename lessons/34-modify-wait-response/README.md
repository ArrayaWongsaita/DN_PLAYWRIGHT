# บทที่ 34: แก้ response, ทำให้ request ล้มเหลว, รอ response และ request

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- ขอข้อมูลจริงด้วย `route.fetch()` แล้วแก้ response ก่อนส่งให้หน้าด้วย `route.fulfill({ response, json })`
- ทำให้คำขอล้มเหลวเหมือนเน็ตหลุดด้วย `route.abort()` และเลิกดักด้วย `page.unroute`
- รอและอ่าน response / request ที่เกิดขึ้นจริงด้วย `page.waitForResponse` และ `page.waitForRequest` (สร้าง promise ก่อนกดเสมอ)
- แก้คำขอก่อนส่งถึง server ด้วย `route.continue({ postData })`

## เชื่อมกับที่รู้แล้ว

บท 33 เราตอบแทน server ทั้งหมดด้วยข้อมูลที่แต่งเอง ซึ่งมีข้อเสียคือต้องแต่งข้อมูลให้ครบรูปแบบ และข้อมูลอาจไม่ตรงกับของจริงเมื่อ API เปลี่ยน บทนี้เรียนวิธีที่ "เอาของจริงเป็นฐานแล้วแก้นิดเดียว" และวิธี "ดูของจริงที่ผ่านไป" โดยไม่แตะต้องข้อมูล

เทียบกับ Jest: `route.fetch` คล้ายการเรียกฟังก์ชันจริงแล้วแก้ผลลัพธ์ (เหมือน `jest.spyOn` แล้วไม่ใช้ค่าที่ spy คืนตรงๆ) ส่วน `waitForRequest` ใช้ตรวจว่า "หน้าเรียก API ถูกต้องไหม" เหมือน `expect(fn).toHaveBeenCalledWith(...)` ของ mock function

## เนื้อหา

### 1. route.fetch และ route.fulfill({ response }): ของจริงแต่แก้นิดเดียว

```ts
await page.route("**/api/products*", async (route) => {
  const response = await route.fetch();   // ส่งคำขอเดิมไป server จริง
  const json = await response.json();     // อ่าน body เป็น object
  json.products[0].price = 1;             // แก้เฉพาะที่ต้องการ
  await route.fulfill({ response, json }); // ตอบให้หน้าด้วย response เดิม แต่ body ใหม่
});
```

- `route.fetch()` ส่งคำขอที่ถูกดักอยู่ไปที่ server จริงแล้วคืน `APIResponse` (ใช้ `status()`, `headers()`, `json()`, `text()` ได้ เหมือนบท 36)
- `route.fulfill({ response, json })`: ใส่ `response` เพื่อใช้ status และ header ของ response นั้นเป็นฐาน แล้วทับ body ด้วย `json` (หรือ `body`) ที่เราให้
- ข้อดีเมื่อเทียบกับบท 33: สินค้าส่วนที่เหลือเป็นข้อมูลจริงของ server เราแก้เฉพาะที่เกี่ยวกับ test ถ้า API เพิ่ม field ใหม่ ข้อมูลที่ mock ยังครบโดยอัตโนมัติ
- ข้อสังเกต: การหาสินค้าด้วยลำดับ (`products[0]`) ผูกกับลำดับของ API ถ้าเป็นไปได้ให้หาด้วย `id` (`json.products.find(...)`) แบบที่ทำในข้อ 1
- TypeScript: `response.json()` คืน `any` จึงแก้ฟิลด์ได้ตรงๆ แต่ถ้าใช้ `find((p) => ...)` ต้องบอกชนิดของ `p` เอง เช่น `(p: { id: string }) => p.id === "p03"`

### 2. route.abort: ทำให้คำขอล้มเหลว

```ts
await page.route("**/api/products*", (route) => route.abort());
```

`abort()` ทำให้คำขอล้มเหลวโดยไม่มี response เลย (เหมือนเน็ตหลุด) ฝั่งหน้า `fetch` จะ reject (เกิด error) ต่างจาก `fulfill({ status: 500 })` ที่ยังมี response กลับมาแต่เป็น error หน้า `/products` ถือทั้งสองอย่างเป็น "โหลดไม่สำเร็จ" เหมือนกัน (แสดง alert เดียวกัน) แต่แอปจริงหลายแอปแยกสองกรณีนี้ ควรทดสอบทั้งคู่

`abort()` รับรหัสสาเหตุได้ เช่น `"failed"` (ค่าเริ่มต้น), `"connectionrefused"`, `"timedout"` ตามรายการในเอกสาร Route API

**เลิกดัก** ด้วย `page.unroute(pattern)` โดย pattern ต้องตรงกับที่ตอนตั้ง: คำขอหลังจากนั้นไปถึง server จริง เหมาะกับสถานการณ์ "พังก่อนแล้วดีขึ้น" (ข้อ 3) ทางเลือกคือใช้ตัวนับใน handler แบบบท 33

### 3. page.waitForResponse: รอ response ที่เกิดจากการกด

```ts
const responsePromise = page.waitForResponse(
  (r) => r.url().includes("/api/cart") && r.request().method() === "POST" && r.status() === 201,
);
await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
const response = await responsePromise;
```

กฎสำคัญที่สุดของบทนี้: **สร้าง promise ก่อนกด แล้วค่อย `await` หลังกด** ไม่ใช่เขียน `await page.waitForResponse(...)` หลัง `click()`

เหตุผล: `waitForResponse` ดักฟังเฉพาะ response ที่ "มาหลังจากเริ่มฟัง" ถ้าเริ่มฟังหลังกด response อาจมาถึงแล้วในช่วงที่รอ `click()` เสร็จ เราลองเขียนแบบผิด (`click` แล้วค่อย `waitForResponse`) 10 รอบบนหน้านี้ พลาด response ไป 2 รอบจาก 10 (หมดเวลารอ) ความผิดพลาดแบบนี้เป็น flaky test ตัวจริง: ผ่านบ้างพังบ้างตามจังหวะเครื่อง

ส่วนประกอบ:

- argument ตัวแรกเป็น URL pattern (glob เหมือน `page.route`), regular expression หรือ **ฟังก์ชัน predicate** รับ `response` แล้วคืน `true/false` ตัวอย่างใช้ predicate เพื่อเจาะจงทั้ง path, method และ status
- `response.url()`, `response.status()`, `response.ok()`, `await response.json()`, `response.request()` (กลับไปดูคำขอที่ทำให้เกิด response นี้ได้)
- ใช้เมื่อ: อยากตรวจเนื้อหาที่ server ตอบ (ซึ่งหน้าจออาจไม่แสดง) หรืออยากรอให้การทำงานฝั่ง server จบก่อนตรวจต่อ
- ถ้าหน้าจอเปลี่ยนให้เห็นอยู่แล้ว (เช่นข้อความ "เพิ่ม ... ลงตะกร้าแล้ว") ให้ตรวจที่หน้าจอด้วย `expect` ก่อน เพราะนั่นคือสิ่งที่ผู้ใช้เห็นจริง `waitForResponse` ใช้เสริมเมื่อจำเป็น ไม่ต้องใส่ทุก test
- ฟังก์ชัน predicate ที่แคบเกินไปทำให้ไม่เคยตรง (หมดเวลา) และกว้างเกินไปจับ response ผิดตัว เช่น `includes("/api/cart")` เฉยๆ จะตรงกับ GET ด้วย จึงเพิ่มเงื่อนไข method และ status

### 4. page.waitForRequest: ตรวจสิ่งที่หน้าส่งออกไป

```ts
const requestPromise = page.waitForRequest((r) => r.url().includes("/api/cart") && r.method() === "POST");
await card.getByRole("button", { name: "เพิ่มลงตะกร้า" }).click();
const request = await requestPromise;
expect(request.postDataJSON()).toEqual({ productId: "p06", quantity: 1 });
```

หลักการเดียวกับ `waitForResponse` (สร้างก่อนกด) แต่ได้ object `Request`: `url()`, `method()`, `headers()`, `postData()` (ข้อความดิบ) และ `postDataJSON()` (แปลงเป็น object ให้ ใช้เมื่อ body เป็น JSON) ใช้ตรวจว่า "หน้าส่งข้อมูลถูกต้องไหม" ซึ่งหน้าจอไม่ได้บอก เช่นส่งรหัสสินค้าถูกตัวหรือไม่

### 5. route.continue({ postData }): แก้คำขอก่อนส่ง

```ts
await page.route("**/api/cart", (route) =>
  route.continue({ postData: JSON.stringify({ productId: "p06", quantity: 2 }) }),
);
```

`route.continue()` ส่งคำขอไป server จริง ใส่ตัวเลือกเพื่อเปลี่ยนบางส่วนได้: `postData`, `headers`, `url`, `method` ในข้อ 5 หน้าส่ง `quantity: 1` แต่ server ได้รับ 2 เราลองแล้ว: จำนวนบนไอคอนตะกร้าเป็น 2 ใช้ทดสอบเรื่อง "server จัดการข้อมูลที่ผิดปกติอย่างไร" หรือจำลองการส่งข้อมูลที่ UI ปกติส่งไม่ได้

### เลือกใช้อะไรดี

| ต้องการ | ใช้ |
|---|---|
| ตอบข้อมูลที่แต่งเองทั้งหมด (รายการว่าง, error) | `route.fulfill({ json })` (บท 33) |
| ข้อมูลจริงแต่แก้บางค่า | `route.fetch()` + `route.fulfill({ response, json })` |
| จำลองเน็ตหลุด | `route.abort()` |
| แก้คำขอก่อนส่ง | `route.continue({ ... })` |
| แค่ดูว่าเกิดคำขอ/คำตอบอะไร | `waitForRequest` / `waitForResponse` (ไม่ต้องใช้ route) |

## จุดที่มักพลาด

- **สร้าง `waitForResponse`/`waitForRequest` หลังกด**: อาจพลาดไปแล้ว (เราวัดได้ 2/10) ให้สร้าง promise ก่อนกดแล้ว `await` ทีหลัง
- **ลืม `await` ที่ promise** (หรือไม่ `await` เลย): test ผ่านโดยไม่ได้ตรวจอะไร (ดู no-floating-promises ในบท 03)
- **predicate ไม่ตรงคำขอจริง**: ตั้งใจรอ POST แต่เงื่อนไขเขียนให้ status 200 ขณะที่ server ตอบ 201 จึงหมดเวลา ตรวจค่าจริงด้วย trace หรือ `console.log(r.url(), r.status())` ใน predicate
- **จับ response ของการโหลดครั้งแรก**: เช่น รอ `/api/products` ตอนค้นหา แต่ได้ response ของการโหลดหน้า ให้เพิ่มเงื่อนไขที่แยกได้ เช่น `q=`
- **กดก่อนหน้าพร้อม**: ปุ่มบนหน้าที่ใช้ React ผูกการกดหลัง hydrate ถ้ากดเร็วเกินไปอาจไม่เกิดคำขอเลย และ `waitForResponse` หมดเวลา ในหน้า `/products` เมื่อการ์ดสินค้าขึ้นแล้วแปลว่าหน้าพร้อม จึงรอการ์ดก่อนกดทุกครั้ง
- **`route.fetch()` โดยไม่ใช้ผลลัพธ์**: ถ้าเรียก `fetch` แล้วไม่ `fulfill`/`continue` คำขอค้างเหมือนบท 33
- **ใช้ `fulfill({ json })` แทน `fulfill({ response, json })` เมื่อต้องการคง header เดิม**: ได้ header ใหม่ที่ Playwright ตั้งให้ ซึ่งมักพอใช้ แต่ถ้าต้องคง header ของ server (เช่น cookie) ให้ใส่ `response`
- **`unroute` ด้วย pattern ไม่ตรง**: ไม่เลิกดักอะไรเลย ใช้สตริงเดียวกับตอน `route`

## หน้าในแอปที่ใช้

**`/products`**: โหลดรายการด้วย `GET /api/products?q&category&sort` ฝั่ง browser การ์ดสินค้าขึ้นหลังโหลดเสร็จ (ใช้เป็นสัญญาณว่าหน้าพร้อม) ช่อง "ค้นหาสินค้า" กด Enter เพื่อค้นหา ปุ่ม "เพิ่มลงตะกร้า" ในแต่ละการ์ดส่ง `POST /api/cart` ด้วย body `{ productId, quantity: 1 }` และตอบ 201 พร้อมสรุปตะกร้า (`items`, `count`, `subtotal`, `total`, ...) หลังสำเร็จหน้าแสดง `role="status"` `เพิ่ม "{ชื่อสินค้า}" ลงตะกร้าแล้ว` และอัปเดตจำนวนใน `data-testid="cart-count"` ของ header

## วิธีรันบทนี้

```bash
pnpm test 34-modify-wait-response
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

## แบบฝึกหัดในบทนี้

1. แก้ราคาเมาส์ไร้สายเป็น 1 บาท (หาด้วย `id`)
2. รอ response ของการค้นหา แล้วตรวจ status และ `total`
3. ทำให้คำขอล้มเหลวด้วย `abort` แล้วเลิกดักและกด "ลองใหม่"
4. ตรวจ body ของคำขอเพิ่มลงตะกร้าด้วย `waitForRequest`
5. เปลี่ยนจำนวนในคำขอก่อนส่งด้วย `route.continue`

## อ่านเพิ่ม

- [Network (ดักและแก้ response, รอ request/response)](https://playwright.dev/docs/network)
- [Mock APIs](https://playwright.dev/docs/mock)
- [Route API](https://playwright.dev/docs/api/class-route)
