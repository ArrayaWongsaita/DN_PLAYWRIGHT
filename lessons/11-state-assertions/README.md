# บทที่ 11: ตรวจสถานะของ element 🏫

## จบบทนี้แล้วทำอะไรได้

- ตรวจว่าปุ่มหรือช่องกรอกกดได้หรือไม่ได้ ด้วย `toBeEnabled` / `toBeDisabled`
- ตรวจ checkbox และ radio ด้วย `toBeChecked`
- ตรวจว่าช่องแก้ไขได้ ได้โฟกัส หรือว่างอยู่ ด้วย `toBeEditable`, `toBeFocused`, `toBeEmpty`
- ตรวจว่า element ซ่อนอยู่ด้วย `toBeHidden` เช่น ข้อความ error ที่ยังไม่ควรโผล่

## เชื่อมกับที่รู้แล้ว

บท 04 และ 06 ใช้ `toBeVisible`, `toBeDisabled`, `toBeEnabled` ไปบ้างแล้ว บทนี้รวบรวม assertion ตระกูล "สถานะ" ให้ครบ สถานะคือสิ่งที่ผู้ใช้มองเห็นหรือรู้สึกได้โดยไม่ต้องอ่านข้อความ เช่น ปุ่มเทา ช่องที่ติ๊กอยู่ หรือช่องที่เคอร์เซอร์กระพริบอยู่ ทุกตัวเป็น web-first assertion (บท 13) คือ **รอและลองใหม่เอง** จนกว่าจะตรงเงื่อนไขหรือหมดเวลา

## เนื้อหา

### ตารางสรุป

| assertion | ตรวจอะไร | ตัวอย่าง |
|---|---|---|
| `toBeEnabled()` | กดหรือกรอกได้ (ไม่ถูก disabled) | ปุ่ม "เข้าสู่ระบบ" หลังกรอกครบ |
| `toBeDisabled()` | กดหรือกรอกไม่ได้ | ปุ่ม "ลดจำนวน" ตอนจำนวนเป็น 1 |
| `toBeChecked()` | checkbox / radio ถูกเลือก | "รับข่าวสารทางอีเมล" ที่ติ๊กไว้ก่อน |
| `toBeChecked({ checked: false })` | checkbox ยัง **ไม่** ถูกติ๊ก | "ฉันยอมรับเงื่อนไขการใช้งาน" ตอนเปิดหน้า |
| `toBeEditable()` | พิมพ์แก้ไขได้ (enabled และไม่ readonly) | ช่องอีเมล |
| `toBeEditable({ editable: false })` | แก้ไขไม่ได้ | ช่อง "จำนวน" ในหน้าสินค้า (readonly) |
| `toBeFocused()` | element ถือโฟกัสคีย์บอร์ดอยู่ | ช่องที่เพิ่งคลิก |
| `toBeEmpty()` | ช่องกรอกไม่มีค่า หรือ element ไม่มีข้อความ | ช่องอีเมลตอนเปิดหน้า |
| `toBeHidden()` | มองไม่เห็น **หรือ** ไม่มี element นั้นในหน้า | ข้อความ error ก่อนกดส่ง |

### ปุ่มที่กดไม่ได้จนกว่าจะกรอกครบ

```ts
const loginButton = page.getByRole("button", { name: "เข้าสู่ระบบ" });
await expect(loginButton).toBeDisabled();

await page.getByLabel("อีเมล").fill("user@dnshop.test");
await page.getByLabel("รหัสผ่าน").fill("password123");
await expect(loginButton).toBeEnabled();
```

ไม่ต้องใส่เวลารอระหว่างบรรทัด เพราะ `toBeEnabled` รอเองจนปุ่มเปลี่ยนสถานะ

### checkbox และ radio

```ts
await expect(page.getByRole("checkbox", { name: "รับข่าวสารทางอีเมล" })).toBeChecked();
await expect(terms).toBeChecked({ checked: false }); // ต้องยังไม่ติ๊ก
```

ใน Playwright ปัจจุบัน `toBeChecked({ checked: false })` คือวิธีตรวจว่า "ไม่ถูกติ๊ก" ส่วน `.not` จะสอนในบท 12

### โฟกัส ช่องว่าง และช่องที่แก้ไขไม่ได้

```ts
const email = page.getByLabel("อีเมล");
await expect(email).toBeEmpty();     // ยังไม่มีข้อความในช่อง
await email.click();
await expect(email).toBeFocused();   // คลิกแล้วต้องได้โฟกัส
```

`toBeFocused` ตรวจว่า element ตรงกับ `document.activeElement` ของหน้าตอนนี้ ใช้ได้เมื่อคลิก หรือเรียก `.focus()` หรือกด Tab ไปถึงช่องนั้น

### toBeHidden กับข้อความ error

ข้อความ error บนหน้า login (`role="alert"`) จะ **ยังไม่มี** ใน DOM จนกว่าจะกดส่งแล้วผิด การตรวจว่า "ยังไม่ขึ้น" ใช้ `toBeHidden()` ซึ่งผ่านทั้งกรณี element ซ่อนอยู่และกรณีไม่มี element นั้นเลย

```ts
const error = page.getByRole("alert").filter({ hasText: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
await expect(error).toBeHidden();
// ... กรอกรหัสผ่านผิดแล้วกดปุ่ม ...
await expect(error).toBeVisible();
```

ต้องกรองด้วย `.filter({ hasText })` เพราะ Next.js ใส่ element ว่างที่มี `role="alert"` ไว้ในทุกหน้า (route announcer, อธิบายไว้ในบท 07) `getByRole("alert")` เดี่ยวๆ จะเจอสอง element

## จุดที่มักพลาด

- **ใช้ `toBeVisible` ตรวจว่า "ยังไม่ขึ้น"**: `toBeVisible` ล้มเหลวเมื่อ element ไม่มี ซึ่งตรงกับที่ต้องการ แต่ข้อความ error จะอ่านยาก ใช้ `toBeHidden` ให้ความหมายตรงกว่า
- **ใช้ `toBeEmpty` กับข้อความธรรมดาแล้วงง**: ช่องกรอกตรวจ "ค่าในช่อง" ส่วน element อื่นตรวจ "ข้อความข้างใน" ถ้าช่องมีช่องว่าง (space) อยู่ ก็ไม่ถือว่าว่าง
- **คิดว่า disabled กับ readonly เหมือนกัน**: ทั้งสองทำให้ `toBeEditable()` ไม่ผ่าน แต่มีเฉพาะ disabled ที่ทำให้ `toBeDisabled()` ผ่าน ช่อง "จำนวน" ในหน้าสินค้าเป็น readonly จึงไม่ disabled
- **ตรวจ checkbox ว่า "ไม่ติ๊ก" ด้วย `toBeChecked()` เฉยๆ**: ต้องใส่ `{ checked: false }`
- **`getByRole("alert")` เดี่ยวๆ**: ดูหัวข้อด้านบน ต้องกรองด้วยข้อความ

## หน้าในแอปที่ใช้

- **`/login`**: ช่อง "อีเมล", "รหัสผ่าน", ปุ่ม "เข้าสู่ระบบ" (disabled จนกว่าจะกรอกครบ), ข้อความ error "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
- **`/register`**: checkbox "รับข่าวสารทางอีเมล" (ติ๊กไว้ก่อน), "ฉันยอมรับเงื่อนไขการใช้งาน", radio "เพื่อนแนะนำ" / "โซเชียลมีเดีย" / "อื่นๆ"
- **`/products/p01`**: ปุ่ม "ลดจำนวน" (disabled เมื่อเป็น 1), ช่อง "จำนวน" (readonly)
- **`/products/p05`**: สินค้าหมด ปุ่ม "เพิ่มลงตะกร้า" disabled

## วิธีรันบทนี้

```bash
pnpm test 11-state-assertions
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

## แบบฝึกหัดในบทนี้

1. ปุ่มเข้าสู่ระบบยัง disabled เมื่อกรอกแค่อีเมล
2. ตรวจ radio และ checkbox ในฟอร์มสมัครสมาชิก (ติ๊กออกแล้วต้องไม่ checked)
3. ปุ่มที่ disabled เพราะจำนวนเป็น 1 และเพราะสินค้าหมด
4. ช่องว่าง ได้โฟกัสหลังคลิก และช่องที่แก้ไขไม่ได้
5. ข้อความ error ซ่อนอยู่ก่อนกดส่ง แล้วโผล่เมื่อรหัสผ่านผิด

## อ่านเพิ่ม

- [Assertions](https://playwright.dev/docs/test-assertions)
- [LocatorAssertions: toBeChecked](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-checked)
- [LocatorAssertions: toBeHidden](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-hidden)
