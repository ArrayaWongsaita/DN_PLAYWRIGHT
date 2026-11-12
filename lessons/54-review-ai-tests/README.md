# บทที่ 54: ตรวจและแก้ test ที่ AI เขียน

บทนี้เขียนให้อ่านเองได้ และ **ทำได้โดยไม่ต้องมี AI** เพราะไฟล์ test ที่ "ดูเหมือน AI เขียน" เตรียมไว้ให้แล้ว งานของคุณคือหาจุดที่ไม่ดีและเขียนใหม่ให้ถูก ซึ่งเป็นทักษะที่ต้องใช้ทุกครั้งที่ AI (หรือเพื่อนร่วมทีม) ส่ง test มาให้

ไฟล์ `ai-written.spec.ts` ถูกรันแล้วผ่านทั้งหมดด้วย config หลักของ repo (รวมถึงรันซ้ำ `--repeat-each=3`) ส่วนคำเตือนของ `pnpm lint` ดูผลจริงในหัวข้อ 3

## จบบทนี้แล้วทำอะไรได้

- ตรวจ test ที่ AI เขียนด้วยเช็กลิสต์ และบอกได้ว่าบรรทัดไหนไม่ดีเพราะอะไร
- เปลี่ยน CSS selector, `waitForTimeout`, `expect(await …isVisible())`, `page.$` เป็นแบบที่ถูกต้อง
- จับ test ที่ "ผ่านแต่ไม่ได้ตรวจอะไร" และ test ที่พึ่งลำดับกัน แล้วแก้ให้ทำงานคนเดียวได้
- ใช้ `pnpm lint` (eslint-plugin-playwright) เป็นด่านแรก และรู้ว่ามันจับอะไรไม่ได้

## เชื่อมกับที่รู้แล้ว

บทนี้รวมสิ่งที่เรียนมาทั้งหมด: `getByRole` (บท 04), assertion ที่รอเอง (บท 11 ถึง 13, 24), เหตุผลที่เลี่ยง CSS (บท 18), การแยก test ออกจากกัน (บท 19, 20), `baseURL` ของ config (บท 01, 23) และเกณฑ์ตรวจ 4 ข้อของบท 52 ใน Jest/Vitest คุณคงเคยทำ code review แบบเดียวกัน แต่ที่ Playwright มีเรื่องเฉพาะคือ test ที่ "ผ่านโดยบังเอิญ" เพราะจังหวะเวลา

## เนื้อหา

### 1. ทำไมต้องตรวจ test ที่ AI เขียน

AI เขียน test ได้เร็วและดูเรียบร้อย แต่มักเขียนเพื่อ "ให้ผ่านตอนนี้" มากกว่าให้ทนทานในระยะยาว ปัญหาพบได้ทั้งตอนที่ AI เดา locator เองและตอนที่มันเปิดหน้าจริงแล้ว ปัญหาหลักที่ทำให้ test เสียหายเงียบๆ:

- ผ่านแต่ไม่ได้ตรวจอะไร (ให้ความรู้สึกปลอดภัยทั้งที่ไม่ปลอดภัย)
- ผ่านบ้างล้มบ้าง (flaky) เพราะจังหวะเวลา
- พังเมื่อ UI เปลี่ยนเล็กน้อยที่ผู้ใช้ไม่เห็น

เมื่อได้ test จาก AI: **รันก่อน, อ่านทุกบรรทัด, ตรวจด้วยเช็กลิสต์ แล้วค่อยเก็บ**

### 2. เช็กลิสต์ตรวจ test ที่ AI เขียน

| ข้อ | ตรวจอะไร | แก้อย่างไร |
|---|---|---|
| 1 | มี CSS selector / XPath ไหม (`page.locator(".card .price")`) | `getByRole`, `getByLabel`, `getByText`, `getByTestId` (บท 04, 05) |
| 2 | มี `waitForTimeout` ไหม | ลบ แล้วใช้ `expect(locator).toBeXxx()` ที่รอเอง (บท 13, 24) |
| 3 | มี `expect(await locator.isVisible()).toBe(true)` หรือ `expect(await ...)` แบบอื่นไหม | `await expect(locator).toBeVisible()` ข้อความผิดพลาดบอกชัดและรอเอง |
| 4 | มี `page.$` / `page.$$` / ElementHandle ไหม | ใช้ `page.locator` / `getByXxx` และ `expect(locator)` |
| 5 | test พึ่งลำดับหรือข้อมูลจาก test อื่นไหม (ตัวแปรร่วม, `serial`, page ที่ใช้ร่วมกัน) | ให้แต่ละ test เตรียมข้อมูลของตัวเอง ใช้ `page` ของ fixture (บท 20) |
| 6 | test จบด้วย assertion ที่ตรวจผลลัพธ์จริงไหม | เพิ่ม `expect` ที่บอกว่า "ผลต้องเป็นอย่างไร" |
| 7 | ใส่ URL เต็มหรือค่าที่ผูกกับเครื่องไหม (`http://localhost:3100/...`) | ใช้ path สั้นๆ แล้วให้ `baseURL` ใน config จัดการ |
| 8 | assertion ตรวจเรื่องที่ตั้งใจจริงๆ ไหม (ไม่ใช่แค่ "หน้าไม่ระเบิด") | ตรวจค่า ข้อความ หรือสถานะที่คือผลของฟีเจอร์ |
| 9 | รัน `--repeat-each=5` แล้วผ่านทุกครั้งไหม | ถ้าผ่านบ้างล้มบ้าง ตามหาจุดที่ไม่รอ |

ข้อ 1 ถึง 7 ตรงกับ "ข้อ N" ในไฟล์ `ai-written.spec.ts` ส่วนข้อ 8 ถึง 9 ใช้กับ test ใหม่ทุกไฟล์

### 3. ให้ `pnpm lint` ช่วยตรวจ (และข้อจำกัดของมัน)

repo นี้ติดตั้ง `eslint-plugin-playwright` ไว้ และปกติกฎเหล่านี้เป็น error สำหรับไฟล์ในบท แต่บท 03, 13, 14, 15, 18 และ 54 ตั้งใจสอนสิ่งที่ปกติเลี่ยง จึง **ลดเป็น warning** (ดู `eslint.config.mjs`) รันคำสั่งนี้แล้วดูคำเตือนของไฟล์ในบทนี้:

```bash
pnpm lint
```

คำสั่งยังจบด้วย exit 0 (มีแต่ warning ไม่มี error) ในผลที่ได้ จะเห็นคำเตือนของ `ai-written.spec.ts` สามข้อ:

| บรรทัดโดยประมาณ | กฎที่เตือน | ตรงกับข้อ |
|---|---|---|
| `waitForTimeout(1500)` | `playwright/no-wait-for-timeout` | ข้อ 2 |
| `expect(await ....isVisible())` | `playwright/prefer-web-first-assertions` | ข้อ 3 |
| `page.$("h1")` | `playwright/no-element-handle` | ข้อ 4 |

เพื่อดูเฉพาะไฟล์ของบทนี้ ใช้ `pnpm exec eslint lessons/54-review-ai-tests` (ได้ผลเดียวกัน) ข้อที่ **lint ไม่เตือนในตั้งค่าของ repo นี้** คือ:

- ข้อ 1 (CSS selector) กฎที่จับได้คือ `playwright/no-raw-locators` ซึ่งไม่ได้เปิดไว้
- ข้อ 5 (พึ่งลำดับ), ข้อ 6 (ไม่มี assertion: กฎ `playwright/expect-expect` ถูกปิดไว้เพราะแบบฝึกหัดของคอร์สเป็น `test.fixme` ที่ยังว่าง) และข้อ 7 (URL เต็ม)

สรุป: lint เป็นด่านแรกที่จับของง่ายๆ ได้เร็ว แต่ไม่แทนการอ่านเอง เช็กลิสต์ข้อ 1, 5, 6, 7 ต้องตรวจด้วยตา

### 4. เขียนใหม่ให้ถูก

ไฟล์ `reviewed.spec.ts` มีตัวอย่างเขียนใหม่ของข้อ 1 และ 2 ให้ดูเป็นแบบ และเว้นข้อ 3 ถึง 7 เป็นแบบฝึกหัด ลำดับขั้นที่แนะนำ:

1. อ่านข้อ N ใน `ai-written.spec.ts` และคอมเมนต์ที่อธิบายปัญหา
2. เขียนใหม่ใน `reviewed.spec.ts` (ข้อ 3 ถึง 7) โดยเปลี่ยน `test.fixme` เป็น `test`
3. รันทั้งบท `pnpm test 54-review-ai-tests` และรันซ้ำ `--repeat-each=5`
4. ตรวจด้วยเช็กลิสต์ในหัวข้อ 2 และ `pnpm lint` ไฟล์ `reviewed.spec.ts` ต้องไม่มีคำเตือนเลย

ตัวอย่างหนึ่งข้อ (ข้อ 2 `waitForTimeout`):

```ts
// ก่อน (AI เขียน)
await page.waitForTimeout(1500);
await expect(page.getByText("พบสินค้า 1 รายการ")).toBeVisible();

// หลัง
await expect(page.getByText("พบสินค้า 1 รายการ")).toBeVisible();
```

`expect(...).toBeVisible()` ลองใหม่เองจนครบเวลาแล้วจบทันทีที่เห็น จึงเร็วกว่าและไม่ล้มเมื่อหน้าช้าลง

## จุดที่มักพลาด

- **ลบ `waitForTimeout` แล้วลืมใส่ assertion ที่รอแทน**: test ผ่านไวเกินหรือล้ม ต้องมี `expect` ที่ตรวจสิ่งที่จะเกิดขึ้นหลังจากนั้น
- **แก้ `isVisible()` แค่เปลี่ยนรูป**: `expect(await x.isVisible()).toBe(true)` เป็น `expect(x).toBeVisible()` (ไม่ใส่ `await`) ผิด ต้อง `await expect(x).toBeVisible()` (ไม่ await แล้ว lint เตือน `missing-playwright-await`)
- **คิดว่า test ผ่านแปลว่า test ดี**: ทุกไฟล์ใน `ai-written.spec.ts` ผ่าน แต่ไม่ดี
- **ลบ test ที่ไม่มี assertion ทิ้งเฉยๆ**: ควรถามว่า test นั้นตั้งใจตรวจอะไร แล้วเติม assertion ไม่ใช่ลบ
- **แก้ test ที่พึ่งลำดับด้วยการเก็บ `serial` ไว้**: serial แก้อาการแต่ test ยังรันตัวเดียวไม่ได้ ต้องให้แต่ละ test เตรียมข้อมูลเอง
- **ใช้ `.first()` / `.nth()` เพื่อให้ผ่าน strict mode**: ซ่อนปัญหาว่า locator ไม่ชัดเจน ลอง `filter` หรือใส่ชื่อให้เฉพาะเจาะจงก่อน
- **เชื่อคำเตือนของ lint ว่าครบแล้ว**: ดูหัวข้อ 3 lint จับข้อ 1, 5, 6, 7 ไม่ได้

## หน้าในแอปที่ใช้

- **`/products`**: รายการสินค้า (list "รายการสินค้า" 10 รายการ), ช่อง "ค้นหาสินค้า", ปุ่ม "ค้นหา", ข้อความ "พบสินค้า N รายการ", ปุ่ม "เพิ่มลงตะกร้า"
- **`/cart`**: list "สินค้าในตะกร้า", ลิงก์ "เลือกซื้อสินค้า" เมื่อตะกร้าว่าง
- **`/stores`**: h1 "สาขาของเรา", รายการ "สาขาสยาม"

## วิธีรันบทนี้

```bash
pnpm test 54-review-ai-tests
pnpm lint
```

ผลที่ควรได้จาก test: `10 passed` และ `5 skipped` (ข้อ 3 ถึง 7 ใน `reviewed.spec.ts` เป็น `test.fixme`) ส่วน `pnpm lint` ได้คำเตือนสามข้อตามหัวข้อ 3 แต่ไม่มี error

ลองดูว่าข้อ 5 ผิดจริง: รัน `pnpm test 54-review-ai-tests -g "ตะกร้ามีเมาส์"` ต้องล้ม เพราะ test นั้นฝากการเพิ่มของไว้กับ test ก่อนหน้า

## แบบฝึกหัดในบทนี้

เขียนใหม่ใน `reviewed.spec.ts` ทีละข้อ (ข้อ N ตรงกับ "ข้อ N" ใน `ai-written.spec.ts`)

3. `expect(await ....isVisible())` เป็นการตรวจแบบ web-first
4. `page.$("h1")` เป็น locator และ `toHaveText`
5. test ที่พึ่งลำดับกัน เป็น test เดียวที่เตรียมข้อมูลเอง
6. test ที่ไม่มี assertion เติมการตรวจผลลัพธ์
7. URL เต็มเป็น path สั้นๆ ที่ใช้ `baseURL`

ทำเสร็จแล้วรัน `pnpm test 54-review-ai-tests --repeat-each=5` และ `pnpm lint` เฉลยอยู่ที่ branch `solutions`

## อ่านเพิ่ม

- [Best practices](https://playwright.dev/docs/best-practices)
- [Assertions (auto-retrying)](https://playwright.dev/docs/test-assertions)
- [eslint-plugin-playwright](https://github.com/mskelton/eslint-plugin-playwright)
