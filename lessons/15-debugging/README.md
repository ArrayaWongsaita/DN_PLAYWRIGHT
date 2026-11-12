# บทที่ 15: Debug test ทีละขั้น 🏫

## จบบทนี้แล้วทำอะไรได้

- รัน test แบบ `--debug` เพื่อเปิด Playwright Inspector และเดินทีละคำสั่ง
- ใช้ `page.pause()` หยุดดูหน้าเว็บ ณ จุดที่สงสัย
- ใช้ Pick locator เพื่อหา locator ที่ถูกต้องจากหน้าจริง
- ใช้ VS Code extension ตั้ง breakpoint, รันและ debug test, และเลือก locator จากหน้าเว็บ

## เชื่อมกับที่รู้แล้ว

บท 14 ใช้ trace ดูย้อนหลังหลัง test พังไปแล้ว บทนี้เป็นอีกด้าน คือ **หยุดดูระหว่างที่ test กำลังรัน** เหมาะเมื่อกำลังเขียน test ใหม่ หรืออยากเห็นหน้าตอนนั้นสดๆ แทนการดูจากบันทึก เครื่องมือทั้งสองใช้ร่วมกันได้ trace ตอบว่า "เกิดอะไรขึ้น" ส่วน debugger ช่วยให้ลองแก้ locator ได้ทันที

## เนื้อหา

### 1. รันด้วย --debug

```bash
pnpm test 15-debugging -g "ตัวอย่างที่ 1" --debug
```

`--debug` เปลี่ยนวิธีรันให้เหมาะกับการ debug คือ เปิดเบราว์เซอร์แบบเห็นหน้าจอ (headed), ตั้งเวลารอเป็นไม่จำกัด (ไม่มี timeout ระหว่างที่ดูอยู่), รันทีละ test และเปิดหน้าต่าง **Playwright Inspector** ขึ้นมาพร้อมเบราว์เซอร์ test จะหยุดรอที่คำสั่งแรกก่อน

ใน Inspector (แถบเครื่องมือด้านบน):

| ปุ่ม | ทำอะไร |
|---|---|
| **Resume** (F8) | รันต่อจนถึงจุดหยุดถัดไป (`page.pause()`) หรือจนจบ test |
| **Step over** (F10) | รันคำสั่งถัดไปหนึ่งคำสั่ง แล้วหยุดรอ |
| **Pick locator** | คลิกแล้วเอาเมาส์ชี้ element ในเบราว์เซอร์ จะเห็น locator ที่ Playwright แนะนำ คลิกเพื่อเก็บค่าไว้ในช่อง |
| ช่อง locator | แก้ locator ตรงนี้ได้ element ที่ตรงจะถูกไฮไลต์ในเบราว์เซอร์ทันที และบอกด้วยว่าเจอกี่ element |

ระหว่างหยุด ให้ดู 3 อย่าง: บรรทัดที่กำลังจะทำ (ไฮไลต์ในโค้ด), element ที่ locator ชี้ในเบราว์เซอร์, และ log ของ Playwright (เช่นกำลังรออะไรอยู่) ใช้ Pick locator กับ Inspector เพื่อหา locator แบบ role, text หรือ test id ที่เจาะจงให้เอง

เมื่อ test ใหญ่และอยากข้ามไปถึงจุดที่สงสัย ใช้ `page.pause()` ในหัวข้อต่อไป

### 2. page.pause()

```ts
await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
await page.pause();   // หยุดตรงนี้
await expect(page).toHaveURL("/account");
```

- รันด้วย `--debug` (หรือ `--headed`): พอ test ถึงบรรทัดนี้จะหยุด หน้าเบราว์เซอร์ยังเล่นได้ ใช้ดู คลิก และลอง locator ได้ กด **Resume** เพื่อไปต่อ
- รันแบบปกติ (headless ไม่มีหน้าจอ): `page.pause()` **ไม่ทำอะไร** test ผ่านบรรทัดนี้ไปเลย จึงไม่ทำให้ CI ค้าง แต่ก็ไม่ควรทิ้งไว้ใน test ที่ส่งเข้า repo
- ใส่ `await page.pause()` ก่อนบรรทัดที่สงสัย แล้ว Resume รอบเดียวก็ถึงจุดนั้นได้ ไม่ต้องกด Step over ทุกคำสั่ง

ในโฟลเดอร์ `lessons/15-debugging` มีเพียงข้อ 3 ที่มี `page.pause()` และอยู่ใน `test.fixme` ตลอด `main` จะไม่มี `page.pause()` ค้างนอก `test.fixme`

### 3. VS Code extension

1. เปิด VS Code ไปที่ Extensions (Ctrl+Shift+X / Cmd+Shift+X) ค้นหา "Playwright" ติดตั้งตัวที่เป็นของ Microsoft (Playwright Test for VS Code)
2. เปิดโฟลเดอร์โปรเจกต์นี้ แล้วคลิกไอคอน **Testing** (รูปขวดทดลอง) ที่แถบด้านซ้าย จะเห็น Test Explorer (รายการ test) และแผง **Playwright** (ด้านล่าง) ที่มีตัวเลือก Show browser, Pick locator, Record new
3. **รัน test**: คลิกลูกศรสามเหลี่ยมสีเขียวข้างชื่อ test (ไฟล์ หรือโฟลเดอร์ก็ได้) ผลผ่าน/ไม่ผ่านขึ้นที่บรรทัดนั้นเลย
4. **ตั้ง breakpoint**: คลิกที่ขอบซ้ายข้างเลขบรรทัดจนเป็นจุดแดง
5. **Debug**: คลิกขวาที่ลูกศรสามเหลี่ยมข้างชื่อ test แล้วเลือก **Debug Test** เบราว์เซอร์จะเปิดและ test หยุดที่ breakpoint ใช้ปุ่มควบคุมของ VS Code (Continue, Step Over ฯลฯ) เดินต่อและดูค่าตัวแปรได้
6. **Show browser**: ติ๊กในแผง Playwright เพื่อให้ test รันแบบเห็นเบราว์เซอร์ จากนั้นคลิกที่ locator ในโค้ด จะเห็นไฮไลต์ element นั้นในเบราว์เซอร์ (และบอกถ้าเจอหลาย element)
7. **Pick locator**: คลิกปุ่ม Pick locator ในแผง Playwright คลิก element ที่ต้องการในเบราว์เซอร์ locator ที่แนะนำจะขึ้นใน VS Code กด Enter เพื่อคัดลอกแล้ววางลงโค้ด (กด Escape เพื่อยกเลิก)
8. ถ้า test พัง ข้อความ error (Expected/Received และ call log) แสดงในตัว editor ตรงบรรทัดที่พัง

ไม่ต้องรันในเทอร์มินัลเลยก็ได้ แต่คำสั่ง `pnpm test ... --debug` ใช้ได้ทุกที่ไม่ว่าจะใช้ editor อะไร

### เทียบ 3 วิธีที่ได้เรียนมา

| วิธี | ใช้เมื่อ |
|---|---|
| Trace Viewer (บท 14) | test พังไปแล้ว (เช่นบน CI) อยากรู้ว่าเกิดอะไร |
| `--debug` / `page.pause()` | เขียน test อยู่ อยากหยุดดูหน้าจริง ลอง locator สดๆ |
| VS Code extension | อยู่ใน editor อยู่แล้ว อยากตั้ง breakpoint และเห็นผลที่บรรทัดโค้ด |

## จุดที่มักพลาด

- **ลืมลบ `page.pause()`**: ทิ้งไว้แล้ว commit ไป ตอนรันบนเครื่องที่มีหน้าจออาจหยุดค้าง
- **รัน `--debug` โดยไม่กรองด้วย `-g`**: ทุก test ในบทจะเปิด Inspector ทีละตัว ใส่ `-g "ข้อ 1"` เพื่อเลือกเฉพาะข้อ
- **ปิดหน้าต่างเบราว์เซอร์กลางคัน**: test จะพังด้วย error ว่า browser/page ปิดแล้ว ให้กด Resume จนจบ หรือกด `Ctrl+C` ในเทอร์มินัล
- **คิดว่า Pick locator ให้คำตอบสุดท้าย**: ได้จุดเริ่มต้นที่ดี ควรอ่านและปรับให้อ่านง่าย เช่น เลือกชื่อ role/ข้อความที่ผู้ใช้เห็น
- **เดาแทนที่จะเดินดู**: ถ้า test พังและยังไม่รู้สาเหตุ อย่าเพิ่งแก้ ให้เดินทีละขั้นแล้วดูหน้าจริงก่อน

## หน้าในแอปที่ใช้

- **`/login`**: ช่อง "อีเมล", "รหัสผ่าน", ปุ่ม "เข้าสู่ระบบ" (user@dnshop.test / password123 → ไปหน้า `/account`)
- **`/cart`**: ช่อง "โค้ดส่วนลด" + ปุ่ม "ใช้โค้ด" (DN10 ลด 10%), `data-testid` `total`
- **`/products/p01`**: ปุ่ม "เพิ่มลงตะกร้า" (ข้อความยืนยันขึ้นหลังหน่วง 800ms)
- **`/register`**: ช่อง "อีเมล" (ชื่อ label ซ้ำกับ checkbox "รับข่าวสารทางอีเมล")

## วิธีรันบทนี้

```bash
pnpm test 15-debugging
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `1 passed` และ `3 skipped`

ฝึกใช้ Inspector กับตัวอย่างที่ 1 (ที่ผ่านอยู่แล้ว):

```bash
pnpm test 15-debugging -g "ตัวอย่างที่ 1" --debug
```

แบบฝึกหัดแต่ละข้อ: เปลี่ยน `test.fixme` ของข้อนั้นเป็น `test` รันด้วย `--debug` เดินดู หาสาเหตุ แก้แล้วรันแบบปกติ (ไม่ใส่ `--debug`) ให้ผ่าน เช่น

```bash
pnpm test 15-debugging -g "ข้อ 1" --debug
pnpm test 15-debugging -g "ข้อ 1"
```

## แบบฝึกหัดในบทนี้

1. เดินทีละขั้นด้วย Inspector หาว่าทำไมยอดสุทธิไม่ถูก (ดูหน้าตะกร้าตอนหยุด)
2. ใช้ Pick locator เลือก locator ของช่องอีเมลที่ตรงกับ 1 element
3. ใช้ `page.pause()` ดูหน้าหลังกดเข้าสู่ระบบ แล้วแก้ test และลบ `page.pause()` ออก

## อ่านเพิ่ม

- [Debugging Tests](https://playwright.dev/docs/debug)
- [Playwright VS Code extension](https://playwright.dev/docs/getting-started-vscode)
- [Page: pause](https://playwright.dev/docs/api/class-page#page-pause)
