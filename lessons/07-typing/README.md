# บทที่ 07: พิมพ์ข้อความและกดคีย์ 🏫

## จบบทนี้แล้วทำอะไรได้

- กรอกข้อความลงช่องด้วย `fill` และล้างช่องด้วย `clear`
- พิมพ์ทีละตัวอักษรด้วย `pressSequentially` และกดคีย์ด้วย `press`
- ตรวจข้อความแจ้งเตือน (`role="alert"`) ได้ถูกต้อง โดยไม่เจอ strict mode violation

## เชื่อมกับที่รู้แล้ว

บท 06 สอน `click` ซึ่งใช้กับปุ่มและลิงก์ บทนี้คือ action ของ "ช่องที่ให้พิมพ์" โครงสร้างเหมือนเดิม คือ หา element ด้วย locator (บท 04-05) สั่งทำ แล้ว `expect` ตรวจผล และใช้ `toHaveValue` จากบท 06 ตรวจว่าในช่องมีอะไร

## เนื้อหา

### fill: กรอกทีเดียวทั้งข้อความ

```ts
const searchBox = page.getByRole("searchbox", { name: "ค้นหาสินค้า" });
await searchBox.fill("หูฟัง");
```

`fill` ล้างข้อความเดิมในช่องแล้วใส่ข้อความใหม่ให้ครั้งเดียว เป็นวิธีมาตรฐานสำหรับกรอกฟอร์ม ไม่ต้อง `click` ช่องก่อน และไม่ต้อง `clear` ก่อน (มันล้างให้อยู่แล้ว)

### press: กดคีย์เดียว

```ts
await searchBox.press("Enter");
```

`press` กดคีย์หนึ่งปุ่มบน element นั้น เช่น `"Enter"`, `"Escape"`, `"Tab"`, `"ArrowDown"` ช่องค้นหาของแอปนี้ค้นหาเมื่อกด Enter (เหมือนผู้ใช้จริง) จึงต้องมี `press("Enter")` ต่อจาก `fill`

### clear: ล้างช่อง

```ts
await searchBox.clear();
await expect(searchBox).toHaveValue("");
```

### pressSequentially: พิมพ์ทีละตัว

```ts
await searchBox.pressSequentially("คีย์");
```

`fill` ข้ามไปใส่ค่าทั้งก้อน ส่วน `pressSequentially` พิมพ์ทีละตัวอักษรเหมือนคนพิมพ์ (ยิง event คีย์บอร์ดทีละตัว) ใช้เฉพาะเมื่อหน้าเว็บต้อง "ตอบสนองทุกตัวอักษร" เช่น ช่องที่แสดงคำแนะนำขณะพิมพ์ ปกติใช้ `fill` ก่อนเสมอเพราะเร็วและเสถียรกว่า

### เตรียมของในตะกร้าด้วยการกดบนหน้า

หน้า `/cart` ต้องมีของในตะกร้าก่อนจึงจะมีช่อง "โค้ดส่วนลด" เราจึงเตรียมของด้วยการกดปุ่มเหมือนผู้ใช้จริง:

```ts
await page.goto("/products");
await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
await expect(page.getByRole("status").filter({ hasText: "ลงตะกร้าแล้ว" })).toBeVisible();
await page.goto("/cart");
```

- หน้า `/products` มีปุ่ม "เพิ่มลงตะกร้า" หลายปุ่ม (ทุกการ์ดสินค้า) `getByRole` จะเจอหลาย element ถ้าต้องการอันแรกใส่ `.first()` ต่อท้าย
- ต้องรอให้เห็นข้อความ "เพิ่ม ... ลงตะกร้าแล้ว" ก่อนไปหน้าอื่น เพื่อให้แน่ใจว่าแอปบันทึกลงตะกร้าเสร็จแล้ว (คำว่า `status` อยู่บน `/products` ได้หลายอัน เช่น "กำลังโหลดสินค้า..." จึงต้อง `filter` ด้วยข้อความ)
- ตะกร้าของแต่ละ test แยกกัน (แต่ละ test เปิด browser context ใหม่) จึงไม่ปนกัน

### role alert กับ route announcer

ข้อความ error เช่น "โค้ดส่วนลดไม่ถูกต้อง" ใช้ `role="alert"` แต่ **ห้ามใช้** `page.getByRole("alert")` เดี่ยวๆ เพราะ Next.js (framework ที่ใช้สร้างแอปนี้) ใส่ element ว่างที่มี `role="alert"` ไว้ในทุกหน้าเพื่อประกาศการเปลี่ยนหน้าให้โปรแกรมอ่านหน้าจอ ทำให้เจอ 2 element แล้วเกิด strict mode violation (บท 04) วิธีแก้คือกรองด้วยข้อความ:

```ts
page.getByRole("alert").filter({ hasText: "โค้ดส่วนลดไม่ถูกต้อง" })
```

`filter({ hasText })` เก็บเฉพาะ element ที่ข้อความข้างในมีคำนั้น ใช้กับ role อื่นได้เหมือนกัน (เช่น `status`)

## จุดที่มักพลาด

- **ใช้ `pressSequentially` ทุกครั้ง**: ช้าและเสี่ยงกว่า `fill` ใช้เมื่อจำเป็นจริงๆ
- **ลืม `press("Enter")`**: `fill` ลงช่องค้นหาอย่างเดียวไม่ค้นหา ต้องกด Enter (หรือกดปุ่ม "ค้นหา")
- **`getByRole("alert")` เดี่ยวๆ**: เจอ strict mode violation เพราะ route announcer ของ Next.js ให้ filter ด้วยข้อความ
- **หาช่องค้นหาด้วย role `textbox`**: ช่อง `type="search"` มี role เป็น `searchbox`
- **ไปหน้า `/cart` เร็วเกินไป**: ถ้าไม่รอข้อความยืนยันตอนเพิ่มของ ตะกร้าอาจยังว่างตอนเปิด `/cart`
- **ใช้ `toHaveText` กับช่องกรอก**: ใช้ `toHaveValue` (บท 06)

## หน้าในแอปที่ใช้

**`/products`**
- ช่องค้นหา label "ค้นหาสินค้า" (placeholder "พิมพ์ชื่อสินค้า แล้วกด Enter") และปุ่ม "ค้นหา"
- ข้อความ "พบสินค้า N รายการ" หรือ "ไม่พบสินค้าที่ค้นหา"
- ปุ่ม "เพิ่มลงตะกร้า" ในการ์ดสินค้าแต่ละชิ้น

**`/cart`**
- ช่อง "โค้ดส่วนลด" และปุ่ม "ใช้โค้ด" (กดไม่ได้ถ้าช่องว่าง)
- โค้ดที่ใช้ได้คือ `DN10` ลด 10% สำเร็จแล้วแสดง "ใช้โค้ด DN10 แล้ว ลด 10%" (role `status`) โค้ดผิดแสดง "โค้ดส่วนลดไม่ถูกต้อง" (role `alert`)

## วิธีรันบทนี้

```bash
pnpm test 07-typing
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

## แบบฝึกหัดในบทนี้

1. ค้นหา "เมาส์" แล้วต้องพบสินค้า 1 รายการ
2. ค้นหาคำที่ไม่มีสินค้า แล้วต้องเห็น "ไม่พบสินค้าที่ค้นหา"
3. พิมพ์ "คีย์" ด้วย `pressSequentially` แล้วต้องพบคีย์บอร์ด
4. ใส่โค้ด DN10 ในตะกร้า (เตรียมของด้วยการกดปุ่มบนหน้า)
5. ใส่โค้ดผิดในตะกร้า แล้วตรวจ alert ด้วย `filter`

## อ่านเพิ่ม

- [Actions: Text input](https://playwright.dev/docs/input#text-input)
- [Actions: Keys and shortcuts](https://playwright.dev/docs/input#keys-and-shortcuts)
- [Locators: Filtering](https://playwright.dev/docs/locators#filtering-locators)
