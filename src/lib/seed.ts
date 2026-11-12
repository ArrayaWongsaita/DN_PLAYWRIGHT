import type { Product, SessionData, User } from "./types";

type SeedRow = Omit<Product, "image">;

const PRODUCT_ROWS: SeedRow[] = [
  { id: "p01", name: "หูฟังไร้สาย DN Buds", category: "it", price: 1290, stock: 15, featured: true, description: "หูฟังบลูทูธเสียงคมชัด ใช้งานได้ต่อเนื่อง 20 ชั่วโมง" },
  { id: "p02", name: "คีย์บอร์ดเครื่องกล", category: "it", price: 2490, stock: 8, featured: false, description: "คีย์บอร์ดสวิตช์เครื่องกล พิมพ์ลื่น เสียงคลิกกำลังดี" },
  { id: "p03", name: "เมาส์ไร้สาย", category: "it", price: 590, stock: 20, featured: false, description: "เมาส์ไร้สายขนาดกะทัดรัด จับถนัดมือ" },
  { id: "p04", name: "เสื้อยืด DN สีขาว", category: "fashion", price: 290, stock: 30, featured: true, description: "เสื้อยืดคอตตอนนุ่มใส่สบาย ลายโลโก้ DN" },
  { id: "p05", name: "หมวกแก๊ป", category: "fashion", price: 350, stock: 0, featured: false, description: "หมวกแก๊ปผ้าทวิล ปรับขนาดได้" },
  { id: "p06", name: "แก้วกาแฟเซรามิก", category: "home", price: 190, stock: 25, featured: false, description: "แก้วเซรามิกเคลือบเงา จุ 350 มิลลิลิตร" },
  { id: "p07", name: "หมอนอิงลายแมว", category: "home", price: 450, stock: 5, featured: true, description: "หมอนอิงนุ่มลายแมวน่ารัก เหมาะกับโซฟาและเตียง" },
  { id: "p08", name: "หนังสือ TypeScript เบื้องต้น", category: "books", price: 390, stock: 12, featured: false, description: "เริ่มต้นเขียน TypeScript ตั้งแต่พื้นฐานจนใช้งานจริง" },
  { id: "p09", name: "หนังสือ Playwright ฉบับลงมือทำ", category: "books", price: 450, stock: 10, featured: false, description: "เรียนรู้การทดสอบเว็บด้วย Playwright ผ่านตัวอย่างจริง" },
  { id: "p10", name: "สมุดโน้ตลายจุด", category: "books", price: 120, stock: 40, featured: false, description: "สมุดโน้ตปกอ่อนกระดาษลายจุด จดง่ายวาดสะดวก" },
];

export const SEED_USERS: readonly User[] = [
  { id: "u1", name: "สมชาย ใจดี", email: "user@dnshop.test", password: "password123", role: "user" },
  { id: "u2", name: "มาลี ผู้ดูแล", email: "admin@dnshop.test", password: "admin123", role: "admin" },
];

/** สร้างข้อมูล session ใหม่จาก seed (สำเนาใหม่ทุกครั้ง) */
export function createSeedData(): SessionData {
  return {
    products: PRODUCT_ROWS.map((p) => ({ ...p, image: `/products/${p.id}.svg` })),
    cart: [],
    coupon: null,
    orders: [],
    nextOrderNo: 1,
    users: [],
    avatarFileName: null,
    lastSeen: Date.now(),
  };
}
