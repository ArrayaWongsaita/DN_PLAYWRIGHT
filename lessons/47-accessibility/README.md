# บทที่ 47: Accessibility (การเข้าถึงสำหรับทุกคน)

บทนี้เขียนให้อ่านเองได้ ตัวอย่าง เฉลย และการตรวจของ axe ในบทนี้ใช้ chromium รายชื่อกฎของ axe ที่เห็นในบทนี้มาจากการรันบนหน้า `/playground/a11y` จริง

## จบบทนี้แล้วทำอะไรได้

- ตรวจ role และชื่อ (accessible name) ของ element ด้วย `toHaveRole` และ `toHaveAccessibleName`
- ตรวจคำอธิบาย (accessible description) ของช่องกรอกด้วย `toHaveAccessibleDescription`
- ให้ `@axe-core/playwright` ตรวจหน้าเว็บอัตโนมัติ และอ่านผลเพื่อรู้ว่าปัญหาคืออะไร
- รู้ว่าปัญหาที่ axe เจอแต่ละแบบแก้ในโค้ด React ยังไง

## เชื่อมกับที่รู้แล้ว

บท 04 บอกว่า `getByRole` หาของจาก "บทบาทและชื่อที่โปรแกรมอ่านหน้าจอเห็น" ถ้าหน้าไหนหาด้วย `getByRole` ไม่เจอ ปัญหามักอยู่ที่ตัวหน้าเว็บ ไม่ใช่ที่ test บทนี้เปลี่ยนมุมมอง: เอาสิ่งเดียวกันมาเป็น "สิ่งที่ต้องตรวจ" และเสริมด้วยเครื่องมือตรวจอัตโนมัติ เหมือนที่ ESLint ช่วยจับโค้ดที่เขียนผิดหลัก axe จับโค้ด HTML ที่ผิดหลัก accessibility

## เนื้อหา

### 1. คำศัพท์ 3 คำ

- **role**: element นี้ทำหน้าที่อะไร (`button`, `link`, `heading`, `textbox` ...) มาจากแท็ก HTML หรือ attribute `role`
- **accessible name**: ชื่อที่โปรแกรมอ่านหน้าจออ่านออกเสียงให้ element นั้น มาจาก label, ข้อความข้างใน, `alt` ของรูป, `aria-label` ฯลฯ
- **accessible description**: คำอธิบายเสริมของ element มักมาจาก `aria-describedby` ที่ชี้ไปหา element ที่มีข้อความอธิบาย

### 2. toHaveRole / toHaveAccessibleName

```ts
const nav = page.getByRole("navigation", { name: "เมนูหลัก" });
await expect(nav).toHaveRole("navigation");
await expect(nav.getByRole("link", { name: /ตะกร้า/ })).toHaveAccessibleName(/^ตะกร้า \(\d+\)$/);
```

ทั้งสองตัวเป็น web-first assertion (รอและลองซ้ำเอง) ใช้ตรวจ "สิ่งที่โปรแกรมอ่านหน้าจอจะเห็น" ตรงๆ ชื่อเป็นข้อความตรงตัวหรือ regular expression ก็ได้ ตัวอย่างชื่อที่มีจริงบนแอป เช่น timer ของ Flash Sale ชื่อ "เวลาที่เหลือ" (จาก `aria-label`) ช่องรหัสผ่านใน `/register` ชื่อ "รหัสผ่าน" และมี role `textbox`

### 3. toHaveAccessibleDescription

ช่องรหัสผ่านใน `/register` มีข้อความ "อย่างน้อย 8 ตัวอักษร" ใต้ช่อง ผูกกันด้วย `aria-describedby="password-hint"` ใน React:

```tsx
<input type="password" aria-describedby="password-hint" />
<small id="password-hint">อย่างน้อย 8 ตัวอักษร</small>
```

test ตรวจได้ว่าคำอธิบายผูกกันจริง (ไม่ใช่แค่ข้อความวางอยู่ใกล้ๆ):

```ts
const password = page.getByLabel("รหัสผ่าน", { exact: true });
await expect(password).toHaveAccessibleDescription("อย่างน้อย 8 ตัวอักษร");
```

ต้องใส่ `exact: true` เพราะหน้านี้มี "ยืนยันรหัสผ่าน" ด้วย ซึ่งมีคำว่า "รหัสผ่าน" อยู่ในชื่อ ถ้าไม่ใส่จะหาเจอสองช่อง

### 4. axe และ @axe-core/playwright

[axe-core](https://github.com/dequelabs/axe-core) เป็นเครื่องมือตรวจ accessibility อัตโนมัติ ส่วน `@axe-core/playwright` เป็นตัวต่อให้ใช้ใน test ของ Playwright (repo นี้ติดตั้งไว้ใน `devDependencies` แล้ว ไม่ต้องติดตั้งเพิ่ม) ใช้แบบนี้:

```ts
import AxeBuilder from "@axe-core/playwright";

const results = await new AxeBuilder({ page }).analyze();
expect(results.violations).toEqual([]);
```

- `analyze()` ตรวจหน้าที่ `page` เปิดอยู่ตอนนั้น จึงต้อง `goto` และรอให้หน้าอยู่ในสภาพสุดท้ายก่อน (รอสิ่งที่ต้องขึ้นแน่ๆ เช่น heading หรือข้อความที่ถูกสร้างหลัง hydrate)
- `results.violations` คือรายการปัญหา แต่ละรายการมี `id` (ชื่อกฎ เช่น `image-alt`), `impact` (ความรุนแรง), `help` (คำอธิบายสั้น) และ `nodes` (element ที่มีปัญหา)
- หน้าที่ผ่านต้องได้ `[]` ได้ `[]` บน `/`, `/products`, `/login` และ `/register`
- จำกัดการตรวจได้ เช่น `.include("main")` ตรวจเฉพาะใน `<main>` (กับ `/playground/a11y` ได้ผลเท่ากับตรวจทั้งหน้า เพราะปัญหาอยู่ใน `main` หมด) และ `.withTags(["wcag2a", "wcag2aa"])` จำกัดกฎตามมาตรฐาน WCAG ระดับ A และ AA (ได้ 4 ปัญหาชุดเดียวกัน)
- axe **ไม่ใช่ตัวตัดสินว่าหน้าเข้าถึงได้ครบ** มันตรวจได้เฉพาะสิ่งที่เครื่องวัดได้ เช่น มี `alt` ไหม ความต่างสีพอไหม แต่บอกไม่ได้ว่า `alt` ที่เขียนมีความหมายหรือเปล่า หรือลำดับการกด Tab เป็นธรรมชาติไหม ยังต้องมีคนลองใช้จริงด้วย

### 5. หน้า /playground/a11y: ปัญหาที่ตั้งใจไว้ และวิธีแก้ใน React

หน้านี้ตั้งใจผิดหลัก เมื่อรัน axe จะพบ **4 ปัญหา**:

| id | impact | element ที่เจอ | สิ่งที่ axe บอก |
|---|---|---|---|
| `image-alt` | critical | `<img>` ของสินค้า | รูปไม่มี attribute `alt` |
| `button-name` | critical | ปุ่มที่มีแค่ไอคอน svg | ปุ่มไม่มีข้อความหรือชื่อ |
| `label` | critical | `<input type="text">` | ช่องกรอกไม่มี label |
| `color-contrast` | serious | ย่อหน้า "ข้อความนี้สีจางมาก อ่านยาก" | ความต่างสี 1.67 (สี `#c8c8c8` บนพื้น `#ffffff`) ต้องอย่างน้อย 4.5:1 |

**1) `image-alt`: รูปต้องมีข้อความทดแทน**

```tsx
// ผิด: โปรแกรมอ่านหน้าจอรู้แค่ว่ามีรูป
<img src="/products/p01.svg" width={80} height={80} />
// แก้: บอกว่ารูปคืออะไร
<img src="/products/p01.svg" alt="แล็ปท็อปสีเทา" width={80} height={80} />
// ถ้ารูปเป็นแค่ตกแต่ง ไม่มีความหมาย ให้ alt ว่างเพื่อให้โปรแกรมอ่านหน้าจอข้าม
<img src="/decor.svg" alt="" />
```

(`ProductCard` ของแอปนี้ใช้ `alt={product.name}` ทำให้หน้าหลักผ่าน)

**2) `button-name`: ปุ่มต้องมีชื่อ**

```tsx
// ผิด: ปุ่มที่ข้างในมีแต่ไอคอน
<button type="button"><svg width="16" height="16">…</svg></button>
// แก้: ใส่ aria-label และซ่อนไอคอนจากโปรแกรมอ่านหน้าจอ
<button type="button" aria-label="เพิ่มรายการโปรด">
  <svg width="16" height="16" aria-hidden="true">…</svg>
</button>
```

ทางเลือกอื่นคือใส่ข้อความที่มองเห็นในปุ่ม (ดีที่สุดสำหรับทุกคน)

**3) `label`: ช่องกรอกต้องมี label**

```tsx
// ผิด
ช่องนี้ไม่มี label: <input type="text" />
// แก้: ครอบด้วย <label> (หรือใช้ htmlFor ชี้ id)
<label>
  ชื่อสินค้า
  <input type="text" />
</label>
```

ถ้าออกแบบให้ไม่มีข้อความ label บนจอ ใช้ `aria-label="..."` ที่ `<input>` แทนได้ placeholder อย่างเดียวไม่นับว่าเป็น label ที่ดี

**4) `color-contrast`: สีข้อความต้องต่างจากพื้นพอ**

```tsx
// ผิด: #c8c8c8 บนขาว ต่างกัน 1.67:1 (ต้องการ 4.5:1 สำหรับตัวอักษรปกติ)
<p style={{ color: "#c8c8c8", backgroundColor: "#ffffff" }}>…</p>
// แก้: ใช้สีเข้มขึ้น เช่น #595959 (คำนวณจากสูตรมาตรฐาน WCAG ได้ราว 7:1 บนพื้นขาว)
<p style={{ color: "#595959", backgroundColor: "#ffffff" }}>…</p>
```

### 6. ตรวจให้ตรงกับปัญหาที่ตั้งใจไว้

```ts
const results = await new AxeBuilder({ page }).analyze();
expect(results.violations.map((v) => v.id).sort()).toEqual(["button-name", "color-contrast", "image-alt", "label"]);
```

การเทียบ `id` ของกฎดีกว่าเทียบทั้งรายการ เพราะทั้งรายการมีรายละเอียด (HTML, ตำแหน่ง) ที่เปลี่ยนตามเวอร์ชันของ axe ได้ ใน test ของโปรเจกต์จริง ถ้ามีปัญหาที่รู้ว่ามีแต่ยังไม่แก้ ให้เขียนเป็นรายการ id ที่ยอมรับแล้ว เพื่อให้ปัญหาใหม่ๆ ยังถูกจับได้

## จุดที่มักพลาด

- **เรียก `analyze()` ก่อนหน้าพร้อม**: ตรวจหน้าครึ่งๆ กลางๆ ได้ผลไม่ตรง ให้รอสิ่งที่ต้องขึ้นก่อน
- **คิดว่า axe ผ่านแปลว่าหน้าเข้าถึงได้ครบ**: ยังมีสิ่งที่เครื่องตรวจไม่ได้ (ดูหัวข้อ 4)
- **ใช้ `getByLabel("รหัสผ่าน")` เฉยๆ ใน `/register`**: ตรงกับสองช่อง ใส่ `{ exact: true }`
- **เทียบ `results.violations` ทั้งก้อนกับค่าที่เขียนเอง**: พังทุกครั้งที่ axe อัปเดต เทียบเฉพาะ `id`
- **แก้ปัญหา `button-name` ด้วย `aria-label` แต่ไม่ซ่อนไอคอน**: ไอคอน svg อาจถูกอ่านซ้ำ ใส่ `aria-hidden="true"` ที่ svg
- **ปิดกฎของ axe เพียงเพราะ test ไม่ผ่าน**: ปัญหาที่ axe บอกคือปัญหาจริงของผู้ใช้ ให้แก้ที่หน้าเว็บก่อน
- **ใช้ `toHaveAccessibleName` แทน `getByRole`**: ปกติหา element ด้วย `getByRole` อยู่แล้ว ถ้าหาเจอแปลว่าชื่อตรงอยู่ก่อนแล้ว `toHaveAccessibleName` ใช้เมื่อหา element ด้วยวิธีอื่น (เช่น `getByLabel`, `getByTestId`) แล้วอยากตรวจชื่อเพิ่ม

## หน้าในแอปที่ใช้

**`/`** หน้าแรก: ผ่าน axe ได้ `[]` มี nav "เมนูหลัก", h1 "DN Shop", timer ชื่อ "เวลาที่เหลือ"
**`/login`** เข้าสู่ระบบ, **`/products`** สินค้าทั้งหมด: ผ่าน axe ได้ `[]`
**`/register`** สมัครสมาชิก: ช่อง "รหัสผ่าน" มีคำอธิบาย "อย่างน้อย 8 ตัวอักษร" (`aria-describedby`)
**`/playground/a11y`** หน้าที่ตั้งใจให้มีปัญหา: h1 "หน้านี้มีปัญหา accessibility โดยตั้งใจ" และปัญหา 4 ข้อตามตารางในหัวข้อ 5

## วิธีรันบทนี้

```bash
pnpm test 47-accessibility
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `4 skipped`

## แบบฝึกหัดในบทนี้

ทำในไฟล์ `accessibility.spec.ts` เปลี่ยน `test.fixme` เป็น `test` ทีละข้อ

1. ตรวจ role และชื่อของช่องอีเมล ช่องรหัสผ่าน และปุ่มในฟอร์ม `/login`
2. ตรวจคำอธิบายของช่องรหัสผ่านใน `/register` ด้วย `toHaveAccessibleDescription`
3. ให้ axe ตรวจ `/playground/a11y` แล้วยืนยันว่าเจอ 4 id ตามตาราง
4. ตรวจว่า `/products` ผ่าน axe และ `/login` ผ่าน axe เมื่อจำกัดเฉพาะส่วน `main`

## อ่านเพิ่ม

- [Accessibility testing (playwright.dev)](https://playwright.dev/docs/accessibility-testing)
- [toHaveAccessibleName (playwright.dev)](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-accessible-name)
- [WebAIM: Contrast Checker](https://webaim.org/resources/contrastchecker/)
