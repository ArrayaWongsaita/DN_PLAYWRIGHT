import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { sharedUse, webServer } from "../../playwright.shared";

// config ของบทที่ 50 โดยเฉพาะ (config หลักของ repo ข้ามโฟลเดอร์นี้ผ่าน testIgnore)
// รันด้วย: pnpm test --config lessons/50-reporters/playwright.config.ts

// ผลลัพธ์ทุกชนิดของบทนี้อยู่ใต้ lessons/50-reporters/output/ (โฟลเดอร์นี้ถูก git ignore)
const outputDir = path.join(import.meta.dirname, "output");

// process.env.CI เป็นสตริงที่มีค่าเมื่อรันบน CI (GitHub Actions ตั้งให้เอง) และไม่มีค่าเมื่อรันบนเครื่องเรา
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: ".",
  fullyParallel: true,

  // เก็บไฟล์ของแต่ละ test (screenshot, trace ตอน fail) ไว้ใต้โฟลเดอร์ output ด้วย
  outputDir: path.join(outputDir, "test-results"),

  // reporter ใช้ได้หลายตัวพร้อมกัน (ใส่เป็น array ของ [ชื่อ, ตัวเลือก])
  reporter: isCI
    ? [
        // บน CI: dot บรรทัดเดียวสั้นๆ ไม่ท่วม log + ไฟล์ที่ให้เครื่องมืออ่านต่อ
        ["dot"],
        ["html", { outputFolder: path.join(outputDir, "html"), open: "never" }],
        ["json", { outputFile: path.join(outputDir, "results.json") }],
        ["junit", { outputFile: path.join(outputDir, "junit.xml") }],
      ]
    : [
        // บนเครื่องเรา: list อ่านง่ายทีละ test + รายงาน html ไว้เปิดดู (ไม่เปิดเบราว์เซอร์ให้เอง)
        ["list"],
        ["html", { outputFolder: path.join(outputDir, "html"), open: "never" }],
      ],

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  use: sharedUse,
  webServer,
});
