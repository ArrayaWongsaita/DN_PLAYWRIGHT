# บทที่ 46: เทียบโครงสร้างหน้าด้วย aria snapshot

บทนี้เขียนให้อ่านเองได้ ตัวอย่าง เฉลย และขั้นตอน `--update-snapshots` ในบทนี้ใช้ chromium ผลที่เห็นในบทเป็นผลจากการรันจริง

## จบบทนี้แล้วทำอะไรได้

- ดึงโครงสร้างตามความหมาย (role และชื่อ) ของ element ออกมาดูด้วย `locator.ariaSnapshot()`
- ตรวจโครงสร้างของเมนูและฟอร์มด้วย `toMatchAriaSnapshot` แบบ template ในโค้ด (inline)
- เขียน template ที่ยืดหยุ่น (regular expression, ข้ามบางส่วน) เพื่อให้ไม่พังง่ายเมื่อข้อมูลเปลี่ยน
- ใช้ `--update-snapshots` ให้ Playwright เขียน template ให้ แล้วนำไปใส่ในไฟล์

## เชื่อมกับที่รู้แล้ว

บท 45 เทียบ "ภาพ" ซึ่งแม่นแต่ไวต่อฟอนต์ OS และสีที่เปลี่ยนนิดเดียว ส่วนบทนี้เทียบ "โครงสร้างที่โปรแกรมอ่านหน้าจอเห็น" (accessibility tree) ซึ่งไม่ขึ้นกับสีหรือฟอนต์ จึงเสถียรกว่า และยังบอกด้วยว่าหน้ามีหัวข้อ ปุ่ม ลิงก์ ถูกต้องตาม role หรือไม่ คล้ายกับ snapshot test ของ Jest ที่เก็บข้อความออกมาเทียบ แต่ที่นี่เก็บ "ต้นไม้ของ role" แทน

## เนื้อหา

### 1. aria snapshot คืออะไร

ลองให้ Playwright พิมพ์โครงสร้างของเมนูหลักออกมา:

```ts
console.log(await page.getByRole("navigation", { name: "เมนูหลัก" }).ariaSnapshot());
```

บนหน้าแรกจะได้ผลนี้:

```yaml
- navigation "เมนูหลัก":
  - link "หน้าแรก":
    - /url: /
  - link "สินค้า":
    - /url: /products
  - link "ตะกร้า (0)":
    - /url: /cart
  - link "เข้าสู่ระบบ":
    - /url: /login
```

อ่านได้ดังนี้:

- แต่ละบรรทัดขึ้นต้นด้วย `- ` คือหนึ่ง node: **role** (`navigation`, `link`, `heading`, `textbox`, `button` ...) ตามด้วย **ชื่อ** (accessible name) ในเครื่องหมายคำพูด
- ย่อหน้าเข้าไป (บรรทัดที่อยู่ใต้ `:`) คือลูกของ node นั้น
- ในวงเล็บเหลี่ยมคือ attribute เช่น `[level=1]` (ระดับของ heading) `[disabled]` `[checked]`
- `/url:` คือ property พิเศษของลิงก์
- ข้อความธรรมดาที่ไม่ได้เป็น element เขียนเป็น `- text: ข้อความ`

ตัวนี้คือต้นไม้ชุดเดียวกับที่ `getByRole` ใช้หาของ ถ้าหน้าไหนอ่านใน aria snapshot แล้วไม่เป็นธรรมชาติ ก็แปลว่าคนที่ใช้โปรแกรมอ่านหน้าจอก็อ่านไม่รู้เรื่องเช่นกัน (บท 47 พูดเรื่องนี้ต่อ)

### 2. toMatchAriaSnapshot แบบ inline

```ts
await expect(nav).toMatchAriaSnapshot(`
  - navigation "เมนูหลัก":
    - link "หน้าแรก"
    - link "สินค้า"
    - link /ตะกร้า/
    - link "เข้าสู่ระบบ"
`);
```

template เขียนเป็น template string ในโค้ดเลย (inline) ตัว assertion รอและลองซ้ำเหมือน `expect` ตัวอื่นของ Playwright จุดสำคัญของวิธีเทียบ:

- **เทียบแบบบางส่วน (partial):** template ไม่ต้องเขียนครบทุก node ทุก attribute สิ่งที่เขียนไว้ต้องมีอยู่จริงและเรียงลำดับเดียวกัน แต่ node อื่นที่ไม่ได้เขียนข้ามได้ ตัวอย่างข้างบนไม่เขียน `/url:` เลยก็ผ่าน (ทั้งแบบข้าม `/url:` และแบบข้าม link บางตัว)
- **regular expression:** ชื่อที่เปลี่ยนได้เขียนเป็น `/.../` เช่น `link /ตะกร้า/` ตรงกับ "ตะกร้า (0)" และ "ตะกร้า (3)" ทั้งสองแบบ
- **attribute ที่ระบุต้องตรง:** เขียน `[disabled]` แปลว่าต้อง disabled เขียน `[level=1]` แปลว่าต้องเป็น h1 ถ้าไม่เขียน attribute ก็ไม่เช็กเรื่องนั้น
- ใส่ template ที่ **ย่อหน้าเข้าไปเท่ากันทั้งก้อน** ได้ (Playwright ตัดช่องว่างหน้าบรรทัดให้) แต่ย่อหน้าของลูกต้องลึกกว่าพ่อ

### 3. ตัวอย่างที่ 1: เมนูหลัก

ตัวอย่างแรกในไฟล์ตรวจ nav เหมือนด้านบน ใช้ locator `getByRole("navigation", { name: "เมนูหลัก" })` ใช้ `toMatchAriaSnapshot` กับ locator ตัวนั้นโดยตรง

### 4. ตัวอย่างที่ 2: ฟอร์มเข้าสู่ระบบ

ตัวอย่างที่สองตรวจ `getByRole("main")` ของหน้า `/login` ได้ผลจริงของหน้านี้ (ก่อนกรอก):

```yaml
- main:
  - heading "เข้าสู่ระบบ" [level=1]
  - text: อีเมล
  - textbox "อีเมล"
  - text: รหัสผ่าน
  - textbox "รหัสผ่าน"
  - button "เข้าสู่ระบบ" [disabled]
  - paragraph:
    - link "สมัครสมาชิก":
      - /url: /register
```

template ในไฟล์ข้าม `text:` (ข้อความ label) และลิงก์สมัครสมาชิก เหลือเฉพาะส่วนที่ต้องการเฝ้า (heading, ช่องกรอก, ปุ่ม) หลังกรอกข้อมูล ช่องกรอกจะแสดงค่าด้วย เช่น `- textbox "อีเมล": somchai@example.com` และปุ่มไม่มี `[disabled]` อีกต่อไป (ข้อ 2 ของแบบฝึกหัด)

### 5. เมื่อ snapshot ไม่ตรง

ถ้าลองแก้ template เป็นชื่อที่ไม่มีอยู่จริง เช่น `link "อะไรก็ไม่รู้"` test จะล้มหลังรอ 5 วินาที (timeout ของ expect) พร้อมแสดงส่วนต่าง (`- Expected` และ `+ Received`) ระหว่าง template กับโครงสร้างจริงที่ Playwright เห็น ซึ่งเป็นวิธีง่ายที่สุดในการดูว่าหน้าจริงเป็นอย่างไร

### 6. ให้ Playwright เขียน template ให้ด้วย --update-snapshots

ไม่ต้องพิมพ์ template เอง ให้เขียน `toMatchAriaSnapshot("")` (template ว่าง) หรือ template ที่ล้าสมัย แล้วรัน:

```bash
pnpm test 46-aria-snapshot --update-snapshots
```

ท้ายผลรันจะมีข้อความว่า `New baselines created for: lessons/46-aria-snapshot/...` และ `git apply test-results/rebaselines.patch` สิ่งที่เกิดขึ้นคือ Playwright **ไม่แก้ไฟล์ spec ให้เอง** แต่สร้างไฟล์ patch ไว้ใน `test-results/` ให้คุณตรวจดูก่อน แล้วรันคำสั่งที่มันบอกเพื่อใส่ template ลงไฟล์:

```bash
git apply test-results/rebaselines.patch
```

เมื่อรันตามนี้ template ในไฟล์จะถูกแทนด้วยโครงสร้างจริงของ element (รวม `/url:` ทุกลิงก์) และรันซ้ำจะผ่าน ข้อควรระวัง:

- patch เขียนโครงสร้าง **ครบทุก node** ลงไป ซึ่งละเอียดเกินกว่าจะเฝ้าทั้งหมด ให้อ่านแล้วลบส่วนที่ไม่ต้องการเฝ้า (เช่น `/url:`) หรือเปลี่ยนชื่อที่เปลี่ยนได้ให้เป็น regular expression
- `--update-snapshots` ทำกับ test ที่ **ไม่ตรง** ทุกตัวที่รันในครั้งนั้น ถ้า test ล้มเพราะบั๊กจริง การอัปเดตจะ "บันทึกบั๊กเป็นค่าที่ถูก" ดูผลต่างก่อนเสมอ
- คำสั่ง `git apply` ต้องรันในโฟลเดอร์ repo และใช้ได้กับไฟล์ที่ยังไม่ได้ commit

## จุดที่มักพลาด

- **ใช้ชื่อที่เปลี่ยนได้แบบตรงตัว** เช่น `link "ตะกร้า (0)"` จะล้มเมื่อมีของในตะกร้า ใช้ `/ตะกร้า/`
- **เขียน template ละเอียดเกินไป** ทำให้พังทุกครั้งที่ UI ขยับนิดเดียว เฝ้าเฉพาะส่วนที่ต้องการ
- **ลืมว่ามี attribute**: `heading "..."` ไม่เช็กระดับ ถ้าต้องการเช็กให้ใส่ `[level=1]`
- **กรอกฟอร์มแล้วตรวจทันทีโดยไม่รอ**: ตรวจก่อนว่ากรอกครบแล้วด้วยสิ่งที่รอได้ เช่น `toBeEnabled()` ของปุ่มที่ disabled จนกว่าจะกรอกครบ
- **ใส่ `--update-snapshots` โดยไม่ดู patch**: ได้ template ของหน้าที่พังมาเป็นค่าที่ถูก
- **ย่อหน้าผิด**: ลูกต้องย่อหน้าลึกกว่าพ่อ และบรรทัดพ่อลงท้ายด้วย `:`
- **คิดว่าตรวจแทน assertion อื่นได้ทุกอย่าง**: aria snapshot ดูโครงสร้างและ role ไม่ได้ดูสีหรือตำแหน่ง ใช้ร่วมกับบท 45 ได้

## หน้าในแอปที่ใช้

**`/`** หน้าแรก: `<nav aria-label="เมนูหลัก">` ลิงก์ "หน้าแรก", "สินค้า", "ตะกร้า (N)", "เข้าสู่ระบบ" และส่วนท้ายหน้า (`<footer>` role `contentinfo`) ที่มีลิงก์ "สาขาของเรา" และ "Playground"
**`/login`** เข้าสู่ระบบ: h1 "เข้าสู่ระบบ", ช่อง "อีเมล" และ "รหัสผ่าน", ปุ่ม "เข้าสู่ระบบ" ที่ disabled จนกว่าจะกรอกทั้งสองช่อง
**`/register`** สมัครสมาชิก: fieldset "หมวดที่สนใจ" (role `group`) มี checkbox "อุปกรณ์ไอที", "เสื้อผ้า", "ของใช้ในบ้าน", "หนังสือ"

## วิธีรันบทนี้

```bash
pnpm test 46-aria-snapshot
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `3 skipped`

## แบบฝึกหัดในบทนี้

ทำในไฟล์ `aria-snapshot.spec.ts` เปลี่ยน `test.fixme` เป็น `test` ทีละข้อ

1. ตรวจโครงสร้างของ footer (`getByRole("contentinfo")`) ว่ามีลิงก์ "สาขาของเรา" และ "Playground"
2. กรอกฟอร์ม `/login` แล้วตรวจ aria snapshot ว่าช่องกรอกแสดงค่าที่กรอก และปุ่มไม่ disabled
3. ติ๊ก checkbox "หนังสือ" ใน `/register` แล้วตรวจ snapshot ของกลุ่ม "หมวดที่สนใจ" ว่า "หนังสือ" เป็น `[checked]` และอีก 3 อันไม่ได้ติ๊ก

ถ้าไม่แน่ใจว่า template ควรหน้าตาเป็นอย่างไร ให้ `console.log` ผลของ `ariaSnapshot()` ดู หรือใช้ `--update-snapshots` ตามหัวข้อ 6

## อ่านเพิ่ม

- [Snapshot testing: aria snapshots (playwright.dev)](https://playwright.dev/docs/aria-snapshots)
- [toMatchAriaSnapshot (playwright.dev)](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-match-aria-snapshot)
