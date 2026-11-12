# บทที่ 41: login ครั้งเดียว ใช้ซ้ำทุก test (storageState)

บทนี้เขียนให้อ่านเองได้ ตัวอย่างทุกอันรันได้จริง ลองรันแล้วแก้ค่าเล่นดูระหว่างอ่าน

## จบบทนี้แล้วทำอะไรได้

- อธิบายได้ว่าทำไมไม่ควร login ผ่านหน้าเว็บใน test ทุกตัว
- เขียน project `setup` ที่ login ครั้งเดียวแล้วบันทึกสถานะลงไฟล์ ด้วย `context.storageState({ path })`
- ตั้ง `dependencies` และ `storageState` ใน config ให้ทุก test เริ่มด้วยสถานะที่ login แล้ว
- ทับ `storageState` เฉพาะบางกลุ่ม test (เช่นกลุ่มที่ต้องเป็นคนที่ยังไม่ login) ด้วย `test.use`

## เชื่อมกับที่รู้แล้ว

ใน Jest + Supertest เรามักเขียน `beforeAll` ที่ login ครั้งเดียวแล้วเก็บ token ไว้ใส่ header ของทุก request บทนี้คือแนวคิดเดียวกัน แต่ browser ไม่ได้ใช้ header เอง มันใช้ cookie (และ localStorage) ดังนั้นสิ่งที่เก็บคือ "สถานะของ browser" ที่เรียกว่า **storage state** แล้วให้ทุก test เริ่มต้นด้วยสถานะนั้น บท 37 ก็ login ได้ด้วย `page.request` แต่ต้องทำใน test ทุกตัว บทนี้ทำครั้งเดียวต่อการรัน

## เนื้อหา

### 1. ปัญหา: login ซ้ำทุก test ช้าและซ้ำซ้อน

ถ้าทุก test ที่ต้องการบัญชีเริ่มด้วย "เปิด /login กรอกอีเมล กรอกรหัสผ่าน กดปุ่ม" ผลคือช้าลงตามจำนวน test และถ้าหน้า login พัง test ทั้งหมดพังตามไปด้วยทั้งที่ไม่เกี่ยวกัน หลักเดียวกับบท 37: ขั้นเตรียมที่ไม่ใช่เป้าหมายของ test ควรทำให้น้อยที่สุด

### 2. storageState คืออะไร

`browserContext.storageState()` คืนข้อมูล 2 ส่วนของ browser context ณ ตอนนั้น:

- `cookies`: cookie ทั้งหมด (ในแอปนี้คือ `dn_auth` ที่บอกว่า login แล้ว และ `dn_sid` ที่เป็นตะกร้า)
- `origins`: ข้อมูล `localStorage` ของแต่ละ origin

ใส่ `{ path: "ไฟล์.json" }` เพื่อเขียนลงไฟล์ได้ แล้วเอาไฟล์นั้นไปเป็นค่าเริ่มต้นของ context ใหม่ด้วยตัวเลือก `storageState` context ใหม่ก็จะมี cookie ชุดเดียวกัน จึงเป็นคนที่ login แล้วทันทีโดยไม่ต้องกรอกฟอร์ม

### 3. โครงสร้างของบทนี้

```
lessons/41-auth-storage-state/
  playwright.config.ts          config ของบทนี้ (project setup + chromium)
  auth.setup.ts                 ตัวอย่างเสร็จแล้ว: login แล้วบันทึกสถานะ
  auth-storage-state.spec.ts    test จริง (ไม่มีโค้ด login เลย)
  .auth/user.json               ไฟล์สถานะ (สร้างตอนรัน ไม่ถูก commit)
```

ลำดับการรัน: project `setup` รัน `auth.setup.ts` ก่อน แล้ว project `chromium` ที่ตั้ง `dependencies: ["setup"]` จึงเริ่ม ทุก test ใน `chromium` เริ่มด้วย `.auth/user.json`

### 4. config: project setup, dependencies และ storageState

```ts
projects: [
  { name: "setup", testMatch: /.*\.setup\.ts/ },
  {
    name: "chromium",
    testMatch: /.*\.spec\.ts/,
    use: {
      ...devices["Desktop Chrome"],
      storageState: "lessons/41-auth-storage-state/.auth/user.json",
    },
    dependencies: ["setup"],
  },
],
```

- `testMatch: /.*\.setup\.ts/` เลือกไฟล์ที่ลงท้าย `.setup.ts` ให้ project นี้ ไฟล์เหล่านี้ไม่ได้ลงท้าย `.spec.ts` จึงปกติไม่ถูกมองเป็น test เลย ต้องมี `testMatch` ของ project ถึงจะรัน
- `testMatch: /.*\.spec\.ts/` ใน `chromium` กันไม่ให้ project นี้ไปเก็บไฟล์ setup มารันซ้ำ
- `dependencies: ["setup"]` บอกว่าต้องรัน project `setup` ให้ผ่านก่อน ตามเอกสาร Playwright ถ้า setup fail test ใน `chromium` จะไม่ถูกรัน (ดีกว่าให้ทุก test ล้มทีละตัวเพราะยังไม่ login) ผลรันจึงขึ้น `[setup]` ก่อนแล้วตามด้วย `[chromium]`
- `storageState` ใน `use` เป็น path ของไฟล์ ถ้าเขียนเป็น path แบบ relative จะเทียบกับโฟลเดอร์ที่สั่งรัน (ที่นี่คือ root ของ repo เพราะเราสั่ง `pnpm test` จาก root) ส่วน `auth.setup.ts` ใช้ `import.meta.dirname` ต่อ path ให้ ได้ไฟล์ตำแหน่งเดียวกัน

ข้อสังเกตจากการรันจริง (ไม่ใช่สิ่งที่รับประกัน): ตอนรันด้วย `--repeat-each=10` ผู้เขียนเห็นว่า project `setup` ซึ่งเป็น dependency ไม่ถูกทำซ้ำ ส่วน test ใน `chromium` ถูกทำซ้ำ 10 รอบโดยใช้ไฟล์เดิม

### 5. อ่าน auth.setup.ts ทีละบรรทัด

```ts
setup("login เป็นผู้ใช้ทั่วไปแล้วบันทึกสถานะ", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("user@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("password123");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL("/account");

  await page.context().clearCookies({ name: "dn_sid" });
  await page.context().storageState({ path: authFile });
});
```

- `setup` คือ `test` ตัวเดิมที่ import มาแล้วตั้งชื่อใหม่ (`import { test as setup }`) ให้อ่านง่ายว่าเป็นขั้นเตรียม ใช้ fixture `page` ได้เหมือน test ปกติ
- `await expect(page).toHaveURL("/account")` สำคัญมาก: ต้องรอให้ login เสร็จจริงก่อนบันทึก ถ้าบันทึกเร็วไปจะได้ไฟล์ที่ยังไม่มี cookie `dn_auth`
- `storageState({ path })` เขียนไฟล์ ถ้าโฟลเดอร์ `.auth` ยังไม่มีมันสร้างให้ (เราลองรันตอนที่ยังไม่มีโฟลเดอร์แล้ว)

#### บรรทัด clearCookies ทำอะไร

`await page.context().clearCookies({ name: "dn_sid" })` cookie นี้คือตะกร้าของ test ลบทิ้งก่อนบันทึก ทุก test จะได้ตะกร้าใหม่ แต่ยัง login อยู่

ขยายความ: แอปนี้เก็บข้อมูลของผู้ใช้ (ตะกร้า คูปอง คำสั่งซื้อ สินค้าที่ admin เพิ่ม) แยกตาม cookie `dn_sid` ส่วนสถานะ login อยู่ใน cookie `dn_auth` ซึ่งแอปเก็บแบบแยกอิสระจาก `dn_sid` ถ้าไม่ลบ `dn_sid` ออก ทุก test จะได้ `dn_sid` ตัวเดียวกันจากไฟล์ แปลว่าทุก test ใช้ตะกร้าเดียวกัน และเมื่อรันขนานกันก็ชนกัน เราลองลบบรรทัดนี้ออกแล้วรัน `--repeat-each=3` test "login แล้วแต่ตะกร้าเริ่มว่างเสมอ" ล้มด้วย `Expected: "0"` แต่ได้ `Received: "3"` (ตะกร้ารั่วจาก test อื่น) พอลบ `dn_sid` ก่อนบันทึก ผู้ใช้ที่ login ใน browser context ใหม่ได้ session ใหม่ของตัวเองทุกครั้ง

หลักการนี้ตรงกับหัวข้อ "one account per parallel worker" ในเอกสาร Playwright: เมื่อ test แก้ข้อมูลฝั่ง server ของบัญชีเดียวกันพร้อมกัน ควรแยกบัญชีต่อ worker แอปของเราแก้ปัญหาด้วยวิธีที่ง่ายกว่าคือแยกตามตะกร้า (`dn_sid`) อ่านเพิ่มที่ [Moderate: one account per parallel worker](https://playwright.dev/docs/auth#moderate-one-account-per-parallel-worker)

### 6. ใช้ storageState ใน test

ในไฟล์ spec ไม่มีโค้ด login เลย:

```ts
test("เปิด /account ได้ทันทีโดยไม่ต้อง login ใน test", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL("/account");
  await expect(page.getByText("ชื่อ: สมชาย ใจดี")).toBeVisible();
});
```

ถ้าไม่ได้ login จะถูกพาไป `/login?next=%2Faccount` การที่ URL ยังเป็น `/account` พิสูจน์ว่า cookie ถูกใส่มาแล้ว

### 7. ทับ storageState เฉพาะกลุ่ม

ใช้ `test.use` ทับค่าของ project ได้เหมือน option อื่น และถ้าต้องการ "ไม่มีสถานะ" ให้ใส่สถานะว่าง:

```ts
test.describe("ยังไม่ login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  // test ในกลุ่มนี้เป็นคนที่ยังไม่ login
});
```

### 8. ไฟล์ .auth ห้าม commit

ไฟล์ใน `.auth/` มี cookie ที่ใช้ login ได้จริง ใน repo นี้ถูก ignore ด้วย `**/.auth/` ใน `.gitignore` แล้ว ในงานจริงห้าม commit ไฟล์แบบนี้เด็ดขาด เพราะใครได้ไฟล์ไปก็เป็นบัญชีนั้นได้

## จุดที่มักพลาด

- **ลืม `dependencies`**: test ใน `chromium` เริ่มก่อน setup เสร็จ (หรือเริ่มทั้งที่ยังไม่เคยมีไฟล์) แล้วล้มด้วย `Error reading storage state from lessons/41-auth-storage-state/.auth/user.json: ENOENT` (เราลองลบ `dependencies` แล้วรันตอนยังไม่มีโฟลเดอร์ `.auth`)
- **ลืม `testMatch` ของ project `setup`**: project นี้จะไปรันไฟล์ `*.spec.ts` ตามค่าเริ่มต้นของ Playwright (ผลรันขึ้น `[setup] › ...auth-storage-state.spec.ts`) และไม่รัน `auth.setup.ts` จึงไม่มีไฟล์ `.auth/user.json`
- **บันทึกก่อน login เสร็จ**: ต้องมี `expect(...)` รอผลของการ login (เช่นรอ URL) ก่อน `storageState({ path })` เสมอ
- **ไม่ลบ `dn_sid`**: ทุก test ใช้ตะกร้าเดียวกัน ผลคือ test ที่รันขนานเห็นของของกันและกัน (อธิบายในหัวข้อ 5)
- **ใช้ path แบบ relative ผิดที่**: `storageState: "lessons/..."` ใช้ได้เพราะรันจาก root ถ้าไปรันจากโฟลเดอร์อื่นจะหาไฟล์ไม่เจอ
- **commit ไฟล์ `.auth`**: มี cookie ที่ใช้ login ได้จริง

## หน้าในแอปที่ใช้

**`/login`** (ใช้ใน setup) ปุ่ม "เข้าสู่ระบบ" disabled จนกรอกครบทั้งสองช่อง สำเร็จแล้วไป `/account`
**`/account`** ต้อง login ถึงเข้าได้ แสดง "ชื่อ: สมชาย ใจดี" ของบัญชี `user@dnshop.test`
**`/`** header ของคนที่ login แล้วมีลิงก์ "บัญชีของฉัน" และปุ่ม "ออกจากระบบ" แทน "เข้าสู่ระบบ"
**`/checkout`** ต้องมีของในตะกร้าก่อน (ว่างจะ redirect ไป `/cart`) ช่อง "ชื่อ-นามสกุล" ถูกเติมให้ถ้า login

## วิธีรันบทนี้

```bash
pnpm test --config lessons/41-auth-storage-state/playwright.config.ts
```

ผลที่ควรได้ก่อนเริ่มทำแบบฝึกหัด: `3 passed` (setup 1 + ตัวอย่าง 2) และ `3 skipped` ถ้าอยากดูไฟล์ที่ได้ ลองเปิด `lessons/41-auth-storage-state/.auth/user.json` (จะเห็น cookie `dn_auth` และไม่มี `dn_sid`)

## แบบฝึกหัดในบทนี้

เปลี่ยน `test.fixme` ในไฟล์ `auth-storage-state.spec.ts` ให้เป็น `test` แล้วเขียนตามแนวทางในคอมเมนต์ ห้ามเขียนโค้ด login ใน test

1. ตรวจว่าหัวเว็บของคนที่ login แล้วมี "บัญชีของฉัน" กับ "ออกจากระบบ" และไม่มีลิงก์ "เข้าสู่ระบบ"
2. เตรียมตะกร้าด้วย API แล้วตรวจว่า `/checkout` เติมชื่อ "สมชาย ใจดี" ให้เอง
3. ใช้ `test.use({ storageState: { cookies: [], origins: [] } })` ในกลุ่มของตัวเอง แล้วตรวจว่าเปิด `/account` ถูกส่งไป `/login?next=%2Faccount`

## อ่านเพิ่ม

- [Authentication](https://playwright.dev/docs/auth)
- [Projects](https://playwright.dev/docs/test-projects) (หัวข้อ dependencies)
