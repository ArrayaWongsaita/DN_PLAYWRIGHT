import type { PlaywrightTestConfig } from "@playwright/test";

const rootDir = import.meta.dirname;

export const PORT = 3100;
export const baseURL = `http://localhost:${PORT}`;

export const webServer = {
  command: "node scripts/start-app.mjs",
  // config ของบท/internal อยู่ในโฟลเดอร์ย่อย จึงต้องชี้ cwd กลับมาที่ root เสมอ
  cwd: rootDir,
  url: `${baseURL}/api/health`,
  reuseExistingServer: !process.env.CI,
  timeout: 180_000,
} satisfies PlaywrightTestConfig["webServer"];

export const sharedUse = {
  baseURL,
  locale: "th-TH",
  timezoneId: "Asia/Bangkok",
  trace: "retain-on-failure",
  screenshot: "only-on-failure",
} satisfies PlaywrightTestConfig["use"];

/** บทที่มี playwright.config.ts ของตัวเอง (ถูกข้ามเมื่อรัน config หลัก) */
export const LESSON_CONFIG_DIRS: string[] = [
  "23-config",
  "41-auth-storage-state",
  "42-multiple-roles",
  "43-browsers-emulation",
  "45-visual-comparison",
  "48-parallel-retries",
  "49-global-setup-env",
  "50-reporters",
  "51-ci-github-actions",
  "55-capstone",
];
