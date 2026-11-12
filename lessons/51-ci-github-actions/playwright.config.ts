import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { sharedUse, webServer } from "../../playwright.shared";

// config ของบทที่ 51 โดยเฉพาะ (config หลักของ repo ข้ามโฟลเดอร์นี้ผ่าน testIgnore)
// รันด้วย: pnpm test --config lessons/51-ci-github-actions/playwright.config.ts
// ฝึก sharding: เติม --shard=1/2 หรือ --shard=2/2 ต่อท้ายคำสั่งข้างบน
const outputDir = path.join(import.meta.dirname, "output");

export default defineConfig({
  testDir: ".",

  // true = แบ่ง "test" (ไม่ใช่ "ไฟล์") ให้แต่ละ shard ทำให้ test เล็กๆ 4 ข้อในบทนี้แบ่งครึ่งได้
  // ถ้า false จะแบ่งทีละไฟล์ และบทนี้มีไฟล์เดียว จึงตกอยู่ shard เดียว
  fullyParallel: true,

  // เก็บผลลัพธ์ไว้ใต้ output/ ซึ่งเป็นโฟลเดอร์ที่ workflow ใน playwright.yml อัปโหลดเป็น artifact (และถูก git ignore)
  outputDir: path.join(outputDir, "test-results"),
  reporter: [["list"], ["html", { outputFolder: path.join(outputDir, "html"), open: "never" }]],

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  use: sharedUse,
  webServer,
});
