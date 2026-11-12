import { defineConfig, devices } from "@playwright/test";
import { sharedUse, webServer } from "../../playwright.shared";

// config ของบทที่ 45 โดยเฉพาะ (config หลักของ repo ข้ามโฟลเดอร์นี้ผ่าน testIgnore)
// รันด้วย: pnpm test --config lessons/45-visual-comparison/playwright.config.ts
export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],

  // ที่เก็บภาพต้นแบบ (baseline) ของ toHaveScreenshot
  // {testDir} โฟลเดอร์ของบทนี้, {testFileName} ชื่อไฟล์ spec, {arg} ชื่อภาพ, {projectName} ชื่อ project
  // {platform} ระบบปฏิบัติการ (darwin, linux, win32): ภาพที่ได้ต่างกันตาม OS เพราะฟอนต์และการ render ไม่เหมือนกัน
  // จึงต้องเก็บภาพแยกตาม OS (ลงท้าย -snapshots เพื่อให้ .gitignore ของ repo นี้ข้ามไป ไม่ commit ภาพ)
  snapshotPathTemplate: "{testDir}/{testFileName}-snapshots/{arg}-{projectName}-{platform}{ext}",

  expect: {
    toHaveScreenshot: {
      // ยอมให้พิกเซลต่างกันได้ไม่เกิน 1% ของภาพ (ค่าเริ่มต้นคือต้องตรงเป๊ะ)
      maxDiffPixelRatio: 0.01,
    },
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  use: sharedUse,
  webServer,
});
