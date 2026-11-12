# บทที่ 12: ตรวจค่า ข้อความ attribute class และจำนวน 🏫

## จบบทนี้แล้วทำอะไรได้

- ตรวจค่าในช่องกรอกด้วย `toHaveValue` และข้อความด้วย `toHaveText`
- ตรวจ attribute เช่น `href` ด้วย `toHaveAttribute`
- ตรวจ class ด้วย `toHaveClass`
- นับจำนวน element ด้วย `toHaveCount`
- ใส่ `.not` เพื่อกลับความหมายของ assertion

## เชื่อมกับที่รู้แล้ว

บท 11 ตรวจ "สถานะ" ของ element (กดได้ไหม ติ๊กไหม) บทนี้ตรวจ "เนื้อหา" ของมัน คือค่าที่อยู่ในช่อง ข้อความ ลิงก์ปลายทาง และจำนวน บท 06 ใช้ `toHaveValue` และ `toHaveText` มาแล้ว บทนี้เจาะให้ครบพร้อมกับ assertion ที่เหลือ และใช้หน้า `/cart` เป็นตัวอย่างหลัก

## เนื้อหา

### ตารางสรุป

| assertion | ตรวจอะไร | ตัวอย่าง |
|---|---|---|
| `toHaveValue("2")` | ค่าใน `<input>` / `<select>` / `<textarea>` (เป็นข้อความเสมอ) | ช่อง "จำนวน" ในตะกร้า |
| `toHaveText("2,580 บาท")` | ข้อความของ element ต้องตรง **ทั้งหมด** (ตัดช่องว่างหัวท้ายให้) | `getByTestId("subtotal")` |
| `toContainText("บาท")` | ข้อความของ element แค่ **มี** คำนี้อยู่ | ราคาที่มีคำว่า "บาท" |
| `toHaveAttribute("href", "/products")` | ค่า attribute | ลิงก์ "เลือกซื้อสินค้า" |
| `toHaveClass(/zoomed/)` | class ของ element (regex = มีคำนี้อยู่) | รูปสินค้าที่ถูกขยาย |
| `toHaveCount(2)` | locator เจอกี่ element | แถวในรายการสินค้าในตะกร้า |

### toHaveValue กับ toHaveText

```ts
await expect(page.getByRole("textbox", { name: "จำนวน" })).toHaveValue("2");
await expect(page.getByTestId("subtotal")).toHaveText("2,580 บาท");
```

ช่องกรอกไม่มี "ข้อความข้างใน" ต้องใช้ `toHaveValue` ส่วนข้อความธรรมดาใช้ `toHaveText` ทั้งสองตรวจให้ตรงทั้งหมด ถ้าอยากตรวจแค่บางส่วนใช้ `toContainText` หรือส่ง regex เช่น `toHaveText(/บาท$/)`

### toHaveAttribute และ toHaveClass

```ts
await expect(page.getByRole("link", { name: "เลือกซื้อสินค้า" })).toHaveAttribute("href", "/products");
await expect(image).toHaveClass(/zoomed/);
```

`toHaveClass` แบบ string ต้องตรงกับ class ทั้งหมดในลำดับเดียวกัน (เช่น `"detail-image zoomed"`) ซึ่งเปราะ ใช้ regex ที่มีคำที่สนใจจะปลอดภัยกว่า

### toHaveCount

```ts
const items = page.getByRole("list", { name: "สินค้าในตะกร้า" }).getByRole("listitem");
await expect(items).toHaveCount(2);
```

`toHaveCount` รอและลองนับใหม่จนตรงหรือหมดเวลา ใช้ `toHaveCount(0)` ตรวจว่า "ไม่มี element นี้เลย" ได้

### .not

```ts
await expect(image).not.toHaveClass(/zoomed/);
```

ใส่ `.not` หลัง `expect(...)` เพื่อกลับเป็น "ต้องไม่" และยังรอเหมือนเดิม (รอจนเงื่อนไขกลับด้านเป็นจริงหรือหมดเวลา) assertion บางตัวมีตัวตรงข้ามของมันเอง (`toBeHidden`, `toBeDisabled`) ให้ใช้ตัวนั้นก่อน ส่วน `.not` ใช้เมื่อไม่มีตัวตรงข้ามให้

### ตัวช่วย addToCart ในไฟล์ test

ตะกร้าของแต่ละ test เริ่มว่างเสมอ (แต่ละ test มี browser context ใหม่) ไฟล์ test ของบทนี้จึงมีฟังก์ชัน `addToCart(page, "ชื่อสินค้า")` เขียนไว้ให้ ทำหน้าที่เปิด `/products` กดเพิ่มสินค้า และรอข้อความยืนยัน ก่อนที่ test จะไปเปิดหน้า `/cart`

## จุดที่มักพลาด

- **ใช้ `toHaveText` กับช่องกรอก**: ต้องใช้ `toHaveValue`
- **ลืมว่า `toHaveValue` รับข้อความ**: เขียน `toHaveValue("2")` ไม่ใช่ `toHaveValue(2)`
- **ข้อความไม่ตรงเพราะลืมคำว่า " บาท"**: `toHaveText("2,580")` ล้มเหลว เพราะ `toHaveText` ต้องตรงทั้งข้อความ อ่านข้อความ Received ในผลลัพธ์เทียบดู
- **`toHaveClass` แบบ string ไม่ผ่านทั้งที่มี class นั้น**: element มีหลาย class ให้ใช้ regex
- **กดปุ่มสองครั้งติดกันโดยไม่ตรวจกลางทาง**: ปุ่ม "เพิ่มจำนวน" ในตะกร้าคำนวณจำนวนใหม่จาก "ค่าที่หน้าแสดงอยู่ตอนนั้น" (`จำนวนปัจจุบัน + 1`) แล้วส่งไปเซิร์ฟเวอร์ ถ้ากดครั้งที่สองก่อนที่หน้าจะแสดงค่าใหม่ ทั้งสองครั้งจะส่งค่าเดียวกัน ผลคือได้ 2 แทนที่จะเป็น 3 ผู้ใช้จริงที่กดเร็วมากก็เจอแบบเดียวกัน ไม่ใช่เพราะ Playwright "เร็วเกินไป" การตรวจ `toHaveValue` คั่นระหว่างการกดคือวิธีรอให้หน้าเปลี่ยนเป็นสถานะใหม่ก่อนกดต่อ
- **`.not` ผ่านเร็วเกินไป**: `.not` ตรวจว่า "ตอนนี้ไม่ตรง" ถ้าหน้ายังโหลดไม่เสร็จก็อาจผ่านทั้งที่ยังไม่ถึงจังหวะที่ควรตรวจ ควรตรวจสิ่งที่ยืนยันว่าหน้าพร้อมแล้ว (เช่น `toBeVisible` ของ element หลัก) ก่อน

## หน้าในแอปที่ใช้

- **`/cart`**: ช่อง "จำนวน", ปุ่ม "เพิ่มจำนวน", `data-testid` `subtotal` / `discount` / `total`, ช่อง "โค้ดส่วนลด" + ปุ่ม "ใช้โค้ด" (โค้ด DN10 ลด 10%), ลิงก์ "เลือกซื้อสินค้า" เมื่อตะกร้าว่าง
- **`/products`**: การ์ดสินค้าพร้อมปุ่ม "เพิ่มลงตะกร้า" และลิงก์ชื่อสินค้า
- **`/products/p01`**: รูปสินค้าที่ดับเบิลคลิกแล้วได้ class `zoomed`

## วิธีรันบทนี้

```bash
pnpm test 12-value-assertions
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

## แบบฝึกหัดในบทนี้

1. เพิ่มจำนวนในตะกร้าเป็น 3 แล้วตรวจจำนวนและยอดรวม
2. ตรวจ `href` ของลิงก์สองจุด
3. ดับเบิลคลิกรูปสองครั้งแล้ว class `zoomed` ต้องหายไป
4. นับรายการในตะกร้า ว่าง = 0 และเมื่อเพิ่มสินค้าสองชิ้น = 2
5. ใช้โค้ด DN10 แล้วตรวจยอดรวม ส่วนลด และยอดสุทธิ

## อ่านเพิ่ม

- [Assertions](https://playwright.dev/docs/test-assertions)
- [LocatorAssertions: toHaveText](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-text)
- [LocatorAssertions: toHaveCount](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-count)
