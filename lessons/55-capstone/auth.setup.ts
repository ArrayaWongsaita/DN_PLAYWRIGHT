import path from "node:path";
import { test as setup } from "@playwright/test";

// โครงของไฟล์ setup (ข้อ 1 ในไฟล์ shopping-flow.spec.ts อธิบายสิ่งที่ต้องทำ)
// project "setup" ใน playwright.config.ts จับไฟล์ที่ลงท้าย .setup.ts และรันก่อน project "chromium"
// ตำแหน่งไฟล์ที่ config ของบทนี้อ่าน: lessons/55-capstone/.auth/user.json
export const authFile = path.join(import.meta.dirname, ".auth", "user.json");

setup.fixme("login เป็นผู้ใช้ทั่วไปแล้วบันทึกสถานะ", async ({ page }) => {
  // 👉 เขียนตรงนี้ แล้วเปลี่ยน setup.fixme เป็น setup
  //    ขั้นตอน: เปิด /login, กรอกอีเมลและรหัสผ่านของผู้ใช้ทั่วไป, กดเข้าสู่ระบบ, รอจน URL เป็น /account
  //    แล้วลบ cookie dn_sid (ให้ทุก test ได้ตะกร้าใหม่ของตัวเอง ดูเหตุผลในบท 41) แล้วบันทึกสถานะลง authFile
  void page;
});
