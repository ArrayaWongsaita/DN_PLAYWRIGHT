import path from "node:path";
import { test as setup, expect } from "@playwright/test";

// login เป็นผู้ดูแลระบบแล้วบันทึกลง .auth/admin.json
const adminFile = path.join(import.meta.dirname, ".auth", "admin.json");

setup("login เป็นผู้ดูแลระบบ", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("admin@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("admin123");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL("/account");

  await page.context().clearCookies({ name: "dn_sid" });
  await page.context().storageState({ path: adminFile });
});
