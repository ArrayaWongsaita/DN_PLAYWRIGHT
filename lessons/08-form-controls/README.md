# บทที่ 08: checkbox, radio และ select 🏫

## จบบทนี้แล้วทำอะไรได้

- ติ๊กและยกเลิก checkbox ด้วย `check` / `uncheck` และตรวจด้วย `toBeChecked`
- เลือก radio ด้วย `check`
- เลือกตัวเลือกใน `<select>` ด้วย `selectOption` ทั้งแบบ label และ value

## เชื่อมกับที่รู้แล้ว

บท 06-07 ใช้ `click` กับ `fill` ได้แล้ว ฟอร์มยังมีอีกสามแบบ คือ checkbox, radio, select ทั้งสามหาด้วย `getByRole` เหมือนเดิม (บท 04) แต่มีคำสั่งเฉพาะที่สั่งตรงๆ ว่า "ให้เป็นแบบนี้" ซึ่งปลอดภัยกว่า `click`

## เนื้อหา

### role ของแต่ละแบบ

| ฟอร์ม | role | คำสั่ง |
|---|---|---|
| checkbox | `checkbox` | `check()` / `uncheck()` |
| radio | `radio` | `check()` |
| `<select>` | `combobox` | `selectOption(...)` |

### check และ uncheck

```ts
const newsletter = page.getByRole("checkbox", { name: "รับข่าวสารทางอีเมล" });
await expect(newsletter).toBeChecked();
await newsletter.uncheck();
await expect(newsletter).not.toBeChecked();
```

- `check()` บังคับให้ "ติ๊กอยู่" ถ้าติ๊กอยู่แล้วไม่ทำอะไร
- `uncheck()` บังคับให้ "ไม่ติ๊ก"
- ต่างจาก `click()` ที่สลับค่าทุกครั้ง ทำให้ผลของ test ขึ้นกับค่าเริ่มต้น
- `.not` ใส่หน้า matcher เพื่อตรวจกลับด้าน ใช้ได้กับทุก `expect`
- ช่อง "รับข่าวสารทางอีเมล" บนหน้า `/register` ถูกติ๊กไว้ก่อน (ค่าเริ่มต้นของหน้า) ส่วน "ฉันยอมรับเงื่อนไขการใช้งาน" ยังว่าง

### radio: กลุ่มที่เลือกได้ตัวเดียว

```ts
await page.getByRole("radio", { name: "โซเชียลมีเดีย" }).check();
```

เมื่อเลือก radio ตัวหนึ่ง ตัวอื่นในกลุ่มเดียวกันจะถูกยกเลิกเอง `uncheck()` กับ radio ไม่ได้ (error) ให้เลือกตัวอื่นแทน กลุ่ม radio ในแอปนี้อยู่ใน `<fieldset>` ที่มี `<legend>` เช่น "รู้จักเราจากช่องทางไหน"

### selectOption: เลือกใน select

```ts
const province = page.getByRole("combobox", { name: "จังหวัด" });
await province.selectOption("เชียงใหม่");              // ส่งข้อความเดียว: จับคู่ทั้ง value และ label
await province.selectOption({ label: "เชียงใหม่" });   // ระบุว่าเป็นข้อความที่ผู้ใช้เห็น
await province.selectOption({ value: "cod" });        // ระบุว่าเป็น value ในโค้ด HTML
```

`<option value="cod">เก็บเงินปลายทาง</option>` มีสองส่วน: **label** คือข้อความที่ผู้ใช้เห็น ("เก็บเงินปลายทาง") และ **value** คือค่าในโค้ด ("cod") ตรวจผลด้วย `toHaveValue("cod")` ซึ่งตรวจเป็น **value** ของตัวเลือกที่เลือกอยู่ ไม่ใช่ label

ในหน้า `/register` ค่า value กับ label ของจังหวัดเหมือนกัน แต่ที่ `/checkout` วิธีชำระเงินมี value เป็น `card`, `transfer`, `cod` ต่างจากข้อความที่เห็น

### เตรียมของก่อนเข้า /checkout

ถ้าตะกร้าว่าง หน้า `/checkout` จะเด้งกลับไป `/cart` ดังนั้นต้องเพิ่มของก่อน (ใช้วิธีเดียวกับบท 07):

```ts
await page.goto("/products");
await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click();
await expect(page.getByRole("status").filter({ hasText: "ลงตะกร้าแล้ว" })).toBeVisible();
await page.goto("/checkout");
```

## จุดที่มักพลาด

- **ใช้ `click()` กับ checkbox**: ถ้าค่าเริ่มต้นเปลี่ยน (เช่น ติ๊กไว้แล้ว) `click()` จะเอาติ๊กออก ใช้ `check()` / `uncheck()` ที่ตั้งเป็นสถานะที่ต้องการ
- **`uncheck()` กับ radio**: เกิด error ให้ `check()` ตัวที่ต้องการแทน
- **ใช้ `toHaveText` ตรวจ select**: `toHaveText` จะอ่านข้อความของทุกตัวเลือกรวมกัน ใช้ `toHaveValue` แทน
- **สับสน label กับ value**: ถ้า `selectOption("...")` ไม่เจอ ให้ลองระบุ `{ label: ... }` หรือ `{ value: ... }` ให้ชัด
- **เจอ checkbox หลายตัว**: ถ้าชื่อซ้อนกัน เช่น "อีเมล" ปะปนกับ "รับข่าวสารทางอีเมล" ใส่ `{ exact: true }` (บท 04)
- **เข้า `/checkout` ตอนตะกร้าว่าง**: จะเด้งไป `/cart` ต้องเตรียมของก่อน

## หน้าในแอปที่ใช้

**`/register`**
- checkbox "รับข่าวสารทางอีเมล" (ติ๊กไว้ก่อน), "ฉันยอมรับเงื่อนไขการใช้งาน" (ว่าง)
- select "จังหวัด": กรุงเทพมหานคร, เชียงใหม่, ขอนแก่น, ภูเก็ต, ชลบุรี
- กลุ่ม radio "รู้จักเราจากช่องทางไหน": เพื่อนแนะนำ, โซเชียลมีเดีย, อื่นๆ
- กลุ่ม checkbox "หมวดที่สนใจ": อุปกรณ์ไอที, เสื้อผ้า, ของใช้ในบ้าน, หนังสือ

**`/checkout`** (ต้องมีของในตะกร้า)
- radio "ส่งธรรมดา (50 บาท)" (เลือกไว้ก่อน) / "ส่งด่วน (100 บาท)"
- select "วิธีชำระเงิน": บัตรเครดิต (`card`), โอนผ่านธนาคาร (`transfer`), เก็บเงินปลายทาง (`cod`)

## วิธีรันบทนี้

```bash
pnpm test 08-form-controls
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

## แบบฝึกหัดในบทนี้

1. ติ๊กยอมรับเงื่อนไขการใช้งาน
2. เลือก radio "โซเชียลมีเดีย"
3. ติ๊กหมวดที่สนใจหลายหมวด
4. เลือกวิธีชำระเงินที่ `/checkout` ด้วย label และ value
5. สลับวิธีจัดส่งเป็นส่งด่วน

## อ่านเพิ่ม

- [Actions: Checkboxes and radio buttons](https://playwright.dev/docs/input#checkboxes-and-radio-buttons)
- [Actions: Select options](https://playwright.dev/docs/input#select-options)
- [Assertions](https://playwright.dev/docs/test-assertions)
