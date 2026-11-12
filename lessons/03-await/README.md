# บทที่ 03: ทำไมต้อง await 🏫

## จบบทนี้แล้วทำอะไรได้

- อธิบายได้ว่าทำไมทุกคำสั่งที่คุยกับหน้าเว็บต้องมี `await`
- รู้อาการที่เกิดจริงเมื่อลืม `await` (ผ่านหลอก, ผลไม่คงที่, error แปลกๆ)
- ใช้ `pnpm lint` หาจุดที่ลืม `await` ได้
- เติม `await` ให้ test ที่ลืมได้ถูกจุด

## เชื่อมกับที่รู้แล้ว

คุณใช้ `await` กับ Supertest มาแล้ว (`const res = await request(app).get(...)`) และรู้ว่าถ้าลืม `await` ค่าที่ได้จะเป็น Promise ไม่ใช่ผลลัพธ์ Playwright เป็นเรื่องเดียวกัน แต่ **อาการตอนลืมแย่กว่า** เพราะ test มักไม่แดงทันทีให้เห็น

## เนื้อหา

ทุกคำสั่งที่คุยกับ browser (`page.goto`, `expect(...).toBeVisible()`, และอีกหลายตัวที่จะเจอในบทถัดไป) เป็น **async** คืน Promise ถ้าไม่ `await` โค้ดจะวิ่งไปบรรทัดถัดไปทันทีโดยไม่รอให้คำสั่งนั้นทำเสร็จ

```ts
// ถูก: รอหน้าโหลดเสร็จ แล้วค่อยตรวจ
await page.goto("/stores");
await expect(page.getByRole("heading", { name: "สาขาของเรา" })).toBeVisible();

// ผิด: ไม่รอ assertion
await page.goto("/stores");
expect(page.getByRole("heading", { name: "สาขาของเรา" })).toBeVisible();
```

### อาการที่เกิดจริงบน Playwright 1.65

เราลองรันโค้ดที่ลืม `await` จริงบนเวอร์ชันที่ใช้ในคอร์สนี้ (`@playwright/test` 1.65) ได้ผลดังนี้ จะเห็นว่า **ไม่ได้ผ่านหลอกเสมอไป** แต่ผลไม่แน่นอน ซึ่งแย่กว่า

| โค้ดที่ลืม `await` | อาการที่เห็น |
|---|---|
| `expect(...).toBeVisible()` ที่ค่า **ถูกอยู่แล้ว** | **ผ่านหลอก** test เขียวทั้งที่ไม่ได้รอ assertion ถ้าวันหนึ่งหน้าเว็บพังตอนที่ assertion ยังไม่ทันถูกตรวจ มันก็อาจยังเขียวอยู่ |
| `expect(...).toBeVisible()` ที่ค่า **ผิด** (เช่นชื่อ heading ไม่มีจริง) | แดง แต่ error แปลก: `element(s) not found` พร้อม `- Test ended.` ในบันทึกการรอ ชี้ไปที่บรรทัดของ `expect` ที่ลืม Playwright 1.65 จับ assertion ที่ค้างตอน test จบแล้วรายงานให้ แต่ถ้า assertion เดียวกันถูกต้องอยู่แล้วก็ไม่มีอะไรเตือน (แถวบน) |
| `page.goto("/login")` ไม่ `await` แล้วตรวจต่อ | **ผลไม่คงที่** เรารันซ้ำ 8 รอบ บางรอบผ่าน บางรอบแดงด้วย `Error: page.goto: Test ended.` บอกแค่ว่า goto ยังไม่ทันเสร็จตอน test จบ |
| `page.getByRole(...).click()` ไม่ `await` แล้วจบ test เลย | ผ่านหรือแดง (`locator.click: Test ended.`) แล้วแต่จังหวะ |
| `fill` ไม่ `await` แล้วตรวจต่อเลย | ผ่านหรือแดงแล้วแต่จังหวะเช่นกัน เพราะ `expect` ที่ตามมามีการรอ จึงบังเอิญชดเชยได้ |

สรุปที่ควรจำ:

1. test ที่ลืม `await` **ไม่ได้การันตีว่าจะแดง** และ "ผ่าน" ก็ไม่ได้แปลว่าถูก
2. ผลอาจต่างกันในแต่ละรอบ นี่คือต้นเหตุของ test ที่ "บางวันพัง บางวันไม่พัง"
3. error ที่ขึ้นว่า `Test ended` เกือบทุกครั้งแปลว่ามี `await` ที่ขาดอยู่ ให้ไล่หาบรรทัดที่ถูกชี้

### ให้เครื่องมือช่วยหา: ESLint

โปรเจกต์นี้ตั้ง ESLint ไว้แล้ว มีสองกฎที่จับ `await` ที่ขาด:

- `@typescript-eslint/no-floating-promises`: เจอ Promise ที่ปล่อยลอยไม่มี `await`
- `playwright/missing-playwright-await`: เจอ `expect(...)` และคำสั่งของ Playwright ที่ไม่มี `await`

ในบทอื่นสองกฎนี้เป็น error (ทำให้ `pnpm lint` ไม่ผ่าน) แต่ **ไฟล์ของบทนี้ตั้งเป็น warning** เพราะเราตั้งใจใส่ `await` ที่ขาดไว้ให้คุณหา รัน:

```bash
pnpm lint
```

จะเห็นคำเตือนของไฟล์ `lessons/03-await/await.spec.ts` ระบุบรรทัดและกฎ เช่น `'toBeVisible' must be awaited or returned` เมื่อเติม `await` ครบ คำเตือนของข้อนั้นจะหายไป

ตอนเขียน test ใน VS Code จะเห็นเส้นหยักใต้บรรทัดเหล่านี้ทันทีถ้าติดตั้ง ESLint extension ไว้

## จุดที่มักพลาด

- **คิดว่า test เขียว = test ถูก**: ถ้าลืม `await` ที่ `expect` test อาจเขียวโดยไม่ได้ตรวจอะไรเลย
- **ใส่ `await` ผิดที่**: `expect(await page.title()).toBe(...)` ใช้ได้ แต่ไม่ใช่วิธีที่ดี (ไม่รอซ้ำ) ใช้ `await expect(page).toHaveTitle(...)` ดีกว่า เหตุผลอยู่ในบท 13
- **ไม่ได้ใส่ `await` ตอนเก็บ locator ไว้ในตัวแปร**: `const heading = page.getByRole("heading")` ไม่ต้อง `await` เพราะแค่สร้าง locator ยังไม่ได้ไปหาของบนหน้า ต้อง `await` ตอนสั่งทำ เช่น `await expect(heading).toBeVisible()`
- **ใช้ `forEach` กับ `await` ข้างใน**: `await` ใน callback ของ `forEach` ไม่ได้รอให้ใคร (บทที่ใช้ list จะพูดถึงอีกครั้ง)

## หน้าในแอปที่ใช้

| หน้า | สิ่งที่ตรวจ |
|---|---|
| `/stores` | heading "สาขาของเรา" |
| `/cart` | title "ตะกร้าสินค้า \| DN Shop" และ heading "ตะกร้าสินค้า" |
| `/products` | heading "สินค้าทั้งหมด" |
| `/login` | title "เข้าสู่ระบบ \| DN Shop" |
| `/help/ordering` | title "คู่มือการสั่งซื้อ \| DN Shop" และ heading "คู่มือการสั่งซื้อ" |
| `/playground` | heading "Playground" |

## วิธีรันบทนี้

```bash
pnpm test 03-await
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `4 skipped`

ดูคำเตือนด้วย:

```bash
pnpm lint
```

รันซ้ำหลายรอบเพื่อดูว่าผลคงที่ไหม (ใช้กับข้อ 2):

```bash
pnpm test 03-await --repeat-each=5
```

## แบบฝึกหัดในบทนี้

ข้อ 1–3 มีโค้ดที่ลืม `await` อยู่ในไฟล์แล้ว ให้เปลี่ยน `test.fixme` เป็น `test` รันดูอาการก่อน แล้วค่อยแก้

1. `/products`: ขาด 1 จุด ที่ `expect` รันดูว่า "ผ่านหลอก" แล้วลองใส่ชื่อ heading ผิดดูอาการ
2. `/login`: ขาดที่ `page.goto` รันซ้ำหลายรอบดูว่าผลคงที่ไหม
3. `/help/ordering`: ขาดหลายจุด ใช้ `pnpm lint` นับว่าเตือนกี่บรรทัด แล้วแก้ให้หมด
4. เขียน test เองสำหรับ `/playground` โดย `await` ครบ จากนั้นลองลบ `await` ออกเพื่อดูคำเตือนของ `pnpm lint`

## อ่านเพิ่ม

- [Writing tests (async/await ใน Playwright)](https://playwright.dev/docs/writing-tests)
- [Assertions (web-first assertions ต้อง `await`)](https://playwright.dev/docs/test-assertions)
- [eslint-plugin-playwright: กฎ `missing-playwright-await`](https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/missing-playwright-await.md)
- [typescript-eslint: กฎ `no-floating-promises`](https://typescript-eslint.io/rules/no-floating-promises/)
