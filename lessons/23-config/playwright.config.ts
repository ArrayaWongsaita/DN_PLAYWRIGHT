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
    // เฉลยข้อ 1: test ที่โหลดช้า 7 วินาทีต้องรอเกิน 5 วินาที จึงเพิ่มเป็น 10 วินาที
    // (แก้ที่นี่ที่เดียวมีผลกับทุก expect ใน config นี้ ไม่ต้องใส่ timeout ทีละ assertion)
    timeout: 10_000,
  },

  fullyParallel: true,

  // จำนวนครั้งที่รันซ้ำเมื่อ test fail (0 = ไม่รันซ้ำ)
  // เฉลยข้อ 2: ตั้ง 1 ให้ test ที่ fail รอบแรกได้รันซ้ำอีกครั้ง ผลที่ได้จะแสดงว่า flaky (ผ่านหลัง retry)
  // ใช้ retries ตามเหตุผลของทีม ไม่ควรใช้ซ่อน test ที่ไม่เสถียร
  retries: 1,

  reporter: [["list"]],

  projects: [
    {
      name: "chromium",
      // devices["Desktop Chrome"] กำหนด userAgent, viewport 1280x720 ฯลฯ ให้ project นี้
      use: {
        ...devices["Desktop Chrome"],
        // เฉลยข้อ 3: เขียนต่อท้าย ...devices เพื่อทับ viewport 1280x720 ของ Desktop Chrome
        // (ถ้าไปใส่ที่ use ระดับบนสุดจะไม่ได้ผล เพราะ use ของ project ชนะเสมอ)
        viewport: { width: 390, height: 844 },
      },
    },
  ],

  // ค่าที่ใช้ร่วมกับทั้ง repo (baseURL, locale, timezoneId, trace, screenshot)
  use: sharedUse,

  // สตาร์ตแอป DN Shop ให้เองก่อนรัน test (cwd ชี้กลับ root ใน playwright.shared.ts)
  webServer,
});
