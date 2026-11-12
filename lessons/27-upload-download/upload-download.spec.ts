import path from "node:path";
import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 27: อัปโหลดและดาวน์โหลดไฟล์
// ฝึก: setInputFiles (path, หลายไฟล์, buffer, ล้างด้วย []), waitForEvent("download"), suggestedFilename, download.path()
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================

// ไฟล์ตัวอย่างอยู่ในโฟลเดอร์ fixtures/ ข้างๆ ไฟล์นี้ (profile.png, photo.jpg, notes.txt)
// path.join ต่อ path ให้ถูกทั้ง macOS และ Windows; import.meta.dirname คือโฟลเดอร์ของไฟล์นี้
const fixture = (name: string) => path.join(import.meta.dirname, "fixtures", name);


// ------------------------------------------------
// ตัวอย่างที่ 1: อัปโหลดไฟล์เดียวด้วย setInputFiles แล้วดูรายชื่อไฟล์ที่เลือก
// ------------------------------------------------
test("หน้า files: เลือกรูป profile.png แล้วรายการแสดงชื่อไฟล์", async ({ page }) => {
  await page.goto("/playground/files");

  // setInputFiles ใส่ไฟล์ให้ <input type="file"> โดยตรง ไม่ต้องเปิดหน้าต่างเลือกไฟล์ของระบบ
  // หา input ด้วย label (ข้อความ label ตามหน้าจริง)
  await page.getByLabel("เลือกไฟล์ (หลายไฟล์ได้)").setInputFiles(fixture("profile.png"));

  // แต่ละรายการแสดง "{ชื่อ} ({ขนาด} bytes)" ขนาดของไฟล์แต่ละเครื่องเท่ากัน แต่ใช้ regex กันพลาดเวลาเปลี่ยนไฟล์
  const selected = page.getByRole("list", { name: "ไฟล์ที่เลือก" });
  await expect(selected.getByRole("listitem")).toHaveText(/^profile\.png \(\d+ bytes\)$/);
});


// ------------------------------------------------
// ตัวอย่างที่ 2: ดาวน์โหลดไฟล์ CSV รอ event "download" ที่สร้างไว้ก่อนกด
// ------------------------------------------------
test("หน้า files: ดาวน์โหลดรายการสินค้า CSV ได้ชื่อ products.csv", async ({ page }, testInfo) => {
  await page.goto("/playground/files");

  // ตั้งรอ event ก่อนกดลิงก์ (เหมือนบท 26 ไม่ใส่ await ตรงนี้)
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "ดาวน์โหลดรายการสินค้า (CSV)" }).click();
  const download = await downloadPromise;

  // ชื่อไฟล์ที่เซิร์ฟเวอร์เสนอมา (จาก Content-Disposition)
  expect(download.suggestedFilename()).toBe("products.csv");

  // เก็บไฟล์ไว้ใต้โฟลเดอร์ของ test นี้ใน test-results/ (ไม่ต้อง commit ไฟล์ที่เกิดจากการรัน)
  const savedPath = testInfo.outputPath(download.suggestedFilename());
  await download.saveAs(savedPath);

  // อ่านเนื้อหาด้วย readFile ของ Node แล้วตรวจ
  const content = await readFile(savedPath, "utf8");
  expect(content).toContain("id,name,category,price,stock");
  expect(content).toContain("p01,หูฟังไร้สาย DN Buds,it,1290,15");
});


// ------------------------------------------------
// ข้อ 1: เหมือนตัวอย่างที่ 1 แต่ใช้ไฟล์ notes.txt
// แนวทาง: setInputFiles(fixture("notes.txt")) แล้วตรวจรายการด้วย regex /^notes\.txt \(\d+ bytes\)$/
// ------------------------------------------------
test("หน้า files: เลือกไฟล์ notes.txt", async ({ page }) => {
  await page.goto("/playground/files");

  // ทำไม: path ของไฟล์ตัวอย่างสร้างด้วย fixture() จึงใช้ได้ทุกเครื่อง ไม่ผูกกับ path ของใคร
  await page.getByLabel("เลือกไฟล์ (หลายไฟล์ได้)").setInputFiles(fixture("notes.txt"));

  // ทำไม: ใช้ regex กับขนาดไฟล์ เผื่อเนื้อหาไฟล์ตัวอย่างถูกแก้ภายหลัง
  const selected = page.getByRole("list", { name: "ไฟล์ที่เลือก" });
  await expect(selected.getByRole("listitem")).toHaveText(/^notes\.txt \(\d+ bytes\)$/);
});


// ------------------------------------------------
// ข้อ 2: เลือกหลายไฟล์พร้อมกัน: profile.png และ photo.jpg
// แนวทาง: ส่ง array ของ path ให้ setInputFiles([fixture("profile.png"), fixture("photo.jpg")])
//        ตรวจจำนวนรายการ toHaveCount(2) และข้อความแต่ละรายการ toHaveText([regex, regex]) ตามลำดับ
// ------------------------------------------------
test("หน้า files: เลือกหลายไฟล์พร้อมกัน", async ({ page }) => {
  await page.goto("/playground/files");

  // ทำไม: ส่ง array ของ path เพราะ input นี้มี attribute multiple
  await page.getByLabel("เลือกไฟล์ (หลายไฟล์ได้)").setInputFiles([fixture("profile.png"), fixture("photo.jpg")]);

  const items = page.getByRole("list", { name: "ไฟล์ที่เลือก" }).getByRole("listitem");
  await expect(items).toHaveCount(2);
  // ทำไม: toHaveText แบบ array ตรวจครบทุกรายการตามลำดับที่เลือก
  await expect(items).toHaveText([/^profile\.png \(\d+ bytes\)$/, /^photo\.jpg \(\d+ bytes\)$/]);
});


// ------------------------------------------------
// ข้อ 3: ล้างไฟล์ที่เลือก 2 วิธี: setInputFiles([]) และกดปุ่ม "ล้างไฟล์"
// แนวทาง: เลือกไฟล์ notes.txt แล้วสั่ง setInputFiles([]) ตรวจว่ารายการเหลือ 0 (toHaveCount(0))
//        (setInputFiles([]) เหมือนผู้ใช้ล้างการเลือก หน้าจึงอัปเดตรายการให้เอง)
//        จากนั้นเลือกไฟล์อีกครั้ง กดปุ่ม "ล้างไฟล์" แล้วตรวจว่ารายการเหลือ 0 อีกครั้ง
// ------------------------------------------------
test("หน้า files: ล้างไฟล์ที่เลือก", async ({ page }) => {
  await page.goto("/playground/files");
  const input = page.getByLabel("เลือกไฟล์ (หลายไฟล์ได้)");
  const items = page.getByRole("list", { name: "ไฟล์ที่เลือก" }).getByRole("listitem");

  await input.setInputFiles(fixture("notes.txt"));
  await expect(items).toHaveCount(1);

  // ทำไม: ส่ง array ว่างคือการล้างไฟล์ที่เลือก และหน้าได้รับ change event ตามปกติ
  await input.setInputFiles([]);
  await expect(items).toHaveCount(0);

  // วิธีที่สอง: ผู้ใช้กดปุ่ม "ล้างไฟล์"
  await input.setInputFiles(fixture("notes.txt"));
  await expect(items).toHaveCount(1);
  await page.getByRole("button", { name: "ล้างไฟล์" }).click();
  await expect(items).toHaveCount(0);
});


// ------------------------------------------------
// ข้อ 4: อัปโหลดไฟล์ที่ไม่มีอยู่จริงในดิสก์ด้วย buffer: ชื่อ hello.txt เนื้อหา "hello" (5 bytes)
// แนวทาง: setInputFiles({ name: "hello.txt", mimeType: "text/plain", buffer: Buffer.from("hello") })
//        ตรวจรายการเป็น "hello.txt (5 bytes)"
// ------------------------------------------------
test("หน้า files: อัปโหลดจาก buffer", async ({ page }) => {
  await page.goto("/playground/files");

  // ทำไม: buffer สร้างไฟล์ในหน่วยความจำ ไม่ต้องมีไฟล์ใน fixtures; "hello" มี 5 ไบต์
  await page.getByLabel("เลือกไฟล์ (หลายไฟล์ได้)").setInputFiles({
    name: "hello.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello"),
  });

  await expect(page.getByRole("list", { name: "ไฟล์ที่เลือก" }).getByRole("listitem")).toHaveText("hello.txt (5 bytes)");
});


// ------------------------------------------------
// ข้อ 5: ดาวน์โหลดคู่มือ TXT: ชื่อไฟล์ต้องเป็น guide.txt และเนื้อหาขึ้นต้นด้วย "คู่มือการใช้งาน DN Shop"
// แนวทาง: เหมือนตัวอย่างที่ 2 แต่ลิงก์ "ดาวน์โหลดคู่มือ (TXT)" ลองอ่านเนื้อหาด้วย await download.path()
//        (คืน path ของไฟล์ชั่วคราว) แล้ว readFile ตรวจ toContain
// ------------------------------------------------
test("หน้า files: ดาวน์โหลดคู่มือ guide.txt", async ({ page }) => {
  await page.goto("/playground/files");

  // ทำไม: สร้าง promise รอ download ก่อนกดลิงก์ (ไม่ await) ไม่งั้นอาจพลาด event
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "ดาวน์โหลดคู่มือ (TXT)" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("guide.txt");

  // ทำไม: download.path() คืน path ของไฟล์ชั่วคราวที่ Playwright เก็บให้ (Promise จึงต้อง await) อ่านเนื้อหาได้เลย
  // ไม่ได้สร้างไฟล์ใน repo
  const content = await readFile(await download.path(), "utf8");
  expect(content).toContain("คู่มือการใช้งาน DN Shop");
});


// ------------------------------------------------
// ข้อ 6: เปลี่ยนรูปโปรไฟล์ที่หน้า /account (ต้อง login ก่อน)
// แนวทาง: goto("/login") กรอกอีเมล user@dnshop.test รหัสผ่าน password123 กดปุ่ม "เข้าสู่ระบบ" แล้วรอ URL เป็น /account
//        setInputFiles ที่ช่อง "รูปโปรไฟล์" ด้วย fixture("photo.jpg") ตรวจ "ไฟล์ที่เลือก: photo.jpg"
//        กดปุ่ม "บันทึกรูป" แล้วตรวจ role="status" ข้อความ "บันทึกรูปโปรไฟล์แล้ว"
// ------------------------------------------------
test("หน้า account: อัปโหลดรูปโปรไฟล์ photo.jpg", async ({ page }) => {
  // login ก่อน เพราะ /account ต้องเข้าสู่ระบบ
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("user@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("password123");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await page.waitForURL("**/account");

  // ทำไม: ใช้ photo.jpg (JPG) ที่ช่องนี้รับเฉพาะ PNG/JPG ขนาดไม่เกิน 1MB
  await page.getByLabel("รูปโปรไฟล์").setInputFiles(fixture("photo.jpg"));
  await expect(page.getByText("ไฟล์ที่เลือก: photo.jpg")).toBeVisible();

  await page.getByRole("button", { name: "บันทึกรูป" }).click();
  await expect(page.getByRole("status").filter({ hasText: "บันทึกรูปโปรไฟล์แล้ว" })).toBeVisible();
});
