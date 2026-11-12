import { expect, type APIRequestContext } from "@playwright/test";

export type Customer = { name: string; address: string; phone: string };

export const DEFAULT_CUSTOMER: Customer = {
  name: "สมชาย ใจดี",
  address: "99 ถนนสุขุมวิท กรุงเทพฯ",
  phone: "0812345678",
};

// ตัวช่วยเตรียมข้อมูลผ่าน API (บท 37): ใช้ในข้อที่หน้าตะกร้า/ชำระเงินไม่ใช่เป้าหมายของ test
// ทุกคำสั่งตรวจ status ทันที เพื่อให้ถ้าเตรียมข้อมูลพัง test ล้มตรงนี้ พร้อมข้อความที่บอกต้นเหตุ
export class ShopApi {
  constructor(private readonly request: APIRequestContext) {}

  async addToCart(productId: string, quantity = 1): Promise<void> {
    const res = await this.request.post("/api/cart", { data: { productId, quantity } });
    expect(res.status(), `เพิ่ม ${productId} ลงตะกร้าผ่าน API`).toBe(201);
  }

  // สั่งซื้อตะกร้าปัจจุบันด้วยเก็บเงินปลายทาง (ไม่ผ่านฟอร์มบัตร) แล้วคืนหมายเลขคำสั่งซื้อ
  async placeOrder(customer: Customer = DEFAULT_CUSTOMER): Promise<string> {
    const res = await this.request.post("/api/orders", {
      data: { customer, shipping: "standard", payment: "cod" },
    });
    expect(res.status(), "สั่งซื้อผ่าน API").toBe(201);
    const order = (await res.json()) as { id: string };
    return order.id;
  }
}
