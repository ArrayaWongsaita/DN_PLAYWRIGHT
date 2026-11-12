import { defineConfig, devices } from "@playwright/test";
import { sharedUse, webServer } from "../../playwright.shared";

// config ของบทที่ 23 โดยเฉพาะ: แก้ไฟล์นี้ได้เต็มที่โดยไม่กระทบบทอื่น
// (config หลักของ repo ข้ามโฟลเดอร์นี้ผ่าน testIgnore)
// รันด้วย: pnpm test --config lessons/23-config/playwright.config.ts
export default defineConfig({
  // โฟลเดอร์ที่มีไฟล์ *.spec.ts "." หมายถึงโฟลเดอร์เดียวกับไฟล์ config นี้
  testDir: ".",

  // เวลาสูงสุดของ test หนึ่งตัว (มิลลิวินาที) ค่าเริ่มต้นคือ 30 วินาที
  timeout: 30_000,

  // ตั้งค่าของ expect
  expect: {
    // เวลาสูงสุดที่ web-first assertion รอ (ค่าเริ่มต้น 5 วินาที)
    // 👉 แบบฝึกหัดข้อ 1: เพิ่มค่านี้
    timeout: 5_000,
  },

  fullyParallel: true,

  // จำนวนครั้งที่รันซ้ำเมื่อ test fail (0 = ไม่รันซ้ำ)
  // 👉 แบบฝึกหัดข้อ 2: เปลี่ยนค่านี้
  retries: 0,

  reporter: [["list"]],

  projects: [
    {
      name: "chromium",
      // devices["Desktop Chrome"] กำหนด userAgent, viewport 1280x720 ฯลฯ ให้ project นี้
      use: {
        ...devices["Desktop Chrome"],
        // 👉 แบบฝึกหัดข้อ 3: ใส่ viewport ของมือถือตรงนี้ (ต่อท้าย devices เพื่อทับค่า)
      },
    },
  ],

  // ค่าที่ใช้ร่วมกับทั้ง repo (baseURL, locale, timezoneId, trace, screenshot)
  use: sharedUse,

  // สตาร์ตแอป DN Shop ให้เองก่อนรัน test (cwd ชี้กลับ root ใน playwright.shared.ts)
  webServer,
});
