import { defineConfig, devices } from "@playwright/test";
import { sharedUse, webServer } from "../../playwright.shared";

// config ของบทที่ 55 (เขียนเสร็จให้แล้ว ไม่ต้องแก้) config หลักของ repo ข้ามโฟลเดอร์นี้ผ่าน testIgnore
// รันด้วย: pnpm test --config lessons/55-capstone/playwright.config.ts
// รูปแบบเดียวกับบท 41: project "setup" login ครั้งเดียว แล้ว project "chromium" เริ่มทุก test ด้วยสถานะที่ login แล้ว
export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  reporter: [["list"]],

  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    {
      name: "chromium",
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        // ไฟล์นี้สร้างโดย auth.setup.ts (ที่คุณเขียนในข้อ 1) โฟลเดอร์ .auth ถูก git ignore ไว้แล้ว
        storageState: "lessons/55-capstone/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  use: sharedUse,
  webServer,
});
