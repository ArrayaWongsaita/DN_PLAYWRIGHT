# บทที่ 36: ทดสอบ API ตรงๆ ด้วย fixture request

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- ส่งคำขอ HTTP (GET, POST, PATCH, DELETE) ไปที่ API ด้วย fixture `request` โดยไม่เปิดหน้าเว็บ
- ตรวจ response ด้วย `expect(res).toBeOK()`, `res.status()`, `await res.json()`
- ทดสอบทางไม่สำเร็จ: status 400, 401, 403, 404, 409 และข้อความ error
- login ผ่าน API แล้วใช้ cookie ที่ `request` เก็บไว้ในคำขอต่อไป

## เชื่อมกับที่รู้แล้ว

ถ้าเคยเรียนบท 16-17 ของ repo Jest ต้นแบบ (`DN_JEST_SUPERTEST`) บทนี้คือเรื่องเดียวกัน: ทดสอบ API โดยส่งคำขอแล้วตรวจ status กับ body ต่างกันแค่เครื่องมือ ตารางเทียบ (โค้ดฝั่ง Supertest ยกจากแบบฝึกหัดและไฟล์ `app.ts` ในบท 16-17 ของ repo นั้น ยกเว้นแถวเรื่อง cookie ที่อ้างจากวิธีใช้ `request.agent` ของ Supertest):

| เรื่อง | Supertest (Jest บท 16-17) | Playwright `request` |
|---|---|---|
| ส่ง GET | `await request(app).get("/health")` | `await request.get("/api/health")` |
| ส่ง POST พร้อม body | `request(app).post("/users").send({ name: "Nida" })` | `request.post("/api/cart", { data: { productId: "p01" } })` |
| อ่าน status | `response.status` (property) | `res.status()` (เมธอด) หรือ `res.ok()` |
| อ่าน body | `response.body` (แปลงเป็น object ให้แล้ว) | `await res.json()` (ต้อง `await`) |
| ตรวจ | `expect(response.status).toBe(201)` | `expect(res.status()).toBe(201)` หรือ `await expect(res).toBeOK()` (ช่วง 2xx) |
| ตรวจ body | `toEqual`, `toHaveProperty`, `toMatchObject` | เหมือนกัน (ตัว assertion ของ Playwright มี matcher ชุดเดียวกัน) |
| ตัวแอปอยู่ที่ไหน | import `app` (Express) แล้วส่งเข้าไปตรงๆ ไม่ต้องเปิดพอร์ต | แอปเป็นอีก process (Next.js) ที่เปิดอยู่จริงตาม `webServer` ใน config test ไม่ได้ import โค้ดแอป ส่งคำขอทางเครือข่ายจริง |
| ต้นทางของ URL | path ล้วน เช่น `/users` | path ล้วนเหมือนกัน แต่ถูกต่อท้าย `baseURL` ใน config (`http://localhost:3100`) |
| รีเซ็ตข้อมูลระหว่าง test | `beforeEach(() => resetUsers())` (เรียกฟังก์ชันของแอปตรงๆ) | แอปเก็บข้อมูลแยกตาม session (cookie `dn_sid`) และ `request` ใหม่ทุก test จึงเริ่มจากข้อมูลตั้งต้นเองโดยไม่ต้องรีเซ็ต |
| cookie / login | ไม่เก็บให้เอง ต้องใช้ `request.agent(app)` ถึงจะจำ cookie | `request` เก็บ cookie ให้อัตโนมัติ (login ครั้งเดียว คำขอต่อไปเป็นคนเดิม) |
| status ผิดปกติ (404 ฯลฯ) | คืน response ปกติ ไม่ throw | เหมือนกัน (ไม่ throw) ยกเว้นตั้ง `failOnStatusCode: true` |

จุดต่างใหญ่คือ Supertest เรียกแอปใน process เดียวกับ test ส่วน Playwright ส่งคำขอไปหา server ที่รันอยู่ต่างหาก ซึ่งตรงกับที่ผู้ใช้จริงและหน้าเว็บของเราเรียกใช้ API มากกว่า

## เนื้อหา

### 1. fixture request

```ts
test("ตัวอย่าง", async ({ request }) => {
  const res = await request.get("/api/health");
  await expect(res).toBeOK();
});
```

- `request` เป็น fixture เหมือน `page` (บท 01) ไม่ต้อง import อะไรเพิ่ม มันคือ `APIRequestContext` ที่ส่ง HTTP ได้โดยตรง ไม่มี browser ไม่มีหน้า จึงเร็วมาก (test ในบทนี้ที่เราวัดแต่ละอันใช้เวลาราวสิบถึงร้อยมิลลิวินาที)
- ใช้ `baseURL` จาก config ดังนั้นเขียนแค่ path ขึ้นต้นด้วย `/`
- ทุกเมธอดคืน Promise ต้อง `await`
- ใช้ test ไฟล์เดียวกันผสมคำขอ API กับ `page` ได้ (บท 37)

### 2. เมธอดและตัวเลือก

| เมธอด | ใช้ทำอะไร | ตัวอย่าง |
|---|---|---|
| `request.get(url, options)` | อ่านข้อมูล | `request.get("/api/products", { params: { q: "เมาส์" } })` |
| `request.post(url, options)` | สร้างข้อมูล / ทำการ | `request.post("/api/cart", { data: { productId: "p01" } })` |
| `request.patch(url, options)` | แก้บางส่วน | `request.patch("/api/cart/p01", { data: { quantity: 3 } })` |
| `request.delete(url, options)` | ลบ | `request.delete("/api/cart/p01")` |
| `request.fetch(url, { method })` | เมธอดอื่น (เช่น PUT) | `request.fetch("/api/x", { method: "PUT" })` |

ตัวเลือกที่ใช้บ่อย:

- `data`: body ส่งเป็น object แล้ว Playwright แปลงเป็น JSON และตั้ง `content-type: application/json` ให้เอง
- `params`: query string เป็น object (เข้ารหัสภาษาไทยให้ ไม่ต้องต่อสตริงเอง)
- `headers`: เพิ่ม header เอง
- `failOnStatusCode: true`: ให้ throw error เมื่อได้ status 400 ขึ้นไป (ค่าเริ่มต้นไม่ throw) เราลองแล้วข้อความ error บอก `404 Not Found` พร้อมข้อความที่ server ตอบ เหมาะเมื่อขั้นตอนเตรียมข้อมูลต้องสำเร็จเสมอ แต่ไม่เหมาะเมื่อ test ตั้งใจตรวจ status ผิดปกติ

### 3. อ่านผลจาก response

```ts
const res = await request.get("/api/products/p02");
res.status();          // 200 (เมธอด ไม่ใช่ property)
res.ok();              // true เมื่อ status 200-299
res.headers();         // object ของ header (ชื่อเป็นตัวพิมพ์เล็ก)
await res.json();      // body เป็น object
await res.text();      // body เป็นข้อความ
```

การตรวจที่แนะนำ:

```ts
await expect(res).toBeOK();                       // ช่วง 2xx
expect(res.status()).toBe(201);                   // เมื่อต้องการ status ตัวใดตัวหนึ่ง
expect(await res.json()).toMatchObject({ id: "p02" }); // ตรวจเฉพาะ field ที่สนใจ
```

`toBeOK()` ใช้กับ response และต้อง `await` ถ้าไม่ผ่าน Playwright แสดงบันทึกการเรียก (URL และ status ที่ได้) ช่วยให้หาสาเหตุง่ายกว่า `expect(res.ok()).toBe(true)` ที่บอกแค่ว่าได้ `false` ใช้ `toBeOK` สำหรับทางสำเร็จ และใช้ `res.status()` เมื่อต้องการ status เจาะจง (เช่น 201 หรือ 204)

`toEqual` เทียบทั้งก้อน เหมาะกับ error body สั้นๆ (`{ message }`) ส่วน `toMatchObject` เทียบเฉพาะ field ที่ระบุ เหมาะกับข้อมูลที่อาจมี field เพิ่มได้

### 4. Status code ที่ API นี้ใช้

ข้อมูลทั้งหมดมาจากการเรียก API จริง (ลองรันดูได้)

| status | ความหมาย | ตัวอย่างใน API ของเรา |
|---|---|---|
| 200 | สำเร็จ | `GET /api/products`, `PATCH /api/cart/p01`, `POST /api/auth/login` |
| 201 | สร้างสำเร็จ | `POST /api/cart`, `POST /api/products` (แอดมิน), `POST /api/orders` |
| 204 | สำเร็จ ไม่มี body | `DELETE /api/products/:id`, `POST /api/auth/logout` |
| 400 | ข้อมูลที่ส่งมาไม่ถูกต้อง | จำนวนสินค้า 0 (`"จำนวนไม่ถูกต้อง"`), ข้อมูลสินค้าไม่ครบ (`"ข้อมูลสินค้าไม่ครบ"`) |
| 401 | ยังไม่ได้ login / ตัวตนไม่ถูกต้อง | `POST /api/products` โดยไม่ login (`"กรุณาเข้าสู่ระบบ"`), login รหัสผิด (`"อีเมลหรือรหัสผ่านไม่ถูกต้อง"`) |
| 403 | login แล้วแต่ไม่มีสิทธิ์ | ผู้ใช้ทั่วไป `POST /api/products` (`"ไม่มีสิทธิ์"`) |
| 404 | ไม่พบสิ่งที่อ้างถึง | `GET /api/products/p99` (`"ไม่พบสินค้า"`), ลบสินค้าที่ไม่อยู่ในตะกร้า (`"ไม่พบสินค้าในตะกร้า"`) |
| 409 | ขัดแย้งกับสถานะปัจจุบัน | `POST /api/cart` ด้วย p05 ที่สต็อกเป็น 0 (`"สินค้าในสต็อกไม่พอ"`) |

ความแตกต่าง 401 กับ 403 ที่ต้องรู้: 401 = "คุณคือใคร" (ยังไม่ login) ส่วน 403 = "รู้แล้วว่าคุณคือใคร แต่ไม่อนุญาต" ทดสอบสองกรณีนี้แยกกัน

### 5. login ผ่าน API และ cookie ที่ context เก็บไว้

```ts
const login = await request.post("/api/auth/login", {
  data: { email: "user@dnshop.test", password: "password123" },
});
await expect(login).toBeOK();

const me = await request.get("/api/auth/me"); // ถือว่า login แล้ว
```

server ตอบ login ด้วย header `Set-Cookie: dn_auth=...` `request` เก็บ cookie นั้นและส่งกลับให้ในคำขอต่อไปที่ request context เดียวกัน เหมือน browser ทุกประการ เราจึงไม่ต้องจัดการ token ด้วยมือ ดู cookie ที่เก็บไว้ได้ด้วย `await request.storageState()` (ได้ `cookies`; เราลองแล้วเห็น `dn_sid` หลังเรียก API ครั้งแรก และ `dn_auth` หลัง login แม้ cookie จะเป็น httpOnly)

ข้อควรรู้:

- **แต่ละ test ได้ request context ใหม่**: จึงเริ่มด้วยตะกร้าว่างและยังไม่ login เสมอ ผลจาก test อื่นไม่ปนมา (เราลองแล้ว: test ใหม่เห็นตะกร้าว่างและมีแค่ cookie `dn_sid`)
- **`request` ไม่ใช่ browser ของ `page`**: cookie ของสอง context นี้แยกกัน การ login ด้วย `request` ไม่ทำให้ `page` login ตามไปด้วย (ถ้าต้องการแชร์ ใช้ `page.request` ในบท 37)
- login ซ้ำด้วยบัญชีอื่นใน context เดียวกันจะแทนที่ cookie เดิม (ข้อ 6 สลับจากผู้ใช้เป็นแอดมินแบบนี้)

### 6. ทดสอบทางไม่สำเร็จด้วย

API ที่ดีต้องปฏิเสธข้อมูลผิดได้ถูกต้อง การทดสอบ API มักมีทาง "ไม่สำเร็จ" มากกว่าทางสำเร็จ ตรวจทั้ง status และข้อความ error และตรวจว่าคำขอที่ล้มเหลว **ไม่มีผลข้างเคียง** (เช่นตะกร้ายังว่าง ในข้อ 3) test API ทำได้เร็วและครอบคลุมกว่าทดสอบผ่านหน้าเว็บ (เช่นหน้าเว็บไม่มีปุ่มส่ง quantity เป็น 0 ให้กด) จึงเหมาะกับกรณีขอบเหล่านี้

## จุดที่มักพลาด

- **ลืม `await` ที่ `request.get(...)` หรือ `res.json()`**: ได้ Promise ไม่ใช่ข้อมูล test ผิดแบบงงๆ (บท 03)
- **เขียน `res.status` แทน `res.status()`**: ใน Playwright เป็นเมธอด (ต่างจาก Supertest) ได้ฟังก์ชันแทนตัวเลข
- **ใช้ `toBeOK()` ตรวจ status ผิดปกติ**: `toBeOK` ผ่านเฉพาะ 2xx ถ้าอยากตรวจ 404 ให้ใช้ `expect(res.status()).toBe(404)`
- **ใส่ URL เต็มโดยไม่จำเป็น**: ใช้ path (`/api/...`) เพื่อให้ใช้ `baseURL` และรันได้ทุกสภาพแวดล้อม
- **คาดว่า test เห็นข้อมูลของ test อื่น**: แต่ละ test ได้ session ใหม่ ถ้าต้องการสถานะต่อเนื่อง ต้องสร้างใน test เดียวกัน
- **คาดว่า login ด้วย `request` มีผลกับ `page`**: ทั้งสองมี cookie แยกกัน
- **ตรวจ body ทั้งก้อนด้วย `toEqual` กับข้อมูลที่อาจเพิ่ม field**: ใช้ `toMatchObject` เพื่อไม่ให้ test พังเมื่อ API เพิ่ม field
- **ไม่ตรวจว่าคำขอล้มเหลวไม่มีผลข้างเคียง**: ตรวจสถานะหลังจากนั้นด้วย (เช่น `GET /api/cart`)
- **ส่ง body เป็นฟอร์ม (`form:`) ให้ API ที่รับ JSON**: API นี้อ่านเฉพาะ JSON ใช้ `data:` (เราลองส่ง `form` แล้ว server ไม่เห็น `productId` จึงตอบ 404)

## หน้าในแอปที่ใช้

บทนี้ไม่เปิดหน้าเว็บเลย ใช้ API เหล่านี้ (ตารางฉบับเต็มอยู่ในหัวข้อ 4):

| API | หมายเหตุ |
|---|---|
| `GET /api/health` | `{ status: "ok", app: "dn-shop" }` |
| `GET /api/products?q&category&sort` | `{ products, total }` |
| `GET /api/products/:id`, `POST /api/products` (แอดมิน), `DELETE /api/products/:id` (แอดมิน) | สินค้าใหม่ได้ id ถัดไป (`p11`) |
| `GET /api/cart`, `POST /api/cart`, `PATCH /api/cart/:productId`, `DELETE /api/cart/:productId` | สรุปตะกร้ามี `items`, `count`, `subtotal`, `discount`, `total`, `coupon` |
| `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | บัญชีทดสอบ: `user@dnshop.test` / `password123` (ผู้ใช้ทั่วไป), `admin@dnshop.test` / `admin123` (แอดมิน) |

## วิธีรันบทนี้

```bash
pnpm test 36-api-testing
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `4 skipped`

## แบบฝึกหัดในบทนี้

1. GET สินค้าชิ้นเดียวแล้วตรวจข้อมูล
2. GET สินค้าที่ไม่มี (404) และใช้ `params` ค้นหา
3. POST ตะกร้าด้วยข้อมูลที่ไม่ผ่าน: 400, 404 และ 409
4. PATCH เปลี่ยนจำนวน และ DELETE ลบรายการ (รวมลบซ้ำได้ 404)
5. login ผ่าน API ตรวจ `/api/auth/me` และ cookie แล้ว logout
6. สิทธิ์แอดมิน: 401, 403, 201, 400 และ 204

## อ่านเพิ่ม

- [API testing](https://playwright.dev/docs/api-testing)
- [APIRequestContext](https://playwright.dev/docs/api/class-apirequestcontext)
- [APIResponse](https://playwright.dev/docs/api/class-apiresponse)
