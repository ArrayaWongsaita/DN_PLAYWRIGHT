# บทที่ 49: globalSetup และค่าตั้งค่าจาก .env

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน บทนี้มี config ของตัวเอง และต่อจากบท 41 (storageState) ควรอ่านบท 41 ก่อน

## จบบทนี้แล้วทำอะไรได้

- เขียน `globalSetup` ที่ login ผ่าน API ครั้งเดียวก่อน test ทั้งหมด แล้วเขียน `globalTeardown` เก็บกวาดหลังจบ
- แยกความลับ (อีเมล รหัสผ่าน) ออกจากโค้ดด้วยไฟล์ `.env` และอ่านใน test ด้วย `process.env`
- โหลดไฟล์ `.env` ด้วย `process.loadEnvFile` ของ Node (ไม่ต้องลง dotenv) พร้อมค่า fallback เมื่อไม่มีไฟล์
- รู้ว่าไฟล์ `.env` และ `.auth/` ห้าม commit

## เชื่อมกับที่รู้แล้ว

ใน Jest มี `globalSetup` และ `globalTeardown` ใน `jest.config` เหมือนกัน และคุณน่าจะเคยใช้ `dotenv` โหลดไฟล์ `.env` ใน test ของ Express บทนี้คือแนวคิดเดียวกัน ต่างกันที่ Node 24 มี `process.loadEnvFile()` ในตัว จึงไม่ต้องลงแพ็กเกจเพิ่ม และบท 41 ทำสิ่งเดียวกับ globalSetup ด้วย project `setup` (เป็น test ธรรมดา) บทนี้เทียบให้เห็นอีกวิธี

## เนื้อหา

### 1. globalSetup ต่างจาก project setup ในบท 41 อย่างไร

| | project `setup` (บท 41) | `globalSetup` (บทนี้) |
|---|---|---|
| เขียนเป็น | test ธรรมดา (`setup(...)`) ใช้ fixture ได้ | ฟังก์ชัน async ธรรมดา ไม่มี fixture |
| ปรากฏในรายงาน/trace | ปรากฏ | ไม่ปรากฏ |
| ถ้าล้ม | project ที่พึ่งพาไม่รัน | การรันทั้งหมดหยุด |
| เหมาะกับ | งานที่อยากเห็นผล/trace ของตัวเอง | งานเตรียมสั้นๆ เช่น login ผ่าน API หรือสร้างข้อมูลตั้งต้น |

เอกสาร Playwright แนะนำ project dependencies (แบบบท 41) เป็นทางเลือกหลัก แต่ `globalSetup` ยังใช้ได้และเรียบง่ายกว่าเมื่องานเตรียมไม่ต้องการ browser

โครงสร้างของบทนี้:

```
lessons/49-global-setup-env/
  playwright.config.ts          config: โหลด .env, ตั้ง globalSetup/globalTeardown, storageState
  global-setup.ts               login ผ่าน API แล้วบันทึกลง .auth/user.json
  global-teardown.ts            ลบ .auth/user.json หลัง test จบ
  global-setup-env.spec.ts      test จริง (ไม่มีโค้ด login เลย)
  .env.example                  แม่แบบไฟล์ค่าตั้งค่า (commit ได้)
  .env                          ไฟล์จริงของคุณ (สร้างเอง ไม่ถูก commit)
```

### 2. config: โหลด .env แล้วตั้ง globalSetup

```ts
const envFile = path.join(import.meta.dirname, ".env");
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}
process.env.DN_USER_EMAIL ??= "user@dnshop.test";
process.env.DN_USER_PASSWORD ??= "password123";
```

- `process.loadEnvFile(path)` อ่านไฟล์รูปแบบ `ชื่อ=ค่า` ทีละบรรทัดแล้วใส่เข้า `process.env` เป็นฟังก์ชันในตัวของ Node (repo นี้กำหนด Node 24 จึงใช้ได้เลย)
- ต้องเช็ก `fs.existsSync` ก่อน เพราะถ้าไม่มีไฟล์ `loadEnvFile` โยน error (ถ้าเขียน `process.loadEnvFile(".env")` โดยไม่มีไฟล์ก็ล้มทันที)
- ใช้ path เต็มจาก `import.meta.dirname` เพราะ path แบบสั้นเทียบกับโฟลเดอร์ที่สั่งรัน (root ของ repo) ไม่ใช่โฟลเดอร์บทนี้
- ตัวแปรที่ตั้งไว้ใน environment อยู่แล้ว (เช่นตั้งในขั้นตอน CI) **ไม่ถูกไฟล์ `.env` ทับ** เราลองแล้ว: ใส่ admin ใน `.env` แต่ตั้งค่า user ผ่าน environment ตอนรัน ผลคือ login เป็น user
- `??=` ใส่ค่าให้เฉพาะตอนที่ยังไม่มีค่า จึงเป็น **ค่า fallback**: ตัวอย่างบทนี้เลยรันผ่านได้โดยไม่ต้องมีไฟล์ `.env`
- config ถูกโหลดก่อน globalSetup และ worker จึงเห็นค่าเดียวกันทุกที่

ส่วนที่ตั้ง globalSetup:

```ts
globalSetup: "./global-setup.ts",
globalTeardown: "./global-teardown.ts",
projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE } }],
```

path ของ `globalSetup` เทียบกับไฟล์ config (ต่างจาก `storageState` แบบสั้นที่เทียบกับโฟลเดอร์ที่รัน) ในบทนี้ `AUTH_FILE` เป็น path เต็มจึงไม่มีปัญหา

### 3. อ่าน global-setup.ts

```ts
export default async function globalSetup() {
  const email = process.env.DN_USER_EMAIL;
  const password = process.env.DN_USER_PASSWORD;
  if (!email || !password) throw new Error("ต้องตั้ง DN_USER_EMAIL และ DN_USER_PASSWORD");

  const api = await request.newContext({ baseURL });
  const res = await api.post("/api/auth/login", { data: { email, password } });
  if (!res.ok()) throw new Error(`login ใน global-setup ไม่สำเร็จ: status ${res.status()}`);

  const state = await api.storageState();
  state.cookies = state.cookies.filter((cookie) => cookie.name !== "dn_sid");
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  fs.writeFileSync(authFile, JSON.stringify(state, null, 2));
  await api.dispose();
}
```

- `export default async function` คือรูปแบบที่ Playwright คาดหวัง
- `request.newContext({ baseURL })` สร้าง API client ที่ไม่ต้องมี browser (`request` import จาก `@playwright/test`) ใช้ method `post` แบบเดียวกับ `page.request` ในบท 37 และเก็บ cookie ที่ server ส่งกลับให้เอง
- `api.storageState()` คืน object ของ cookie ที่ได้ (เหมือน `context.storageState()` ในบท 41) ที่นี่เรากรอง `dn_sid` (ตะกร้า) ออกก่อนเขียนไฟล์ เหตุผลเดียวกับบท 41: ให้ทุก test ได้ตะกร้าใหม่ของตัวเอง
- อย่าลืม `await api.dispose()` เพื่อปิด client
- ถ้า login ไม่สำเร็จเราโยน error ให้การรันหยุดพร้อมข้อความที่บอกสาเหตุ (เช่น ใส่รหัสผ่านผิดใน `.env` จะเห็น `Error: login ใน global-setup ไม่สำเร็จ: status 401` และไม่มี test ถูกรัน)
- baseURL มาจาก `playwright.shared.ts` เพราะ global-setup ไม่มี fixture `baseURL` ให้ใช้ และ **webServer ถูกเปิดก่อนรัน globalSetup** (เห็นจากผลรันจริง: login ผ่านโดยที่เราไม่ได้เปิดแอปเอง)

### 4. globalTeardown

```ts
export default async function globalTeardown() {
  fs.rmSync(authFile, { force: true });
}
```

รันครั้งเดียวหลัง test ทั้งหมดจบ ที่นี่เราลบไฟล์สถานะ เพราะมี cookie ที่ login ได้จริง `force: true` ทำให้ไม่โยน error ถ้าไฟล์ไม่มี ในงานจริง teardown มักใช้ลบข้อมูลทดสอบที่ setup สร้างไว้ ผลรันจะแสดงบรรทัด `[global-setup]` ก่อนเริ่ม และ `[global-teardown]` ตอนจบ จึงตามลำดับได้ชัดเจน

### 5. ไฟล์ .env และ .env.example

- `.env` เก็บค่าที่ต่างกันตามเครื่องหรือความลับ (อีเมล/รหัสผ่านบัญชีทดสอบ, URL ของเซิร์ฟเวอร์) **ห้าม commit** repo นี้ใส่ `.env` ไว้ใน `.gitignore` แล้ว
- `.env.example` เป็นแม่แบบที่ commit ได้ บอกว่าต้องมีตัวแปรอะไร (ห้ามใส่ความลับจริง) ผู้ใช้ใหม่ copy เป็น `.env` แล้วแก้ค่า
- ใน test อ่านด้วย `process.env.DN_USER_EMAIL` ค่าที่ได้เป็น `string | undefined` ใน TypeScript

## จุดที่มักพลาด

- **เขียน `process.loadEnvFile(".env")` โดยไม่เช็กไฟล์**: ไม่มีไฟล์แล้ว error ทั้งที่ควรใช้ fallback และ path แบบสั้นจะไปหาที่โฟลเดอร์ที่สั่งรัน
- **commit ไฟล์ `.env` หรือ `.auth/`**: ความลับรั่ว
- **คิดว่า `.env` ทับ environment**: ไม่ทับ ค่าที่ตั้งไว้ก่อนแล้วชนะ (เป็นเรื่องดีสำหรับ CI)
- **ลืมกรอง `dn_sid`**: ทุก test ใช้ตะกร้าเดียวกัน (รายละเอียดในบท 41)
- **ลืม `await api.dispose()`** และลืมสร้างโฟลเดอร์ `.auth` ก่อนเขียนไฟล์ (`fs.mkdirSync(..., { recursive: true })` แก้ได้)
- **ใช้ globalSetup สำหรับงานที่ต้องการ trace หรือ fixture**: ใช้ project setup (บท 41) แทน
- **แก้ `.env` แล้วไม่เห็นผล**: config โหลดตอนเริ่มรัน ต้องสั่งรันใหม่

## หน้าในแอปที่ใช้

**`/api/auth/login`** (POST) รับ `{ email, password }` ตอบ 200 พร้อมตั้ง cookie `dn_auth` ถ้าผิดตอบ 401
**`/account`** ต้อง login ถึงเข้าได้ แสดง "อีเมล: {email}"
**`/login`** ฟอร์ม "อีเมล" "รหัสผ่าน" ปุ่ม "เข้าสู่ระบบ" ผิดแสดง alert "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
**`/`** หัวเว็บของคนที่ login แล้วมีลิงก์ "บัญชีของฉัน"

## วิธีรันบทนี้

```bash
pnpm test --config lessons/49-global-setup-env/playwright.config.ts
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `2 passed` และ `3 skipped` โดยไม่ต้องมีไฟล์ `.env` (ใช้ค่า fallback) และเห็นบรรทัด `[global-setup]` กับ `[global-teardown]`

ถ้าอยากลองใช้ไฟล์ `.env` ให้ copy แม่แบบ (ทำทีละบรรทัด เลือกอันที่ตรงกับเครื่องของคุณ)

macOS / Linux (zsh หรือ bash):

```bash
cp lessons/49-global-setup-env/.env.example lessons/49-global-setup-env/.env
```

Windows (PowerShell):

```powershell
Copy-Item lessons/49-global-setup-env/.env.example lessons/49-global-setup-env/.env
```

แล้วเปิดไฟล์ `.env` แก้ค่าได้ เช่นเปลี่ยนเป็นบัญชี admin (`admin@dnshop.test` / `admin123`) แล้วรันใหม่ จะเห็นบรรทัด `[global-setup]` ขึ้นอีเมลใหม่ ลบไฟล์ `.env` เมื่อลองเสร็จเพื่อกลับไปใช้ค่า fallback

## แบบฝึกหัดในบทนี้

เปลี่ยน `test.fixme` ในไฟล์ `global-setup-env.spec.ts` ให้เป็น `test` แล้วเขียนตามแนวทางในคอมเมนต์

1. ใช้ `test.use` ทับ `storageState` เป็นสถานะว่าง แล้ว login ผ่านหน้า `/login` ด้วยค่าจาก `process.env.DN_USER_EMAIL` และ `process.env.DN_USER_PASSWORD` จนไปถึง `/account`
2. กรอกรหัสผ่านผิด (ต่อ `x` ท้ายค่าใน env) แล้วตรวจ alert "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
3. อ่านไฟล์ `.auth/user.json` ด้วย `fs` แล้วตรวจว่ามี cookie `dn_auth` และไม่มี `dn_sid`

## อ่านเพิ่ม

- [Global setup and teardown](https://playwright.dev/docs/test-global-setup-teardown)
- [Authentication](https://playwright.dev/docs/auth)
- [Node.js: process.loadEnvFile](https://nodejs.org/api/process.html#processloadenvfilepath)
