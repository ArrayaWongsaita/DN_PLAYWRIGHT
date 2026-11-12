import path from "node:path";
import { test as setup, expect } from "@playwright/test";

// login เป็นผู้ใช้ทั่วไปแล้วบันทึกลง .auth/user.json (รูปแบบเดียวกับบท 41)
const userFile = path.join(import.meta.dirname, ".auth", "user.json");

setup("login เป็นผู้ใช้ทั่วไป", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("user@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("password123");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page).toHaveURL("/account");

  // ลบ cookie ตะกร้า (dn_sid) ทิ้ง ให้ทุก test ได้ตะกร้าและข้อมูลสินค้าใหม่เอง (อธิบายในบท 41)
  await page.context().clearCookies({ name: "dn_sid" });
  await page.context().storageState({ path: userFile });
});
