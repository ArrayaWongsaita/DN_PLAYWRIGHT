import { defineConfig, devices } from "@playwright/test";
import { sharedUse, webServer } from "../../playwright.shared";

// config ของบทที่ 41 โดยเฉพาะ (config หลักของ repo ข้ามโฟลเดอร์นี้ผ่าน testIgnore)
// รันด้วย: pnpm test --config lessons/41-auth-storage-state/playwright.config.ts
export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  reporter: [["list"]],

  projects: [
    // project "setup": รันไฟล์ *.setup.ts (login แล้วบันทึกสถานะลงไฟล์) ก่อนใคร
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    {
      name: "chromium",
      // ไม่ให้ project นี้เก็บไฟล์ .setup.ts ไปรันซ้ำ
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        // ทุก test ใน project นี้เริ่มด้วย cookie ที่ login แล้ว (path เทียบกับโฟลเดอร์ที่สั่งรัน คือ root ของ repo)
        storageState: "lessons/41-auth-storage-state/.auth/user.json",
      },
      // รอให้ project "setup" ผ่านก่อน จึงจะเริ่ม project นี้
      dependencies: ["setup"],
    },
  ],

  use: sharedUse,
  webServer,
});
