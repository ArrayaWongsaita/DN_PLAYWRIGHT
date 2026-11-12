import { defineConfig, devices } from "@playwright/test";
import { LESSON_CONFIG_DIRS, sharedUse, webServer } from "./playwright.shared";

export default defineConfig({
  testDir: "lessons",
  testIgnore: LESSON_CONFIG_DIRS.map((d) => `**/${d}/**`),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: sharedUse,
  webServer,
});
