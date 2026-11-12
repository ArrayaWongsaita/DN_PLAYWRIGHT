# บทที่ 02: วิธีรัน test แบบต่างๆ 🏫

## จบบทนี้แล้วทำอะไรได้

- รัน test ทั้งบท เฉพาะไฟล์ หรือเฉพาะบางข้อได้
- ดู browser ทำงานจริงด้วย `--headed` และเปิด UI mode ด้วย `pnpm test:ui`
- เปิด HTML report เพื่อหาสาเหตุที่ test พังได้
- รันเฉพาะข้อที่พังรอบก่อนด้วย `--last-failed`

## เชื่อมกับที่รู้แล้ว

เหมือนที่ใน Jest คุณรัน `npm test lessons/01` หรือ `-t "ชื่อ"` ได้ Playwright ก็มีของแบบเดียวกัน: ใส่ชื่อโฟลเดอร์/ไฟล์ต่อท้าย และใช้ `-g` (grep) แทน `-t` ส่วน `--headed`, UI mode และ HTML report เป็นของที่ Playwright มีเพิ่มเพราะมันควบคุม browser จริง

## เนื้อหา

คำสั่ง `pnpm test` คือทางลัดของ `playwright test` ตัวเลือกต่างๆ พิมพ์ต่อท้ายได้เลย:

| ต้องการ | คำสั่ง |
|---|---|
| รันทุกบท | `pnpm test` |
| รันทั้งบท | `pnpm test 02-running-tests` |
| รันไฟล์เดียว | `pnpm test running-tests.spec.ts` |
| รันเฉพาะข้อที่ชื่อมีคำนี้ | `pnpm test 02-running-tests -g "/cart"` |
| ดู browser ทำงานจริง | `pnpm test 02-running-tests --headed` |
| UI mode (หน้าต่างโปรแกรมสำหรับรันและดู test) | `pnpm test:ui` |
| เปิด HTML report ของการรันล่าสุด | `pnpm report` |
| รันเฉพาะข้อที่พังรอบก่อน | `pnpm test --last-failed` |

### `-g` (grep)

`-g "คำ"` เลือกเฉพาะ test ที่ **ชื่อ** มีคำนั้น ในบทนี้ชื่อ test ใส่ path ของหน้าไว้ (เช่น `/cart`) เพื่อให้พิมพ์ค้นหาได้ง่ายโดยไม่ต้องพิมพ์ภาษาไทยในคำสั่ง (PowerShell บาง version แสดงภาษาไทยในคำสั่งเพี้ยน)

### `--headed`

ปกติ Playwright รัน browser แบบ **headless** คือไม่เปิดหน้าต่างขึ้นมาให้เห็น ใส่ `--headed` เพื่อให้เห็นหน้าต่างจริง เหมาะกับตอนอยากดูว่า test ทำอะไรอยู่ แต่ test สั้นมากจะเห็นแวบเดียว

### UI mode

`pnpm test:ui` เปิดหน้าต่างที่แสดงรายการ test ทางซ้าย กดรันทีละข้อ แล้วเลื่อนดูทีละ action พร้อมภาพหน้าจอของแต่ละขั้น เหมาะกับตอนเขียน test ใหม่และตอนหาสาเหตุที่พัง

### HTML report

ทุกครั้งที่รัน Playwright จะสร้างรายงานไว้ในโฟลเดอร์ `playwright-report` (ตั้งให้ไม่เปิดเองอัตโนมัติ) `pnpm report` เปิดรายงานนั้นในเว็บ browser ถ้ามี test พัง จะเห็นรายละเอียด error และภาพหน้าจอตอนพัง กด `Ctrl+C` ใน terminal เพื่อปิด server ของรายงาน

### `--last-failed`

รันเฉพาะ test ที่พังในรอบก่อน เหมาะกับตอนแก้ test หลายข้อที่พังพร้อมกัน ไม่ต้องรันทั้งไฟล์ซ้ำ

## จุดที่มักพลาด

- **ทิ้ง `.only` ไว้**: `test.only(...)` ทำให้ Playwright รันแค่ข้อนั้นและข้ามข้ออื่นหมด ใช้ชั่วคราวตอนลองได้ แต่ **ห้าม commit `.only`** (`pnpm lint` จะแจ้ง error ให้)
- **ลืมว่า skipped ไม่ใช่ผ่าน**: ข้อที่ยังเป็น `test.fixme` ไม่ได้ถูกรัน
- **`-g` ไม่เจอ test เลย**: ขึ้น `Error: No tests found` ให้ตรวจว่าคำที่ใส่ตรงกับชื่อ test จริงๆ (แยกตัวพิมพ์เล็ก/ใหญ่ไม่สนใจ แต่ต้องสะกดตรง)
- **`--last-failed` ตอนรอบก่อนไม่มี test พัง**: จะขึ้น `No tests found` และ exit 1 ไม่ใช่เรื่องผิดปกติ แปลว่าไม่มีข้อไหนต้องรันซ้ำ
- **`pnpm report` ค้างอยู่**: คำสั่งนี้เปิด server ค้างไว้ ต้องกด `Ctrl+C` เพื่อกลับมาพิมพ์คำสั่งต่อ
- **เปิด `pnpm test:ui` ไว้แล้วรัน `pnpm test` ซ้อน**: ใช้ได้ แต่หน้าจะสับสน ปิด UI mode ก่อนจะง่ายกว่า

## หน้าในแอปที่ใช้

บทนี้ใช้ได้ทุกหน้า แต่ละข้อแค่เปิดหน้าแล้วตรวจ heading (`h1`) ของหน้านั้น

| หน้า | heading |
|---|---|
| `/` | DN Shop |
| `/playground` | Playground |
| `/products` | สินค้าทั้งหมด |
| `/cart` | ตะกร้าสินค้า |
| `/login` | เข้าสู่ระบบ |
| `/stores` | สาขาของเรา |
| `/help/ordering` | คู่มือการสั่งซื้อ |

## วิธีรันบทนี้

```bash
pnpm test 02-running-tests
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `5 skipped` แต่ละข้อของแบบฝึกหัดระบุวิธีรันของตัวเองไว้ในไฟล์ spec ให้ทำตามนั้น

## แบบฝึกหัดในบทนี้

ทุกข้อเป็น "เขียน test ให้เสร็จ แล้วรันด้วยวิธีที่กำหนด"

1. `/products` มีหัวข้อ "สินค้าทั้งหมด" รันทั้งบท
2. `/cart` มีหัวข้อ "ตะกร้าสินค้า" รันเฉพาะข้อนี้ด้วย `-g "/cart"`
3. `/login` มีหัวข้อ "เข้าสู่ระบบ" รันด้วย `--headed`
4. `/stores` มีหัวข้อ "สาขาของเรา" รันใน UI mode (`pnpm test:ui`)
5. `/help/ordering` มีหัวข้อ "คู่มือการสั่งซื้อ" ทำให้พังโดยตั้งใจ เปิด `pnpm report` ดู แล้วแก้กลับและรันด้วย `--last-failed`

## อ่านเพิ่ม

- [Running and debugging tests](https://playwright.dev/docs/running-tests)
- [UI Mode](https://playwright.dev/docs/test-ui-mode)
- [Command line (รายการตัวเลือกของ `playwright test`)](https://playwright.dev/docs/test-cli)
- [Reporters (HTML report)](https://playwright.dev/docs/test-reporters)
