import { defineConfig, devices } from "@playwright/test";
import { sharedUse, webServer } from "../../playwright.shared";

// config ของบทที่ 48 โดยเฉพาะ (config หลักของ repo ข้ามโฟลเดอร์นี้ผ่าน testIgnore)
// รันด้วย: pnpm test --config lessons/48-parallel-retries/playwright.config.ts
export default defineConfig({
  testDir: ".",

  // false = แต่ละ "ไฟล์" รันขนานกันได้ แต่ test ในไฟล์เดียวกันรันต่อกันใน worker เดียว (ค่าเริ่มต้นของ Playwright)
  // บางกลุ่มเปิดขนานเองได้ด้วย test.describe.configure({ mode: "parallel" }) ดูในไฟล์ spec
  fullyParallel: false,

  // รันซ้ำสูงสุด 2 ครั้งเมื่อ fail: test ที่ผ่านในรอบ retry จะถูกรายงานว่า "flaky" (exit code ยังเป็น 0)
  // 👉 ลองเปลี่ยนเป็น 0 แล้วรันซ้ำ จะเห็นว่า test @flaky-demo ล้มจริงบางรอบ
  retries: 2,

  // จำนวน worker (process ที่รัน test ขนานกัน) ถ้าไม่ตั้ง Playwright ใช้ครึ่งหนึ่งของจำนวน CPU
  // 👉 ลองตั้งตรงนี้ หรือใช้ --workers=1 / --workers=4 บนบรรทัดคำสั่ง
  // workers: 2,

  reporter: [["list"]],

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  use: sharedUse,
  webServer,
});
