# บทที่ 29: iframe (หน้าเว็บซ้อนอยู่ในหน้าเว็บ)

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- อธิบายได้ว่า iframe คืออะไร และทำไม `page.getByRole(...)` มองไม่เห็นของที่อยู่ข้างใน
- เข้าไปทำงานใน iframe ด้วย `page.frameLocator(...)`
- เข้าไปทำงานใน iframe ด้วย `getByTitle(...).contentFrame()`
- กรอกและยืนยันฟอร์มบัตรเครดิตที่ฝังอยู่ในหน้าชำระเงิน แล้วตรวจผลทั้งใน iframe และหน้าหลัก

## เชื่อมกับที่รู้แล้ว

บท 04–05 เรียนการหาของด้วย locator ซึ่งทุกครั้งที่ใช้ `page.getByRole(...)` คือการหาในเอกสาร (document) ของหน้าหลัก แต่ `<iframe>` คือการเอาเอกสาร HTML อีกฉบับมาแปะเป็นกล่องในหน้า (เช่น ฟอร์มจ่ายเงินของผู้ให้บริการภายนอก กล่องแชทช่วยเหลือ แผนที่) ข้างในมี DOM ของตัวเองแยกออกจากหน้าหลัก บทนี้สอนวิธีบอก Playwright ว่า "ให้ไปหาในกล่องนั้น"

## เนื้อหา

### 1. ทำไม page.getByRole มองไม่เห็นของใน iframe

ลองนึกถึงภาพวาดที่มีรูปถ่ายแปะอยู่ กล่องแชทใน `/playground/iframe` ก็เป็นแบบนั้น ถ้าเราสั่ง

```ts
await page.getByRole("button", { name: "เริ่มแชท" }).click(); // หาไม่เจอ รอจนหมดเวลา
```

จะ **หมดเวลาโดยหาปุ่มไม่เจอ** เพราะปุ่ม "เริ่มแชท" อยู่ในเอกสารของ iframe ไม่ได้อยู่ในเอกสารของหน้าหลัก ทั้งหน้าหลักและ iframe มีหัวข้อ ปุ่ม และ route announcer ของตัวเอง แยกกัน

### 2. frameLocator: บอกว่าให้หาข้างใน iframe ตัวนี้

```ts
const chat = page.frameLocator('iframe[title="กล่องแชทช่วยเหลือ"]');
await expect(chat.getByRole("heading", { level: 1, name: "ช่วยเหลือ" })).toBeVisible(); // รอเนื้อหาใน iframe ขึ้นก่อน (หัวข้อ 7)
await chat.getByRole("button", { name: "เริ่มแชท" }).click();
await expect(chat.getByText("เจ้าหน้าที่จะตอบกลับภายใน 5 นาที")).toBeVisible();
```

- `page.frameLocator(selector)` รับ selector ของตัว `<iframe>` เอง (บท 18 สอน CSS แล้ว บทนี้ใช้เฉพาะตรงจุดนี้ ส่วนข้างในใช้ `getByRole` ตามปกติ)
- ได้ค่าชนิด `FrameLocator` ซึ่งมี `getByRole`, `getByText`, `getByLabel` ... เหมือน `page` ทุกอย่าง แต่ค้นเฉพาะข้างใน iframe
- ทุกอย่างยังรอเองตามบท 24 เช่น ถ้า iframe ยังโหลดไม่เสร็จ `click()` จะรอให้เอง
- เก็บ `chat` ไว้ในตัวแปร แล้วใช้ซ้ำทั้ง test

### 3. getByTitle(...).contentFrame(): หา iframe ด้วยชื่อที่คนอ่านเห็น

iframe ที่ดีมักมีแอตทริบิวต์ `title` (เป็นเรื่อง accessibility) เราหา element ด้วย title ได้ด้วย `getByTitle` แล้วแปลงเป็นกรอบ iframe ด้วย `contentFrame()`

```ts
const chat = page.getByTitle("กล่องแชทช่วยเหลือ").contentFrame();
await chat.getByRole("button", { name: "เริ่มแชท" }).click();
```

ได้ `FrameLocator` ตัวเดียวกับวิธีที่ 2 ใช้แทนกันได้ทุกที่ ข้อดีคือไม่ต้องเขียน selector เอง และอ่านง่ายกว่า ถ้า iframe มี title ให้ใช้วิธีนี้ก่อน ใช้ `frameLocator(...)` เมื่อไม่มี title

มีวิธีย้อนกลับด้วย: `FrameLocator.owner()` ให้ Locator ของตัว `<iframe>` เองกลับมา ใช้ตอนอยากตรวจตัว iframe เอง เช่น `await expect(chat.owner()).toBeVisible()`

### 4. หลาย iframe ในหน้าเดียว และ iframe ซ้อน iframe

- หน้าที่มี iframe หลายอัน ให้เลือกอันที่ต้องการด้วย title ที่ต่างกัน ถ้ายังซ้ำให้ใช้ `.first()`, `.nth(n)` หรือ `filter` แบบบท 16 กับ locator ของ iframe ก่อนเรียก `contentFrame()`
- iframe ซ้อน iframe: ต่อได้เลย `outer.getByTitle("...").contentFrame()` ใช้ได้ทุกชั้น (`FrameLocator` มี `getByTitle` เหมือน `page`)

### 5. ฟอร์มบัตรเครดิตในหน้า /checkout

หน้า `/checkout` ถ้าเลือกวิธีชำระเงิน "บัตรเครดิต" (ค่าเริ่มต้น) จะแสดง `<iframe title="ฟอร์มบัตรเครดิต" src="/embed/card-form">` ซึ่งเป็นฟอร์มแยกหน้าที่มี "หมายเลขบัตร", "วันหมดอายุ", "CVV" และปุ่ม "ยืนยันบัตร" ยืนยันแล้วหน้าหลักจะแสดง "ยืนยันบัตรแล้ว" ผ่านการส่งข้อความระหว่างหน้า (`postMessage`) ปุ่ม "ยืนยันคำสั่งซื้อ" ของหน้าหลักจะกดได้ก็ต่อเมื่อบัตรผ่านแล้ว

```ts
await expect(page.getByTestId("order-total")).toBeVisible(); // รอให้หน้าหลักขึ้นก่อน (หัวข้อ 7)
const card = page.getByTitle("ฟอร์มบัตรเครดิต").contentFrame();
await expect(card.getByRole("button", { name: "ยืนยันบัตร" })).toBeVisible(); // รอฟอร์มใน iframe ขึ้น
await card.getByLabel("หมายเลขบัตร").fill("4242 4242 4242 4242");
await expect(card.getByLabel("หมายเลขบัตร")).toHaveValue("4242 4242 4242 4242"); // ถ้าข้อความหาย จะ fail ตรงจุดนี้
await card.getByLabel("วันหมดอายุ").fill("12/30");
await card.getByLabel("CVV").fill("123");
await card.getByRole("button", { name: "ยืนยันบัตร" }).click();

await expect(card.getByRole("status")).toHaveText("บัตรผ่านการตรวจสอบ"); // ใน iframe
await expect(page.getByText("ยืนยันบัตรแล้ว")).toBeVisible(); // ในหน้าหลัก ใช้ page ปกติ
```

บัตรทดสอบที่ผ่านคือ `4242 4242 4242 4242` (ในโค้ดตั้งเป็นค่าคงที่ `VALID_CARD`) บัตรอื่นจะแสดง alert "บัตรไม่ถูกต้อง" อย่าลืมว่า **ของที่อยู่นอก iframe ใช้ `page` ตามปกติ** ใน test เดียวใช้ทั้ง `page` และ `FrameLocator` สลับกันได้

**alert ใน iframe**: หน้า `/embed/card-form` ก็มี route announcer ว่างๆ ของ Next.js (`role="alert"`) เหมือนหน้าหลัก ดังนั้น `card.getByRole("alert")` เฉยๆ จะเจอ 2 อัน (strict mode violation) ให้กรองด้วยข้อความ: `card.getByRole("alert").filter({ hasText: "บัตรไม่ถูกต้อง" })`

### 6. ต้องมีของในตะกร้าก่อนเข้า /checkout

ถ้าตะกร้าว่าง `/checkout` จะ redirect ไป `/cart` จึงต้องเตรียมของก่อน ในบทนี้เตรียมด้วยการกดบนหน้าสินค้า เหมือนที่ผู้ใช้ทำ:

```ts
await page.goto("/products");
await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
await expect(page.getByTestId("cart-count")).toHaveText("1"); // รอจนตะกร้ามี 1 ชิ้น แล้วค่อยไปต่อ
await page.goto("/checkout");
```

บรรทัด `expect(...cart-count...)` สำคัญ: ถ้า `goto("/checkout")` ทันทีหลังคลิก อาจไปก่อนที่การเพิ่มของจะเสร็จ แล้วโดน redirect กลับ `/cart` (การเตรียมข้อมูลด้วย API ที่เร็วกว่าจะสอนในบท 37) ไฟล์ spec ของบทนี้มีฟังก์ชัน `addFirstProductToCart(page)` และ `openCheckout(page)` (เตรียมตะกร้า เปิด `/checkout` และรอยอดที่ต้องชำระ) ให้เรียกใช้เลย เพราะแต่ละ test มี browser context ของตัวเอง (ตะกร้าแยกกัน) ทุก test จึงต้องเตรียมของเอง

### 7. หน้าที่ต้อง hydrate ก่อน (สำคัญกับ iframe ในบทนี้)

กล่องแชทช่วยเหลือ ฟอร์มบัตร และหน้า `/checkout` ถูกส่งมาจากเซิร์ฟเวอร์เป็น HTML ก่อน แล้ว JavaScript ของ React ค่อยโหลดและ "ผูก" ตัวจัดการ onClick/onSubmit/onChange เข้ากับปุ่มและช่องกรอก (เรียกว่า hydrate) ช่วงสั้นๆ ก่อน hydrate เสร็จ ปุ่มมองเห็นและกดได้ (Playwright จึงกด) แต่ยังไม่มีอะไรเกิดขึ้น:

- ปุ่ม "เริ่มแชท" ในกล่องแชท: กดแล้วไม่มีข้อความตอบกลับขึ้น
- ฟอร์มบัตร: ถ้ากด "ยืนยันบัตร" ก่อนฟอร์ม hydrate ปุ่มจะ submit แบบ native ของ browser (โหลดหน้าใหม่และล้างค่าที่กรอก) และค่าที่ `fill` ก่อน hydrate อาจไม่เข้าไปอยู่ใน state ของ React ทำให้บัตรถูกมองว่าไม่ถูกต้อง
- ถ้าหน้า iframe ยืนยันบัตรได้ก่อนที่หน้าหลักจะ hydrate (หน้าหลักยังไม่ได้ตั้งตัวรับข้อความ `postMessage`) ข้อความ "ยืนยันบัตรแล้ว" จะไม่ขึ้นเลย

`expect` ที่ตามมาไม่ช่วยแก้ เพราะมันแค่รอผลที่ไม่มีวันเกิด ส่วน `page.goto` รอ `load` ให้แล้ว (และ `load` ของหน้าหลักรวมการโหลดไฟล์ของ iframe) จึงเจอน้อยมาก แต่เครื่องช้าหรือรันหลาย test พร้อมกันอาจเจอเป็นครั้งคราว ที่สำคัญ `load` **ไม่ได้แปลว่า hydrate เสร็จ**

สิ่งที่ทำได้ คือ **ลดความเสี่ยง** (ไม่การันตี) เพราะหน้าเหล่านี้ไม่มี element ที่ขึ้นเฉพาะหลัง hydrate ให้รอ:

- รอให้เนื้อหาที่ต้องใช้ขึ้นก่อนเสมอ: หัวข้อ "ช่วยเหลือ" ใน iframe แชท, ยอดที่ต้องชำระ (`order-total`) ในหน้าหลัก และปุ่ม "ยืนยันบัตร" ใน iframe บัตร (ตัวอย่างและเฉลยทำแบบนี้)
- หลัง `fill` ให้ `expect(ช่อง).toHaveValue(...)` เพื่อให้ถ้าค่าหาย test fail ตรงจุดและอ่านสาเหตุง่าย
- ถ้า test ของหน้าแบบนี้ fail เป็นครั้งคราวทั้งที่โค้ดถูก ให้นึกถึงสาเหตุนี้ ทางแก้จริงคือให้แอปมี signal "พร้อมใช้งาน" (เช่น ข้อความหรือ `data-ready`) แล้วรอ signal นั้น เมื่อหน้ามีเนื้อหาที่ขึ้นหลัง JavaScript ทำงาน (เช่นรายการสินค้าในหน้า `/products` ที่โหลดด้วย fetch) ให้รอเนื้อหานั้นก่อนกด ซึ่งเป็นสิ่งที่ `addFirstProductToCart` ทำอยู่แล้ว (ปุ่ม "เพิ่มลงตะกร้า" ขึ้นหลังรายการสินค้าโหลดเสร็จ)

## จุดที่มักพลาด

- **ใช้ `page.getByRole` หาของใน iframe**: หาไม่เจอแล้วหมดเวลา ให้ผ่าน `FrameLocator` ก่อนเสมอ
- **ใช้ `FrameLocator` หาของนอก iframe**: ผิดฝั่งเหมือนกัน ของที่อยู่หน้าหลักใช้ `page`
- **`getByRole("alert")` ใน iframe ได้ 2 element**: มี route announcer ว่างๆ เพิ่มมาอีกตัว ให้ใช้ `.filter({ hasText })`
- **กดปุ่มใน iframe เร็วเกินไป**: ปุ่มอาจยังไม่ hydrate ลดความเสี่ยงตามหัวข้อ 7
- **เข้า /checkout ตอนตะกร้าว่าง**: ถูกเด้งไป `/cart` ให้เตรียมของก่อน และรอจน `cart-count` เป็น 1
- **ใช้ `page.frame(...)` / `page.frames()`**: เป็นวิธีเก่าที่ได้ `Frame` ตรงๆ ซึ่งไม่ "รอ" ให้ iframe โผล่แบบ locator ในคอร์สนี้ใช้ `FrameLocator` เสมอ

## หน้าในแอปที่ใช้

**`/playground/iframe`** `<iframe title="กล่องแชทช่วยเหลือ">` ข้างในมีหัวข้อ "ช่วยเหลือ" และปุ่ม "เริ่มแชท" กดแล้วเห็น "เจ้าหน้าที่จะตอบกลับภายใน 5 นาที"
**`/checkout`** ต้องมีของในตะกร้า มี `<iframe title="ฟอร์มบัตรเครดิต">` และหน้าหลักแสดง "ยืนยันบัตรแล้ว" เมื่อบัตรผ่าน
**`/embed/card-form`** หน้าที่อยู่ใน iframe (ไม่ต้องเปิดเอง)

## วิธีรันบทนี้

```bash
pnpm test 29-iframes
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

## แบบฝึกหัดในบทนี้

1. ตรวจหัวข้อ "ช่วยเหลือ" ในกล่องแชทก่อนกดเริ่มแชท (frameLocator)
2. ตรวจว่าข้อความตอบกลับโผล่หลังกดเท่านั้น (`getByTitle(...).contentFrame()`)
3. กรอกบัตรที่ไม่ถูกต้องใน /checkout แล้วตรวจ "บัตรไม่ถูกต้อง"
4. กรอกบัตรที่ถูกต้อง ตรวจทั้งใน iframe และหน้าหลัก
5. กรอกข้อมูลผู้รับ แล้วปุ่ม "ยืนยันคำสั่งซื้อ" ต้องกดได้

## อ่านเพิ่ม

- [Frames](https://playwright.dev/docs/frames)
- [FrameLocator](https://playwright.dev/docs/api/class-framelocator)
- [locator.contentFrame](https://playwright.dev/docs/api/class-locator#locator-content-frame)
