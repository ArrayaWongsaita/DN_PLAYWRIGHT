import fs from "node:fs";
import path from "node:path";

// globalTeardown รันครั้งเดียวหลัง test ทั้งหมดจบ (แม้บาง test จะล้ม)
// ไฟล์สถานะมี cookie ที่ใช้ login ได้จริง จึงลบทิ้งเมื่อไม่ต้องใช้แล้ว
const authFile = path.join(import.meta.dirname, ".auth", "user.json");

export default async function globalTeardown() {
  fs.rmSync(authFile, { force: true });
  console.log("[global-teardown] ลบไฟล์สถานะ login แล้ว");
}
