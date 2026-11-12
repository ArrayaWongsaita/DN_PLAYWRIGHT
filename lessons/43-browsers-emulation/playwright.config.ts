import { defineConfig, devices } from "@playwright/test";
import { sharedUse, webServer } from "../../playwright.shared";

// config ของบทที่ 43 โดยเฉพาะ (config หลักของ repo ข้ามโฟลเดอร์นี้ผ่าน testIgnore)
// ต้องติดตั้ง browser เพิ่มก่อน: pnpm exec playwright install firefox webkit
// รันด้วย: pnpm test --config lessons/43-browsers-emulation/playwright.config.ts
export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  reporter: [["list"]],

  // ทุก test จะรันซ้ำครบทุก project ด้านล่าง (ชื่อ project ขึ้นหน้าบรรทัดในผลรัน)
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // iPhone 15 ใช้ WebKit พร้อม viewport มือถือ, userAgent ของ iPhone, isMobile และ hasTouch
    { name: "Mobile Safari", use: { ...devices["iPhone 15"] } },
  ],

  use: sharedUse,
  webServer,
});
