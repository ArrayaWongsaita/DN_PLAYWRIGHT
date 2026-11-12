# บทที่ 42: หลายบทบาท (user กับ admin)

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน บทนี้ต่อจากบท 41 ควรอ่านบท 41 ก่อน

## จบบทนี้แล้วทำอะไรได้

- เตรียมไฟล์ storage state หลายบทบาท (ผู้ใช้ทั่วไป และผู้ดูแลระบบ) จาก setup หลายไฟล์
- เลือกบทบาทของกลุ่ม test ด้วย `test.use({ storageState })` ในแต่ละ `test.describe`
- เปิด browser context สองอันที่เป็นคนละบทบาทใน test เดียวด้วย `browser.newContext({ storageState })`
- อธิบายได้ว่าทำไม context สองอันถึงไม่เห็นข้อมูลของกันและกันในแอปนี้

## เชื่อมกับที่รู้แล้ว

บท 41 ทำสถานะของผู้ใช้คนเดียวที่ตั้งไว้ใน config ทุก test ในบทนั้นเป็นคนคนเดียวกัน บทนี้มีสองคน ใน Jest + Supertest เทียบได้กับการมี `userToken` กับ `adminToken` สองตัวแล้วเลือกใส่ header ตามที่ test ต้องการ ใน Playwright "token" ก็คือไฟล์ storage state และ "ใส่ header" คือการบอกว่า test หรือ context นี้ใช้ไฟล์ไหน

## เนื้อหา

### 1. โครงสร้างของบทนี้

```
lessons/42-multiple-roles/
  playwright.config.ts          project setup + project chromium (ไม่ตั้ง storageState ใน config)
  user.setup.ts                 login เป็น user@dnshop.test  → .auth/user.json
  admin.setup.ts                login เป็น admin@dnshop.test → .auth/admin.json
  multiple-roles.spec.ts        test ที่เลือกบทบาทเอง
  .auth/                        ไฟล์สถานะ (สร้างตอนรัน ไม่ถูก commit)
```

config เหมือนบท 41 เกือบทั้งหมด (project `setup` ที่ `testMatch: /.*\.setup\.ts/` และ `chromium` ที่ `dependencies: ["setup"]`) ต่างกันสองข้อ: project `setup` เก็บ `.setup.ts` สองไฟล์ (รันขนานกันได้ เราตรวจแล้วว่าทั้งสองผ่าน) และ project `chromium` **ไม่มี** `storageState` เพราะแต่ละกลุ่ม test จะเลือกเอง ถ้า test ไหนไม่เลือก จะเป็นคนที่ยังไม่ login

### 2. setup สองไฟล์

`user.setup.ts` และ `admin.setup.ts` ทำเหมือนกันทุกบรรทัดตามบท 41 ต่างแค่อีเมล รหัสผ่าน และชื่อไฟล์ปลายทาง:

| ไฟล์ | บัญชี | บันทึกไปที่ |
|---|---|---|
| `user.setup.ts` | `user@dnshop.test` / `password123` | `.auth/user.json` |
| `admin.setup.ts` | `admin@dnshop.test` / `admin123` | `.auth/admin.json` |

ทั้งสองไฟล์ลบ cookie `dn_sid` ก่อนบันทึก (เหตุผลอยู่ในบท 41 หัวข้อ 5) ทำให้ผู้ใช้ทั้งสองคนไม่ผูกกับตะกร้าหรือข้อมูลใดๆ ตอนบันทึก

ในงานจริงที่มีหลายบทบาท ไฟล์ setup ที่ซ้ำกันแบบนี้มักรวมเป็นฟังก์ชันช่วยฟังก์ชันเดียว บทนี้เขียนแยกไว้เพื่อให้อ่านง่าย

### 3. เลือกบทบาทต่อกลุ่มด้วย test.use

```ts
const userFile = path.join(import.meta.dirname, ".auth", "user.json");
const adminFile = path.join(import.meta.dirname, ".auth", "admin.json");

test.describe("ผู้ใช้ทั่วไป", () => {
  test.use({ storageState: userFile });

  test("หน้า /account แสดงสิทธิ์ผู้ใช้ทั่วไป", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByText("สิทธิ์: ผู้ใช้ทั่วไป")).toBeVisible();
  });
});
```

`test.use` มีผลกับทุก test ใน `describe` ที่มันอยู่เท่านั้น (ถ้าเรียกนอก `describe` จะมีผลทั้งไฟล์) fixture `page` ของ test ในกลุ่มนี้เป็นผู้ใช้ทั่วไปทันที เหมือนบท 41 ที่ไม่ต้อง login

### 4. สองบทบาทใน test เดียว: browser.newContext

บางสถานการณ์ต้องมีสองคนพร้อมกันใน test เดียว (เช่น admin ทำอย่างหนึ่ง แล้วดูว่า user เห็นอะไร) fixture `page` มีบทบาทเดียวเท่านั้น จึงสร้างเองจาก fixture `browser`:

```ts
const adminContext = await browser.newContext({ storageState: adminFile });
const userContext = await browser.newContext({ storageState: userFile });
const adminPage = await adminContext.newPage();
const userPage = await userContext.newPage();
// ... ใช้ adminPage และ userPage ...
await adminContext.close();
await userContext.close();
```

- `browser.newContext()` สร้าง "โปรไฟล์ browser ใหม่ที่แยกกัน" (cookie แยก localStorage แยก) เหมือน fixture `page` ใช้ภายใน แต่เราคุมเอง
- ค่าใน `use` ของ config เช่น `baseURL` และ `locale` ถูกใช้ให้ context ที่สร้างเองด้วย เราเรียก `adminPage.goto("/admin/products")` ด้วย path สั้นได้ (ตัวอย่างที่ 2 รันผ่าน)
- context ที่สร้างเองต้อง `close()` เอง ส่วน fixture ปิดให้อัตโนมัติ

### 5. ตัวอย่างที่ 2: admin เพิ่มสินค้า user ไม่เห็น

test ในไฟล์: admin กรอกฟอร์ม "เพิ่มสินค้าใหม่" แล้วเห็นแถวใหม่ในตารางของตัวเอง จากนั้น user เปิด `/products` ได้ "พบสินค้า 10 รายการ" เท่าเดิม และไม่มีลิงก์สินค้าที่เพิ่ม

ทำไม user ไม่เห็น: **แอปนี้เก็บข้อมูลสินค้าแยกตาม session (cookie `dn_sid`)** ไม่ใช่ฐานข้อมูลกลาง สอง context ที่สร้างจากไฟล์สถานะ (ไม่มี `dn_sid` ในไฟล์) ได้ `dn_sid` ใหม่ของตัวเองคนละอัน จึงมีสินค้า ตะกร้า คูปอง คำสั่งซื้อ คนละชุดแม้บัญชีจะต่างกัน นี่คือเหตุที่ test ของคอร์สนี้รันขนานกันได้โดยไม่ชนกัน ส่วนแอปจริงทั่วไปมักเก็บสินค้าในฐานข้อมูลเดียวกัน ซึ่ง user จะเห็นสินค้าที่ admin เพิ่ม ในกรณีนั้นต้องเขียน test ให้ตรงกับพฤติกรรมของแอปจริง อย่าเอาข้อสรุปของแอปตัวอย่างนี้ไปใช้

### 6. สิทธิ์ต่างบทบาท

หน้า `/admin/products` ตอบ HTTP 200 ทั้งสองบทบาท: admin เห็น h1 "จัดการสินค้า" ส่วนผู้ใช้ทั่วไปเห็น h1 "คุณไม่มีสิทธิ์เข้าหน้านี้" จึงตรวจจากข้อความบนหน้า ไม่ใช่ status code (ถ้าอยากตรวจ status 403 จริงๆ ให้เรียก API ตามบท 36) ลิงก์ "จัดการสินค้า" ใน nav มีเฉพาะ admin

## จุดที่มักพลาด

- **เรียก `test.use` ในที่ที่ไม่คิด**: ถ้าเรียกนอก `describe` มีผลกับ test ทั้งไฟล์ ถ้าต้องการต่อกลุ่ม ต้องอยู่ใน `describe` ที่ต้องการ
- **ลืมปิด context ที่สร้างเอง**: ใช้ try/finally หรือ `close()` ท้าย test (context ที่เราสร้างเอง Playwright ไม่ปิดให้ระหว่าง test)
- **ใช้ `page.request` ผิดตัว**: `adminPage.request` ใช้ cookie ของ admin และ `userPage.request` ใช้ของ user ส่วน fixture `request` ไม่มี cookie ของใครเลย
- **คาดว่า user เห็นสินค้าที่ admin เพิ่ม**: ในแอปนี้ไม่เห็น (หัวข้อ 5)
- **รวมสองบทบาทใน test เดียวเกินจำเป็น**: ถ้าแค่ตรวจว่าสิทธิ์ต่างกัน ใช้ `describe` แยกง่ายกว่าและอ่านง่ายกว่า
- **commit ไฟล์ `.auth`**: ถูก ignore แล้ว อย่าเอาออกจาก `.gitignore`

## หน้าในแอปที่ใช้

**`/login`** ใช้ใน setup ทั้งสองไฟล์
**`/account`** แสดง "อีเมล: ...", "สิทธิ์: ผู้ใช้ทั่วไป" หรือ "สิทธิ์: ผู้ดูแลระบบ"
**`/admin/products`** admin: h1 "จัดการสินค้า", ตาราง `aria-label="ตารางสินค้า"`, h2 "เพิ่มสินค้าใหม่" ฟอร์ม label "ชื่อสินค้า", "ราคา", "หมวดหมู่", "จำนวนคงเหลือ" ปุ่ม "เพิ่มสินค้า" สำเร็จแสดง `role="status"` "เพิ่มสินค้าแล้ว" / ผู้ใช้ทั่วไป: h1 "คุณไม่มีสิทธิ์เข้าหน้านี้"
**`/products`** "พบสินค้า 10 รายการ" ตอนยังไม่เพิ่มอะไร

## วิธีรันบทนี้

```bash
pnpm test --config lessons/42-multiple-roles/playwright.config.ts
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `4 passed` (setup 2 + ตัวอย่าง 2) และ `3 skipped`

## แบบฝึกหัดในบทนี้

เปลี่ยน `test.fixme` ในไฟล์ `multiple-roles.spec.ts` ให้เป็น `test` ตามแนวทางในคอมเมนต์ (ข้อ 1 และ 2 ต้องใส่ `test.use` ใน `describe` ที่เตรียมไว้ให้)

1. ผู้ใช้ทั่วไปเปิด `/admin/products` แล้วเห็น "คุณไม่มีสิทธิ์เข้าหน้านี้"
2. admin เปิด `/admin/products` ได้ และเห็นลิงก์ "จัดการสินค้า" ใน nav
3. สอง context พร้อมกัน: user เพิ่มของลงตะกร้าด้วย API ตะกร้าของ user มี 1 ชิ้น แต่ของ admin ยังเป็น 0

## อ่านเพิ่ม

- [Authentication: Multiple signed in roles](https://playwright.dev/docs/auth#multiple-signed-in-roles)
- [Isolation](https://playwright.dev/docs/browser-contexts)
