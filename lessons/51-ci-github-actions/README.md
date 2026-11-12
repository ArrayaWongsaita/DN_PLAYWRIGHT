# บทที่ 51: รัน test บน GitHub Actions (CI) และ sharding

บทนี้เขียนให้อ่านเองได้ บทนี้ต่างจากบทอื่น: ไม่มีแบบฝึกหัดที่เป็นโค้ด test งานของคุณคือ **เติมไฟล์ `playwright.yml`** ให้ครบ และฝึกคำสั่ง `--shard` ในเครื่องตัวเอง ผู้เขียนตรวจว่าไฟล์ yml ที่เติมครบ (ในเฉลย) อ่านเป็น YAML ได้ และรัน `pnpm install --frozen-lockfile` กับคำสั่ง test พร้อม `--shard` บนเครื่องแล้ว แต่ **ไม่ได้รันบน GitHub จริง** (และไม่ได้รัน `playwright install --with-deps` ซึ่งเป็นคำสั่งสำหรับ Linux runner) (ไม่ได้ push ไปไหน) บทนี้จึงบอกตรงๆ ว่าส่วนไหนตรวจแล้วและส่วนไหนยังไม่เคยเห็นทำงานจริง

## จบบทนี้แล้วทำอะไรได้

- เขียน workflow ของ GitHub Actions ที่ติดตั้ง pnpm, Node, แพ็กเกจ, browser แล้วรัน Playwright test
- ใช้ matrix ร่วมกับ `--shard` แบ่ง test เป็นหลายส่วนให้หลาย job รันพร้อมกัน
- เก็บรายงานของการรันเป็น artifact ได้ แม้ test ล้ม
- บอกได้ว่า `pnpm install --frozen-lockfile` และ `--with-deps` ทำอะไร

## เชื่อมกับที่รู้แล้ว

ใน Jest + Supertest คุณน่าจะเคยมี workflow ที่ `npm ci` แล้ว `npm test` บทนี้เหมือนกัน เพิ่มเรื่อง browser (ต้องติดตั้งบน runner) และการแบ่ง test เป็นหลาย job (sharding) ซึ่งสำคัญเมื่อ test เยอะ จนรันทีเดียวช้า ใช้ความรู้จากบท 48 (worker) บท 49 (ค่าตั้งค่า) และบท 50 (reporter และ `process.env.CI`)

## เนื้อหา

### 1. GitHub Actions คืออะไร (สั้นๆ)

เป็นระบบ CI ของ GitHub: ไฟล์ YAML ใน `.github/workflows/` บอกว่าเมื่อเกิดเหตุการณ์ (เช่น push) ให้เปิดเครื่องเสมือน (runner) แล้วรันขั้นตอน (steps) ทีละอัน ศัพท์ที่ต้องรู้:

- `on`: เหตุการณ์ที่เริ่มงาน (ในไฟล์เราใช้ push ไปที่ `main` และ pull request)
- `jobs`: งานแต่ละชิ้น รันบนเครื่องของตัวเอง
- `runs-on`: ชนิด runner (`ubuntu-latest`)
- `steps`: ลำดับขั้นตอนใน job มีสองแบบ `uses:` (เรียก action สำเร็จรูป) กับ `run:` (สั่งคำสั่ง shell)
- `matrix`: สร้าง job ซ้ำหลายชุดจากรายการค่า แต่ละชุดมีตัวแปร `${{ matrix.xxx }}` ต่างกัน

GitHub ตั้ง environment variable `CI` ให้เองบน runner (บท 50 ใช้ตัวนี้เลือก reporter) และเมื่อมี `CI` webServer ของ repo นี้จะไม่ใช้เซิร์ฟเวอร์เดิมที่เปิดค้างอยู่ แต่เปิดแอปใหม่เสมอ (ตั้งใน `playwright.shared.ts`)

### 2. ไฟล์ workflow ของบทนี้

ไฟล์ `lessons/51-ci-github-actions/playwright.yml` เป็นแบบฝึกหัด มีช่องว่างให้เติมที่เครื่องหมาย 👉 **ไฟล์นี้ไม่ได้อยู่ใน `.github/workflows/`** จึงไม่ทำงานเลยจนกว่าคุณจะนำไปวางใน repo ของคุณเอง การที่ repo คอร์สนี้ไม่มีไฟล์ใน `.github/workflows/` เป็นความตั้งใจ

action ที่ใช้ และเวอร์ชันหลัก (ผู้เขียนตรวจกับ release ล่าสุดบน GitHub ตอนเขียนบทนี้):

| action | ทำอะไร | เวอร์ชันที่ใช้ |
|---|---|---|
| `actions/checkout` | ดึงโค้ดของ repo มาที่ runner | `v7` |
| `pnpm/action-setup` | ติดตั้ง pnpm (อ่านเวอร์ชันจาก `packageManager` ใน `package.json` ถ้าไม่ระบุ `version`) | `v6` |
| `actions/setup-node` | ติดตั้ง Node และเก็บ cache ของ pnpm ด้วย `cache: pnpm` | `v7` |
| `actions/upload-artifact` | อัปโหลดไฟล์ผลลัพธ์เก็บไว้ดูหลังรันเสร็จ | `v7` |

เวอร์ชันหลักเปลี่ยนเรื่อยๆ ก่อนใช้งานจริงตรวจหน้า releases ของแต่ละ action อีกครั้ง

### 3. ขั้นตอนใน job ทีละอัน

1. `actions/checkout@v7` (เติมให้แล้ว)
2. **ข้อ 1** ติดตั้ง pnpm: `pnpm/action-setup@v6` ต้องอยู่ **ก่อน** `setup-node` เพราะ `cache: pnpm` ต้องมีคำสั่ง `pnpm` ให้เรียกใช้
3. **ข้อ 2** `setup-node` ตั้ง `node-version` เป็นเวอร์ชันที่คอร์สนี้ใช้ (ดู `engines.node` ใน `package.json` หรือไฟล์ `.nvmrc`)
4. **ข้อ 3** `pnpm install --frozen-lockfile`: ติดตั้งตาม `pnpm-lock.yaml` เป๊ะๆ ถ้า lockfile ไม่ตรงกับ `package.json` จะล้มแทนที่จะแก้ไฟล์เอง ซึ่งเป็นสิ่งที่ CI ต้องการ (ผู้เขียนรันคำสั่งนี้บนเครื่องแล้วได้ `Lockfile is up to date`)
5. **ข้อ 4** `pnpm exec playwright install --with-deps chromium`: ติดตั้ง browser เฉพาะ chromium เท่านั้น (เร็วกว่าติดตั้งทั้งสามตัว) และ `--with-deps` ให้ติดตั้งไลบรารีของระบบที่ browser ต้องใช้บน Linux (เอกสาร CI ของ Playwright ระบุคำสั่งนี้)
6. **ข้อ 5** รัน test: `pnpm test --config lessons/51-ci-github-actions/playwright.config.ts --shard=${{ matrix.shard }}/2`
7. `actions/upload-artifact@v7` เก็บโฟลเดอร์ `output/` (รายงาน html) ชื่อ artifact ใส่เลข shard ต่อท้ายเพื่อไม่ให้ซ้ำกัน และ `if: ${{ !cancelled() }}` ให้อัปโหลดแม้ test ล้ม

### 4. sharding และ matrix

sharding คือแบ่ง test ทั้งหมดเป็น N ส่วนเท่าๆ กัน แล้วให้แต่ละเครื่องรันส่วนของตัวเอง คำสั่ง `--shard=1/2` แปลว่า "ส่วนที่ 1 จากทั้งหมด 2 ส่วน" ลองบนเครื่องคุณได้เลย (ผู้เขียนลองแล้ว):

```bash
pnpm test --config lessons/51-ci-github-actions/playwright.config.ts
pnpm test --config lessons/51-ci-github-actions/playwright.config.ts --shard=1/2
pnpm test --config lessons/51-ci-github-actions/playwright.config.ts --shard=2/2
```

ผลที่ผู้เขียนเห็น:

- คำสั่งแรก (ไม่แบ่ง): `4 passed`
- `--shard=1/2`: บรรทัดแรก `Running 2 tests using 2 workers, shard 1 of 2` ได้ test หน้าแรกกับหน้าสินค้า
- `--shard=2/2`: `Running 2 tests ... shard 2 of 2` ได้ test หน้าสาขากับหน้าคู่มือ

สองส่วนไม่ซ้ำกันและรวมกันได้ครบ 4 test ที่ไม่ซ้ำกัน config ของบทนี้ตั้ง `fullyParallel: true` เพื่อให้ Playwright แบ่งระดับ test ได้ ถ้าเป็น `false` มันแบ่งทีละ **ไฟล์** และบทนี้มีไฟล์เดียว จึงตกอยู่ shard เดียว

ใน workflow ใช้ matrix สร้าง job สองชุด:

```yaml
strategy:
  fail-fast: false
  matrix:
    shard: [1, 2]
```

GitHub จะเปิด job สองตัวพร้อมกัน ตัวแรก `matrix.shard` เป็น 1 ตัวที่สองเป็น 2 คำสั่ง `--shard=${{ matrix.shard }}/2` จึงกลายเป็น `--shard=1/2` กับ `--shard=2/2` ตามลำดับ (ส่วน `/2` ต้องตรงกับจำนวนค่าใน matrix) `fail-fast: false` ให้ shard อื่นรันต่อแม้มี shard หนึ่งล้ม

> หมายเหตุ: นี่คือการแบ่งแบบง่ายที่สุด ผลคือได้รายงาน html แยกต่อ shard (artifact สองอัน) ถ้าอยากได้รายงานรวมชิ้นเดียว Playwright มี reporter `blob` และคำสั่ง `merge-reports` ที่อธิบายในเอกสาร sharding (บทนี้ไม่ได้ลองรัน)

### 5. ข้อควรรู้เรื่อง CI

- test ที่รันบน CI ควรนิ่ง (บท 48) เพราะไม่มีใครนั่งดู
- ความลับ (รหัสผ่าน, token) ใส่ใน GitHub Secrets แล้วอ้างด้วย `${{ secrets.ชื่อ }}` ไม่ใส่ในไฟล์ yml (ต่อจากบท 49)
- รันครั้งแรกแอปต้อง build ใหม่ (`webServer` ของ repo นี้ทำให้เอง) จึงใช้เวลาเพิ่มในครั้งแรกของแต่ละ job

## จุดที่มักพลาด

- **วาง `pnpm/action-setup` หลัง `setup-node`**: `cache: pnpm` หา pnpm ไม่เจอ ต้องติดตั้ง pnpm ก่อน
- **ใช้ `pnpm install` แทน `--frozen-lockfile` บน CI**: lockfile ที่ไม่ตรงกันจะถูกแก้เงียบๆ ทำให้ผลต่างจากเครื่องคุณ
- **ลืม `--with-deps`**: บน Linux ที่เพิ่งสร้างจะขาดไลบรารีระบบ browser เปิดไม่ขึ้น
- **ตั้งชื่อ artifact เหมือนกันทุก shard**: อัปโหลดชนกัน ต้องใส่เลข shard ต่อท้ายชื่อ
- **ตัวหาร `/2` ไม่ตรงกับจำนวนค่าใน matrix**: ต้องให้จำนวน shard ในคำสั่งเท่ากับจำนวนค่าใน matrix ไม่งั้น test บางส่วนจะไม่ถูกรันเลย
- **ลืม `fullyParallel: true`** ตอนมีไฟล์ test น้อย: แบ่งระดับไฟล์ได้ไม่สม่ำเสมอ
- **วางไฟล์ yml ในตำแหน่งผิด**: ต้องเป็น `.github/workflows/` ถึงจะทำงาน และใน repo คอร์สนี้ห้ามวาง

## หน้าในแอปที่ใช้

บทนี้ test ใช้หน้าเรียบง่าย: **`/`** (h1 "DN Shop"), **`/products`** (h1 "สินค้าทั้งหมด"), **`/stores`** (h1 "สาขาของเรา"), **`/help/ordering`** (h1 "คู่มือการสั่งซื้อ")

## วิธีรันบทนี้

```bash
pnpm test --config lessons/51-ci-github-actions/playwright.config.ts
```

ผลที่ควรได้: `4 passed` (บทนี้ไม่มี `test.fixme`) แล้วทำตามหัวข้อ 4 เพื่อลอง `--shard=1/2` และ `--shard=2/2`

## แบบฝึกหัดในบทนี้

1. เปิดไฟล์ `playwright.yml` เติมช่อง 👉 ให้ครบ 6 ช่อง (ลบเครื่องหมาย 👉 และคำว่า `?` ออกด้วย):
   1. ติดตั้ง pnpm ด้วย `pnpm/action-setup` เวอร์ชัน `v6`
   2. `node-version` ของคอร์สนี้
   3. คำสั่งติดตั้งแพ็กเกจแบบ frozen lockfile
   4. คำสั่งติดตั้ง browser chromium พร้อม `--with-deps`
   5. คำสั่งรัน test พร้อม `--shard=${{ matrix.shard }}/2`
   6. รายการ `shard` ใน matrix ให้แบ่งเป็น 2 ส่วน
2. รัน `--shard=1/2` และ `--shard=2/2` บนเครื่องตัวเอง แล้วจดว่า test ไหนอยู่ shard ไหน
3. (ลองเอง) ถ้ามี repo ของคุณเอง copy ไฟล์ที่เติมแล้วไปไว้ที่ `.github/workflows/playwright.yml` แล้ว push ดู (ข้อนี้ผู้เขียนไม่ได้ทดสอบบน GitHub)

เฉลยอยู่ที่ branch `solutions` (ไฟล์ yml ที่เติมครบ)

## อ่านเพิ่ม

- [Setting up CI](https://playwright.dev/docs/ci-intro)
- [Sharding](https://playwright.dev/docs/test-sharding)
- [GitHub Actions: workflows](https://docs.github.com/en/actions/writing-workflows)
