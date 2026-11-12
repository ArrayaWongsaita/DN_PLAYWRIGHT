import type { CategoryId, ShippingMethod } from "./types";

export const PORT = 3100;
export const SESSION_COOKIE = "dn_sid";
export const AUTH_COOKIE = "dn_auth";
export const COUPONS: Record<string, number> = { DN10: 0.1 };
export const SHIPPING_FEES: Record<ShippingMethod, number> = { standard: 50, express: 100 };
export const FLASH_SALE_END = "2030-12-31T23:59:59+07:00";
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
export const MAX_DELAY_MS = 10000;
export const VALID_CARD = "4242 4242 4242 4242";
export const CATEGORY_LABELS: Record<CategoryId, string> = {
  it: "อุปกรณ์ไอที",
  fashion: "เสื้อผ้า",
  home: "ของใช้ในบ้าน",
  books: "หนังสือ",
};
