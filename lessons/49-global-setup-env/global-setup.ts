import fs from "node:fs";
import path from "node:path";
import { request } from "@playwright/test";
import { baseURL } from "../../playwright.shared";

// globalSetup รันครั้งเดียวก่อน test ทั้งหมด (หลังแอปเปิดแล้ว) ต่างจาก project setup ในบท 41 ที่เป็น test ธรรมดา
// ตรงที่ไม่มี fixture ไม่ปรากฏในรายงาน และ error ในนี้ทำให้ทั้งการรันหยุดทันที
// ที่นี่เรา login ผ่าน API (เร็วกว่ากรอกฟอร์ม) แล้วบันทึกสถานะลงไฟล์ให้ทุก test ใช้
const authFile = path.join(import.meta.dirname, ".auth", "user.json");

export default async function globalSetup() {
  // อ่านอีเมล/รหัสผ่านจาก environment ที่ playwright.config.ts เตรียมไว้ (ไม่ฝังค่าลงโค้ด)
  const email = process.env.DN_USER_EMAIL;
  const password = process.env.DN_USER_PASSWORD;
  if (!email || !password) throw new Error("ต้องตั้ง DN_USER_EMAIL และ DN_USER_PASSWORD");

  // request.newContext สร้าง API client ที่ไม่มี browser (เหมือน page.request ในบท 37 แต่ไม่ผูกกับหน้า)
  const api = await request.newContext({ baseURL });
  const res = await api.post("/api/auth/login", { data: { email, password } });
  if (!res.ok()) throw new Error(`login ใน global-setup ไม่สำเร็จ: status ${res.status()}`);

  const state = await api.storageState();
  // ตัด cookie ตะกร้า (dn_sid) ออก เพื่อให้ทุก test ได้ตะกร้าใหม่ของตัวเอง (เหตุผลเดียวกับบท 41)
  state.cookies = state.cookies.filter((cookie) => cookie.name !== "dn_sid");
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  fs.writeFileSync(authFile, JSON.stringify(state, null, 2));
  await api.dispose();

  console.log(`[global-setup] login เป็น ${email} แล้ว บันทึกสถานะที่ ${path.relative(process.cwd(), authFile)}`);
}
