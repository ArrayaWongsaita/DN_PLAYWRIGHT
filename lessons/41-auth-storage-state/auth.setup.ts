import path from "node:path";
import { test as setup, expect } from "@playwright/test";

// ไฟล์ setup (เขียนเสร็จแล้ว ใช้เป็นตัวอย่าง): login ผ่านหน้าเว็บ "ครั้งเดียว" แล้วบันทึกสถานะลงไฟล์
// project "setup" ใน playwright.config.ts จับไฟล์ที่ลงท้าย .setup.ts และ project อื่นรอให้ project นี้ผ่านก่อน
const authFile = path.join(import.meta.dirname, ".auth", "user.json");

setup("login เป็นผู้ใช้ทั่วไปแล้วบันทึกสถานะ", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("อีเมล").fill("user@dnshop.test");
  await page.getByLabel("รหัสผ่าน").fill("password123");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  // รอให้ login เสร็จจริง (ไปหน้า /account) ก่อนบันทึก ไม่งั้นไฟล์จะยังไม่มี cookie
  await expect(page).toHaveURL("/account");

  // cookie dn_sid คือตะกร้าของ test ลบทิ้งก่อนบันทึก ทุก test จะได้ตะกร้าใหม่ แต่ยัง login อยู่
  // (cookie dn_auth ที่บอกว่า login แล้วยังอยู่)
  await page.context().clearCookies({ name: "dn_sid" });

  // เขียน cookie และ localStorage ของ context นี้ลงไฟล์ (โฟลเดอร์ .auth ถูก git ignore ไว้)
  await page.context().storageState({ path: authFile });
});
