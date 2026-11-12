# บทที่ 06: คลิก ดับเบิลคลิก และ hover 🏫

## จบบทนี้แล้วทำอะไรได้

- สั่ง browser คลิก ดับเบิลคลิก และเอาเมาส์ไปชี้ (hover) element ด้วย `click`, `dblclick`, `hover`
- ตรวจค่าในช่องกรอกด้วย `toHaveValue`
- ตรวจว่าปุ่มกดได้หรือไม่ด้วย `toBeEnabled` และ `toBeDisabled`

## เชื่อมกับที่รู้แล้ว

บท 04 และ 05 สอนให้ "หา" element จนเจอ บทนี้เริ่ม "ทำอะไรกับมัน" รูปแบบเหมือนกันทุกครั้งคือ **หา element แล้วต่อด้วยคำสั่ง** เช่น `page.getByRole("button", { name: "..." }).click()` แล้วจบด้วย `expect` เพื่อตรวจผลลัพธ์ เหมือนที่เคยทำมา

## เนื้อหา

### คำสั่งที่ใช้กับ element

| คำสั่ง | ทำอะไร | ตัวอย่างใช้ |
|---|---|---|
| `click()` | คลิกซ้ายหนึ่งครั้ง | กดปุ่ม กดลิงก์ |
| `dblclick()` | คลิกสองครั้งติดกัน | ดับเบิลคลิกรูปเพื่อขยาย |
| `hover()` | ย้ายเมาส์ไปชี้ โดยไม่คลิก | เปิดเมนูหรือ tooltip |

```ts
await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
await page.getByAltText("หูฟังไร้สาย DN Buds").dblclick();
await page.getByRole("button", { name: "ข้อมูลการจัดส่ง" }).hover();
```

### Playwright รอให้เองก่อนคลิก

ก่อนคลิกจริง Playwright จะรอให้ element **พร้อม** ก่อน: มองเห็น, นิ่งอยู่กับที่, ไม่มีอะไรบังอยู่ และไม่ถูก disable ถ้ารอนานเกินเวลาที่กำหนดจึงจะ error ดังนั้นไม่ต้องเขียนโค้ดรอเอง ปุ่ม "เพิ่มลงตะกร้า" ที่ปรากฏช้าก็คลิกได้ทันทีที่พร้อม

### toHaveValue: ตรวจค่าในช่องกรอก

ช่อง "จำนวน" บนหน้าสินค้าเป็น `<input>` ค่าที่เห็นคือ **value** ของช่อง ไม่ใช่ข้อความ จึงใช้ `toHaveValue` แทน `toHaveText`

```ts
await expect(page.getByRole("textbox", { name: "จำนวน" })).toHaveValue("2");
```

หมายเหตุ: `toHaveValue("2")` ใส่เป็นข้อความ (string) เสมอ แม้ค่าจะเป็นตัวเลข

### toBeEnabled และ toBeDisabled: ตรวจว่าปุ่มกดได้หรือไม่

```ts
await expect(page.getByRole("button", { name: "ลดจำนวน" })).toBeDisabled();
await expect(page.getByRole("button", { name: "ลดจำนวน" })).toBeEnabled();
```

ปุ่ม "ลดจำนวน" จะถูก disable ตอนจำนวนเป็น 1 (ลดต่ำกว่า 1 ไม่ได้)

### hover และเมนูที่ซ่อนอยู่

เมนูหรือ tooltip บางอันซ่อนอยู่จนกว่าจะเอาเมาส์ไปชี้ ถ้าตรวจก่อน hover จะไม่เห็น ให้ `hover()` ก่อน แล้วค่อย `expect(...).toBeVisible()` ตรงกันข้าม `not.toBeVisible()` ใช้ตรวจว่า "ยังซ่อนอยู่" ได้

## จุดที่มักพลาด

- **ใช้ `toHaveText` กับช่องกรอก**: ช่อง `<input>` ไม่มีข้อความข้างใน ต้องใช้ `toHaveValue`
- **หาช่องจำนวนด้วย role ผิด**: `<input>` ธรรมดามี role เป็น `textbox` ไม่ใช่ `spinbutton` (spinbutton คือ `type="number"`)
- **ลืม hover ก่อนตรวจเมนู**: ถ้า test บอกว่า "element(s) not found" ให้ลองถามตัวเองก่อนว่าต้อง hover ก่อนไหม
- **คิดว่า `click()` สองครั้งเท่ากับ `dblclick()`**: เหมือนในสายตามนุษย์ แต่โค้ดของหน้าเว็บที่ฟัง event `dblclick` จะทำงานเฉพาะ `dblclick()` เท่านั้น
- **ลืม `await`**: ทุกคำสั่งที่สั่ง browser และทุก `expect` ต้องมี `await` (ดูบท 03)

## หน้าในแอปที่ใช้

**`/products/p01`** (หูฟังไร้สาย DN Buds)
- ปุ่ม "ลดจำนวน" (disabled เมื่อเป็น 1), ช่อง "จำนวน" (เริ่มที่ 1), ปุ่ม "เพิ่มจำนวน" (disabled เมื่อเท่ากับจำนวนคงเหลือ)
- รูปสินค้า (alt = ชื่อสินค้า) ดับเบิลคลิกแล้วขยาย/ย่อ พร้อมข้อความใต้รูปสลับระหว่าง "ดับเบิลคลิกเพื่อขยายรูป" กับ "ดับเบิลคลิกเพื่อย่อรูป"
- ปุ่ม "ข้อมูลการจัดส่ง" hover แล้วแสดง tooltip "จัดส่งภายใน 1–3 วันทำการ"

**`/playground/hover`**
- ปุ่ม "บริการลูกค้า" hover แล้วเปิดเมนูที่มีลิงก์ "ติดตามพัสดุ" และ "คืนสินค้า"

## วิธีรันบทนี้

```bash
pnpm test 06-click-hover
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

## แบบฝึกหัดในบทนี้

1. กดเพิ่มจำนวน 2 ครั้งบนหน้า p01 แล้วช่องจำนวนต้องเป็น 3
2. ปุ่ม "ลดจำนวน" ต้อง disabled ตอนเป็น 1 และ enabled หลังกดเพิ่ม
3. ดับเบิลคลิกรูปสินค้าแล้วข้อความใต้รูปต้องเปลี่ยน
4. hover "บริการลูกค้า" ที่ `/playground/hover` แล้วต้องเห็นเมนู
5. เพิ่มแล้วลดจำนวน ตรวจค่าด้วย `toHaveValue` ทุกขั้น

## อ่านเพิ่ม

- [Actions](https://playwright.dev/docs/input)
- [Auto-waiting (actionability)](https://playwright.dev/docs/actionability)
- [Assertions](https://playwright.dev/docs/test-assertions)
