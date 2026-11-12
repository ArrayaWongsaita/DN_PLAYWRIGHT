# บทที่ 05: locator แบบอื่นนอกจาก getByRole 🏫

## จบบทนี้แล้วทำอะไรได้

- เลือกใช้ `getByText`, `getByLabel`, `getByPlaceholder`, `getByAltText`, `getByTitle` ให้เหมาะกับสิ่งที่จะหา
- ใช้ `getByTestId` เมื่อไม่มีทางอื่นที่ดีกว่า และรู้ว่าเมื่อไหร่ควรใช้
- ตรวจข้อความด้วย `toHaveText` และ `toContainText`

## เชื่อมกับที่รู้แล้ว

บท 04 ใช้ `getByRole` ซึ่งเป็นตัวเลือกแรก บทนี้เป็นตัวเลือกอื่นเมื่อ `getByRole` ไม่เหมาะ ทุกตัวทำงานเหมือนกัน คือคืน locator ให้ `expect` เอาไปตรวจ ต่างกันแค่ "หาจากอะไร"

## เนื้อหา

| locator | หาจาก | ใช้กับ |
|---|---|---|
| `getByRole` | ชนิดและชื่อ | ปุ่ม ลิงก์ heading ช่องกรอก ฯลฯ (ลองตัวนี้ก่อนเสมอ) |
| `getByLabel` | ข้อความ `<label>` | ช่องกรอกในฟอร์ม |
| `getByPlaceholder` | placeholder ในช่องกรอก | ช่องที่ไม่มี label |
| `getByText` | ข้อความที่ผู้ใช้เห็น | ข้อความทั่วไป เช่น ราคา คำอธิบาย |
| `getByAltText` | `alt` ของรูป | รูป `<img>` |
| `getByTitle` | attribute `title` | element ที่มี tooltip |
| `getByTestId` | `data-testid` | ทางสุดท้าย |

```ts
page.getByLabel("อีเมล")
page.getByPlaceholder("พิมพ์ชื่อสินค้า แล้วกด Enter")
page.getByText("1,290 บาท")
page.getByAltText("หูฟังไร้สาย DN Buds")
page.getByTitle("จำนวนที่เหลือในคลัง")
page.getByTestId("cart-count")
```

### toHaveText กับ toContainText

- `toHaveText("คงเหลือ 15 ชิ้น")` ข้อความต้องตรงทั้งหมด (ไม่สนช่องว่างหน้าหลัง)
- `toContainText("15")` แค่มีข้อความนี้อยู่ในนั้น

ใช้ `toHaveText` เป็นค่าเริ่มต้น และใช้ `toContainText` เมื่อข้อความยาวหรือมีส่วนที่ไม่ใช่สาระสำคัญของ test

### getByText ตรงแบบไหน

`getByText("1,290 บาท")` หา element ที่ข้อความ **มีคำนี้** (ไม่สนตัวพิมพ์เล็ก/ใหญ่) ถ้าต้องการตรงทั้งหมดใส่ `{ exact: true }` ถ้ามีหลาย element ตรงจะเจอ strict mode violation แบบบท 04

### เมื่อไหร่ควรใช้ getByTestId

`getByTestId("cart-count")` หา element จาก attribute `data-testid` ที่นักพัฒนาใส่ไว้เพื่อ test โดยเฉพาะ ผู้ใช้มองไม่เห็น ใช้เมื่อ:

- element ไม่มี role, label หรือข้อความที่ใช้ระบุตัวมันได้ เช่น ตัวเลข `0` ในลิงก์ "ตะกร้า (0)"
- ข้อความของมันเปลี่ยนไปเรื่อยๆ หรือแปลหลายภาษา จนหาจากข้อความไม่ได้

ข้อเสียคือ test ไม่ได้ยืนยันว่าผู้ใช้เห็นอะไร และต้องมีคนไปเพิ่ม `data-testid` ไว้ในโค้ดแอป จึง **ใช้เป็นทางสุดท้าย** ถ้าหาจาก role/label/ข้อความได้ให้ใช้วิธีนั้นก่อน

## จุดที่มักพลาด

- **ใช้ `getByTestId` ก่อนลอง locator อื่น**: จะได้ test ที่ผ่านทั้งที่ผู้ใช้เห็นหน้าเว็บพัง
- **`getByLabel` เจอหลายตัว**: label บางคำซ้อนกับ label อื่น ถ้าเจอ strict mode violation ใส่ `{ exact: true }` (เหมือนบท 04) บนหน้า `/login` สองช่องนี้ไม่ซ้อนกัน
- **ใช้ `getByText` หาปุ่ม**: ปุ่มควรหาด้วย `getByRole("button", ...)` เพราะ `getByText` จะเจอข้อความที่อยู่ที่อื่นด้วย
- **คิดว่า `getByPlaceholder` ใช้แทน label ได้**: placeholder หายไปเมื่อพิมพ์ ช่องที่ดีควรมี label ด้วย
- **ลืม `await` หน้า `expect`**: ดูบท 03

## หน้าในแอปที่ใช้

**`/products/p01`** (หูฟังไร้สาย DN Buds)
- รูปที่ `alt` = "หูฟังไร้สาย DN Buds"
- ราคา "1,290 บาท"
- `<span title="จำนวนที่เหลือในคลัง">คงเหลือ 15 ชิ้น</span>`

**`/products/p04`** (เสื้อยืด DN สีขาว): คงเหลือ 30 ชิ้น

**`/login`**: ช่อง "อีเมล" และ "รหัสผ่าน" (ผูกกับ `<label>`)

**`/products`**: ช่องค้นหา placeholder "พิมพ์ชื่อสินค้า แล้วกด Enter"

**ทุกหน้า**: ตัวเลขจำนวนสินค้าในลิงก์ "ตะกร้า" ของ header มี `data-testid="cart-count"` เริ่มต้นเป็น `0`

## วิธีรันบทนี้

```bash
pnpm test 05-other-locators
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

## แบบฝึกหัดในบทนี้

1. ราคา "1,290 บาท" บนหน้า p01 ด้วย `getByText`
2. ช่อง "อีเมล" และ "รหัสผ่าน" บน `/login` ด้วย `getByLabel`
3. ช่องค้นหาบน `/products` ด้วย `getByPlaceholder`
4. หน้า p04: รูป (`getByAltText`) และจำนวนคงเหลือ 30 ชิ้น (`getByTitle` + `toContainText`)
5. จำนวนในตะกร้าบนหน้าแรกด้วย `getByTestId`

## อ่านเพิ่ม

- [Locators](https://playwright.dev/docs/locators)
- [Other locators](https://playwright.dev/docs/other-locators)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Assertions](https://playwright.dev/docs/test-assertions)
