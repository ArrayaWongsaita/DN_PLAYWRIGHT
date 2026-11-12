import path from "node:path";
import { test as setup, expect } from "@playwright/test";

// ไฟล์ setup (เฉลยข้อ 1): login ผ่านหน้าเว็บครั้งเดียว แล้วบันทึกสถานะลงไฟล์ ให้ทุก test ใน project "chromium" ใช้ต่อ
// project "setup" ใน playwright.config.ts จับไฟล์ที่ลงท้าย .setup.ts และ project อื่นรอให้ project นี้ผ่านก่อน
export const authFile = path.join(import.meta.dirname, ".auth", "user.json");

setup("login เป็นผู้ใช้ทั่วไปแล้วบันทึกสถานะ", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("user@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("password123");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  // รอให้ login เสร็จจริง (ไปหน้า /account) ก่อนบันทึก ไม่เช่นนั้นไฟล์จะยังไม่มี cookie dn_auth
  await expect(page).toHaveURL("/account");

  // ทำไมต้องลบ dn_sid: cookie นี้คือ "ตะกร้ากับประวัติคำสั่งซื้อ" ของ session ถ้าบันทึกไว้ในไฟล์ ทุก test จะใช้ session เดียวกัน
  // และชนกันเมื่อรันขนาน ลบแล้วยัง login อยู่ (cookie dn_auth แยกอิสระ) แต่ทุก test ได้ session ใหม่ของตัวเอง (บท 41)
  await page.context().clearCookies({ name: "dn_sid" });
  await page.context().storageState({ path: authFile });
});
