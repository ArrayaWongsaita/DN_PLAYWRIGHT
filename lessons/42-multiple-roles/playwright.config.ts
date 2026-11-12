import { defineConfig, devices } from "@playwright/test";
import { sharedUse, webServer } from "../../playwright.shared";

// config ของบทที่ 42 โดยเฉพาะ (config หลักของ repo ข้ามโฟลเดอร์นี้ผ่าน testIgnore)
// รันด้วย: pnpm test --config lessons/42-multiple-roles/playwright.config.ts
export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  reporter: [["list"]],

  projects: [
    // project "setup" เก็บทั้ง user.setup.ts และ admin.setup.ts (สองไฟล์นี้รันขนานกันได้)
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    {
      name: "chromium",
      testMatch: /.*\.spec\.ts/,
      // บทนี้ "ไม่" ตั้ง storageState ที่ระดับ project: ให้แต่ละกลุ่ม test เลือกบทบาทเองด้วย test.use ในไฟล์ spec
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],

  use: sharedUse,
  webServer,
});
