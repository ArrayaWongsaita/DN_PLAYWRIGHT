import { defineConfig, devices } from "@playwright/test";
import { sharedUse, webServer } from "../playwright.shared";

export default defineConfig({
  testDir: "app-tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: sharedUse,
  webServer,
});
