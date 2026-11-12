import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { sharedUse, webServer } from "../../playwright.shared";

// config ของบทที่ 49 โดยเฉพาะ (config หลักของ repo ข้ามโฟลเดอร์นี้ผ่าน testIgnore)
// รันด้วย: pnpm test --config lessons/49-global-setup-env/playwright.config.ts

// 1) โหลดค่าจากไฟล์ .env (ถ้ามี) เข้า process.env Node 24 มี process.loadEnvFile ในตัว ไม่ต้องลง dotenv
//    ใช้ path เต็มของไฟล์ในโฟลเดอร์บทนี้ เพราะ path แบบสั้นจะเทียบกับโฟลเดอร์ที่สั่งรัน (root ของ repo)
//    ต้องเช็กว่าไฟล์มีอยู่ก่อน เพราะ loadEnvFile โยน error ถ้าไม่เจอไฟล์
//    ค่าที่ตั้งไว้ใน environment อยู่แล้ว (เช่นตั้งใน CI) จะไม่ถูกไฟล์ .env ทับ
const lessonDir = import.meta.dirname;
const envFile = path.join(lessonDir, ".env");
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

// 2) ค่า fallback: ถ้ายังไม่มีค่าใน process.env ให้ใช้บัญชีทดสอบของแอปนี้ (ตัวอย่างจึงรันผ่านได้โดยไม่ต้องมี .env)
process.env.DN_USER_EMAIL ??= "user@dnshop.test";
process.env.DN_USER_PASSWORD ??= "password123";

// ไฟล์สถานะ login ที่ global-setup.ts เขียน (โฟลเดอร์ .auth ถูก git ignore ไว้)
const AUTH_FILE = path.join(lessonDir, ".auth", "user.json");

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  reporter: [["list"]],

  // รันครั้งเดียวก่อน test ทั้งหมด และ teardown ครั้งเดียวหลัง test ทั้งหมดจบ
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",

  projects: [
    {
      name: "chromium",
      testMatch: /.*\.spec\.ts/,
      // ทุก test เริ่มด้วยสถานะที่ global-setup.ts login ไว้ให้
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
    },
  ],

  use: sharedUse,
  webServer,
});
