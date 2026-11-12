# บทที่ 04: หาของบนหน้าด้วย getByRole 🏫

## จบบทนี้แล้วทำอะไรได้

- หา heading, link, button, ช่องค้นหา และส่วนต่างๆ ของหน้าด้วย `getByRole`
- ใช้ `name` เพื่อเลือกตัวที่ต้องการ และใช้ `exact: true` เมื่อชื่อซ้อนกัน
- ตรวจว่า element แสดงอยู่ด้วย `toBeVisible`
- อ่าน error `strict mode violation` แล้วรู้ว่าต้องแก้อะไร

## เชื่อมกับที่รู้แล้ว

ใน Jest คุณมีค่าให้ `expect` ตรวจอยู่แล้ว ใน Playwright เราต้อง "หา" element บนหน้าก่อน คำสั่งหา (เรียกว่า **locator**) ก็เหมือนการบอกว่า "ฉันอยากได้ปุ่มที่ชื่อ X" ตัว Playwright จะไปหาให้ตอนที่ `expect` ทำงาน

## เนื้อหา

### ทำไมต้อง getByRole

ผู้ใช้จริงไม่ได้มองหา `div.btn-primary` เขามองหา "ปุ่มที่เขียนว่าเพิ่มลงตะกร้า" `getByRole` ค้นหาแบบเดียวกับที่ผู้ใช้ (และโปรแกรมอ่านหน้าจอ) เข้าใจหน้าเว็บ จึงเป็น locator ที่ Playwright **แนะนำให้ลองใช้ก่อน** ข้อดีคือ:

- test ไม่พังเมื่อมีคนเปลี่ยน class หรือโครง HTML
- ถ้า `getByRole` หา element ไม่เจอ มักแปลว่าหน้านั้นไม่ accessible จริงๆ

### รูปแบบ

```ts
page.getByRole("button", { name: "เพิ่มลงตะกร้า" })
//             ^ role      ^ ชื่อของ element
```

role คือ "ชนิด" ของ element ตามความหมายใน HTML ไม่ต้องจำ `<tag>` แต่จำ role ที่ใช้บ่อยพอ:

| role | element ใน HTML |
|---|---|
| `heading` | `<h1>`–`<h6>` (ระบุระดับด้วย `level: 1`) |
| `link` | `<a href="...">` |
| `button` | `<button>` |
| `textbox` | `<input type="text">` และ `<textarea>` |
| `searchbox` | `<input type="search">` |
| `navigation` | `<nav>` |
| `list` | `<ul>`, `<ol>` |

ชื่อ (`name`) ของ element มาจากข้อความในนั้น (ปุ่ม ลิงก์ heading) หรือจาก `<label>` / `aria-label` (ช่องกรอก, nav, list)

### toBeVisible

`await expect(locator).toBeVisible()` ตรวจว่า element มีอยู่และผู้ใช้มองเห็น รอและลองใหม่ให้เองถ้าหน้ายังโหลดไม่เสร็จ

### name ตรงแบบไหน และ exact

ค่าเริ่มต้น `name: "สินค้า"` หมายถึง "ชื่อที่ **มีคำว่า** สินค้า" (ไม่สนตัวพิมพ์เล็ก/ใหญ่) ดังนั้นบนหน้าแรก:

- ลิงก์ "สินค้า" ตรง
- ลิงก์ "ดูสินค้าทั้งหมด" ก็ตรง เพราะมีคำว่า "สินค้า"

เมื่อมี element ตรงมากกว่า 1 ตัว Playwright จะ error ว่า **strict mode violation** (ไม่ยอมเดาให้ว่าคุณหมายถึงตัวไหน) แก้ด้วย `exact: true` ให้ชื่อต้องตรงทั้งหมด:

```ts
page.getByRole("link", { name: "สินค้า", exact: true })
```

error จะบอกรายชื่อ element ที่หาเจอทั้งหมดมาให้ ใช้ดูได้ว่าตรงกับตัวไหนบ้างแล้วแก้ให้เจาะจงขึ้น

## จุดที่มักพลาด

- **strict mode violation**: เจอเมื่อชื่อซ้อนกัน แก้ด้วย `exact: true`, ระบุ `level` ของ heading หรือใช้ชื่อที่เจาะจงขึ้น อย่าแก้ด้วยการเลือกตัวแรก (บทหลังจะสอนวิธีที่เหมาะสม)
- **พิมพ์ role ผิด**: เช่น ใช้ `"input"` หรือ `"a"` ที่เป็นชื่อ tag ต้องใช้ชื่อ role (`"textbox"`, `"link"`)
- **ชื่อไม่ตรง**: ชื่อต้องเป็นข้อความที่ผู้ใช้เห็น ไม่ใช่ id หรือ class ถ้าไม่แน่ใจให้เปิดหน้าด้วย `pnpm app` ดู หรือใช้ `pnpm codegen` ช่วยเลือก locator (บท 10)
- **ลืม `await` หน้า `expect`**: ดูบท 03
- **ใช้ขนาดจอเล็ก**: บนจอแคบกว่า 768px เมนูจะถูกซ่อน แต่ test ในคอร์สนี้ใช้จอ Desktop จึงเห็นเมนูเต็ม

## หน้าในแอปที่ใช้

**หน้าแรก `/`**
- heading "DN Shop" (h1) และลิงก์ "DN Shop" ที่ header (คนละ role กัน)
- เมนู: ลิงก์ "หน้าแรก", "สินค้า", "ตะกร้า (0)", "เข้าสู่ระบบ"
- ลิงก์ "ดูสินค้าทั้งหมด" ซึ่งมีคำว่า "สินค้า" ซ้อนกับลิงก์ "สินค้า" ในเมนู

**หน้า `/products`**
- heading "สินค้าทั้งหมด" (h1)
- ช่องค้นหา (searchbox) ชื่อ "ค้นหาสินค้า" และปุ่ม "ค้นหา"
- `nav` ชื่อ "เมนูหลัก" และ `ul` ชื่อ "รายการสินค้า" (โหลดรายการจาก API ฝั่ง browser Playwright จะรอให้เอง)
- ปุ่ม "สินค้าหมด" ของ "หมวกแก๊ป"

## วิธีรันบทนี้

```bash
pnpm test 04-get-by-role
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped`

## แบบฝึกหัดในบทนี้

1. ลิงก์ "หน้าแรก" บนหน้าแรก (เหมือนตัวอย่างที่ 2)
2. ลิงก์ "สินค้า" ในเมนู ต้องเจอ strict mode violation ก่อน แล้วแก้ด้วย `exact: true`
3. heading ระดับ 1 "สินค้าทั้งหมด" บน `/products`
4. ช่องค้นหา (searchbox) และปุ่ม "ค้นหา" บน `/products`
5. เมนูหลัก (navigation), รายการสินค้า (list) และปุ่ม "สินค้าหมด" บน `/products`

## อ่านเพิ่ม

- [Locators](https://playwright.dev/docs/locators)
- [Best Practices: ใช้ locator ที่ผู้ใช้มองเห็น](https://playwright.dev/docs/best-practices)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [ARIA roles (รายการ role ทั้งหมดที่ใช้ได้)](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles)
