# บทที่ 18: CSS, XPath, and และ or

บทนี้เขียนให้อ่านเองได้ และเป็นบทเดียวในช่วงนี้ที่ **ตั้งใจใช้ CSS และ XPath** ซึ่งตลอดคอร์สเราหลีกเลี่ยง เพราะต้องรู้จักไว้เมื่อไปเจอ test เก่าของคนอื่น หรือเจอ element ที่ไม่มี role/ข้อความให้จับ

## จบบทนี้แล้วทำอะไรได้

- เขียน `page.locator("css")` และ `page.locator("xpath=...")` ได้ในระดับพื้นฐาน และอ่านออกเมื่อเจอใน test ของคนอื่น
- อธิบายได้ว่าทำไม CSS/XPath พังง่ายกว่า `getByRole` เมื่อแอปเปลี่ยนหน้าตา (พร้อมโค้ดพิสูจน์)
- ใช้ `and` รวมเงื่อนไขหลายอย่างของ element เดียว และ `or` รองรับสถานการณ์ที่มีผลลัพธ์ได้สองทาง

## เชื่อมกับที่รู้แล้ว

บท 04–05 สอน locator แบบ `getByRole`, `getByText`, `getByTestId` ที่หาจาก "สิ่งที่ผู้ใช้เห็นและสัมผัส" บท 16 สอนต่อ locator และ filter บทนี้สอนวิธีหาแบบ "จากโครงสร้าง HTML" ซึ่งได้ผลเหมือนกัน แต่เปราะบางกว่า และบท 17 สอน `toHaveCount` ที่บทนี้ใช้เทียบผลว่าหาได้เท่ากันทุกวิธี

## เนื้อหา

### 1. CSS selector ด้วย page.locator

```ts
page.locator('ul[aria-label="รายการสินค้า"] > li');
```

เขียนเหมือน CSS ที่ใช้เลือก element ในหน้าเว็บ ตัวที่ควรรู้:

| รูปแบบ | ความหมาย | ตัวอย่าง |
|---|---|---|
| `tag` | ชื่อแท็ก | `li`, `button` |
| `.class` | class | `.product-card` |
| `#id` | id | `#main` |
| `[attr="ค่า"]` | attribute | `[data-testid="cart-count"]` |
| `A B` | B อยู่ที่ไหนก็ได้ข้างใน A | `ul[aria-label="รายการสินค้า"] button` |
| `A > B` | B เป็นลูกตรงๆ ของ A | `ul[aria-label="รายการสินค้า"] > li` |
| `:not([disabled])` | ไม่มี attribute นี้ | `button:not([disabled])` |

Playwright เพิ่ม selector พิเศษของตัวเอง เช่น `li:has-text("เมาส์")` (มีข้อความอยู่ข้างใน) แต่ถ้ากำลังจะใช้ข้อความ ใช้ `getByText` หรือ `filter({ hasText })` ของบท 16 ดีกว่า

### 2. XPath

```ts
page.locator('xpath=//ul[@aria-label="รายการสินค้า"]/li');
```

XPath ใช้ภาษาอีกแบบในการเดินไปตามโครงสร้างของเอกสาร:

| รูปแบบ | ความหมาย |
|---|---|
| `//li` | `<li>` ที่ไหนก็ได้ในหน้า |
| `/li` | ลูกตรงๆ (เหมือน `>` ใน CSS) |
| `//ul[@aria-label="รายการสินค้า"]` | `<ul>` ที่มี attribute นั้น (ใช้ `@` นำหน้าชื่อ attribute) |
| `//li[.//a[text()="หมวกแก๊ป"]]` | `<li>` ที่ **มี** `<a>` ข้อความ "หมวกแก๊ป" อยู่ข้างใน |
| `..` | ขึ้นไปหา parent |

CSS มี `:has()` ให้เลือก element จากสิ่งที่อยู่ข้างใน แต่ CSS เดินขึ้นไปหา parent โดยตรงไม่ได้ ส่วน XPath ทำได้ด้วย `..`:

```ts
// จาก heading "เมาส์ไร้สาย" ขึ้นไปหา <li> ที่ครอบอยู่
page.getByRole("heading", { name: "เมาส์ไร้สาย" }).locator("xpath=..");
```

ตัวอย่างนี้ผสม `getByRole` กับ XPath ในบรรทัดเดียว ซึ่งทำได้ เพราะ locator ต่อกันได้เสมอ (บท 16) ใช้แทนที่การเขียน XPath ยาวๆ ทั้งเส้น

### 3. ทำไมแนะนำ getByRole มากกว่า CSS/XPath

CSS และ XPath ผูกกับ **โครงสร้างและชื่อ class ที่นักพัฒนาตั้งไว้ภายใน** ซึ่งผู้ใช้มองไม่เห็นและเปลี่ยนบ่อย (รีดีไซน์ ย้ายแท็ก เปลี่ยนไลบรารี UI) ส่วน `getByRole` ผูกกับ **สิ่งที่ผู้ใช้และเครื่องอ่านหน้าจอรับรู้** ถ้าสิ่งนั้นเปลี่ยน แปลว่าประสบการณ์ของผู้ใช้เปลี่ยนจริง test ควรเตือน

พิสูจน์ด้วยโค้ด: โค้ดสองแบบด้านล่างหา "การ์ดสินค้า" บนหน้า `/products` ชิ้นเดียวกัน (อยู่ในไฟล์ test ตัวอย่างที่ 2 รันได้จริง):

```ts
// แบบที่ 1: CSS ผูกกับ class
const byCss = page.locator("li.product-card");

// แบบที่ 2: getByRole ผูกกับ role และชื่อของ list
const byRole = page.getByRole("list", { name: "รายการสินค้า" }).getByRole("listitem");

await expect(byCss).toHaveCount(10);   // ผ่าน
await expect(byRole).toHaveCount(10);  // ผ่าน
```

ตอนนี้จำลองว่านักพัฒนารีดีไซน์แล้วเปลี่ยนชื่อ class จาก `product-card` เป็น `item-card` เรา **ไม่แก้โค้ดแอป** แต่สั่งให้ browser เปลี่ยน class ของการ์ดเองด้วย `page.evaluate`:

```ts
await page.evaluate(() => {
  document.querySelectorAll("li.product-card").forEach((li) => {
    li.className = "item-card";
  });
});

await expect(byCss).toHaveCount(0);    // CSS หาไม่เจอสักใบ (ใน test จริงจะแดง)
await expect(byRole).toHaveCount(10);  // getByRole ยังเจอครบ
```

หน้าเว็บหน้าตาเหมือนเดิมและใช้งานได้ปกติ ผู้ใช้ไม่เห็นความต่าง แต่ test ที่ใช้ CSS แดงเพราะเรื่องที่ผู้ใช้ไม่รับรู้เลย ในไฟล์ test เราใช้ `toHaveCount(0)` เพื่อโชว์ว่า "หาไม่เจอ" โดยที่ test ยังผ่าน (ถ้าเขียนเป็น `toHaveCount(10)` กับ CSS หลังเปลี่ยน test จะแดงจริง ลองแก้ดูได้)

> `page.evaluate` สั่งให้โค้ด JavaScript รันใน browser โดยตรง ใช้ในที่นี้เพื่อจำลองสถานการณ์เท่านั้น ในคอร์สนี้ไม่ใช้ในการตรวจสอบจริง

### 4. and: เงื่อนไขหลายอย่างของ element เดียว

`a.and(b)` ได้ element ที่ตรงกับ **ทั้ง a และ b พร้อมกัน** (element เดียวกัน ไม่ใช่ b ที่อยู่ข้างใน a ซึ่งเป็นงานของ chaining ในบท 16)

```ts
// ปุ่ม (role) ที่มีข้อความ "สินค้าหมด" (ข้อความ)
const soldOut = page.getByRole("button").and(page.getByText("สินค้าหมด"));
```

ใช้บ่อยเมื่อต้องรวมวิธีหา เช่น role กับ `data-testid` หรือ role กับ CSS: `page.getByRole("button").and(page.locator(".primary"))`

### 5. or: ผลลัพธ์ได้สองทาง

`a.or(b)` ได้ element ที่ตรงกับ a **หรือ** b ใช้เมื่อหน้ามีสองสถานะที่เป็นไปได้ และ test ไม่ควรสนว่าจะเป็นอันไหน เช่นผู้ใช้ที่ login แล้วจะเห็นปุ่ม "ออกจากระบบ" ส่วนคนยังไม่ login จะเห็นลิงก์ "เข้าสู่ระบบ":

```ts
const loginOrLogout = page
  .getByRole("link", { name: "เข้าสู่ระบบ" })
  .or(page.getByRole("button", { name: "ออกจากระบบ" }));
await expect(loginOrLogout).toBeVisible();
```

ข้อควรระวัง: ถ้า **ทั้งสองตัวปรากฏพร้อมกัน** locator จะตรงสอง element และ `toBeVisible()` จะเจอ strict mode violation (บท 04) ให้ต่อ `.first()` หรือใช้ `toHaveCount` แทน (แบบฝึกหัดข้อ 4 เจอสถานการณ์นี้)

อย่าใช้ `or` เป็นทางลัดเพื่อให้ test ผ่านทุกกรณี ถ้า test ควรรู้ว่าเป็นกรณีไหน ให้ตรวจกรณีนั้นตรงๆ

### เมื่อไหร่จึงควรใช้ CSS/XPath

- element ไม่มี role ข้อความ หรือ label ใดให้จับ และ `data-testid` ใส่เพิ่มไม่ได้
- ต้องเดินขึ้น/ลงตามโครงสร้างแบบที่ locator อื่นทำไม่ได้ (เช่นขึ้นไป parent)
- ดูแล test เก่าที่เขียนด้วย CSS/XPath อยู่แล้ว

นอกเหนือจากนี้ให้เลือก `getByRole` ก่อน แล้ว `getByLabel`/`getByText`/`getByTestId` (บท 05) เสมอ

## จุดที่มักพลาด

- **ใช้ class ที่ framework สร้างให้**: เช่น `.css-1x2y3z` เปลี่ยนทุกครั้งที่ build ห้ามใช้
- **XPath ยาวจากราก `/html/body/div[2]/...`**: พังทันทีที่เพิ่ม/ย้าย element ไม่ว่าจะเล็กน้อยแค่ไหน
- **เขียน XPath โดยไม่ใส่ `xpath=` นำหน้า**: Playwright จะมองเป็น CSS ถ้าขึ้นต้นด้วยอย่างอื่นที่ไม่ใช่ `//` หรือ `..` ใส่ `xpath=` ไว้ทุกครั้งเพื่อให้อ่านชัด
- **คิดว่า `and` คือ chaining**: `a.and(b)` ต้องเป็น element ตัวเดียวกัน ส่วน `a.getByRole(...)` หา b ข้างใน a
- **`or` แล้วเจอ strict mode violation**: เมื่อทั้งสองด้านปรากฏพร้อมกัน ต้องต่อ `.first()` หรือคิดใหม่ว่าควรตรวจอะไร
- **ใส่ข้อความภาษาไทยใน CSS โดยไม่มีเครื่องหมายคำพูด**: ค่าของ attribute ต้องอยู่ในเครื่องหมายคำพูด เช่น `[aria-label="รายการสินค้า"]`

## หน้าในแอปที่ใช้

**`/products`**
- `<ul aria-label="รายการสินค้า">` ลูกเป็น `<li class="product-card">` 10 ใบ แต่ละใบมีรูป `<h2><a>ชื่อ</a></h2>` หมวด ราคา และปุ่ม
- ปุ่ม "เพิ่มลงตะกร้า" 9 ใบ และปุ่ม disabled "สินค้าหมด" 1 ใบ (หมวกแก๊ป)
- header: ลิงก์ "เข้าสู่ระบบ" (ถ้ายังไม่ login) หรือปุ่ม "ออกจากระบบ" (ถ้า login แล้ว)

**`/products?cookieBanner=1`**: ตั้ง cookie แล้วมี `role="dialog"` ชื่อ "การใช้คุกกี้" โผล่หลังโหลดหน้า 0.5–2.5 วินาที มีปุ่ม "ยอมรับทั้งหมด" กับ "ปฏิเสธ"

## วิธีรันบทนี้

```bash
pnpm test 18-css-xpath
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `3 passed` และ `4 skipped`

ESLint ของโปรเจกต์ผ่อนกฎบางข้อสำหรับโฟลเดอร์ `18-*` เพราะบทนี้ตั้งใจใช้สิ่งที่ปกติไม่แนะนำ (`pnpm lint` ยังต้องผ่าน)

## แบบฝึกหัดในบทนี้

1. หาปุ่มที่กดได้ในรายการสินค้าด้วย CSS (`button:not([disabled])`) ต้องได้ 9 ปุ่ม
2. หาการ์ด "หมวกแก๊ป" ด้วย XPath แล้วตรวจปุ่ม "สินค้าหมด" ข้างใน
3. ใช้ `and` หาลิงก์ที่มีข้อความ "หูฟังไร้สาย DN Buds"
4. ใช้ `or` รอปุ่มของ dialog คุกกี้ ("ยอมรับทั้งหมด" หรือ "ปฏิเสธ")

## อ่านเพิ่ม

- [Other locators (CSS, XPath)](https://playwright.dev/docs/other-locators)
- [Best Practices: use locators](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
