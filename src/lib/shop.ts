import { COUPONS, SHIPPING_FEES } from "./constants";
import { SEED_USERS } from "./seed";
import { formatOrderId } from "./format";
import type {
  CartLine,
  CartSummary,
  CategoryId,
  Customer,
  Order,
  PaymentMethod,
  Product,
  PublicUser,
  SessionData,
  ShippingMethod,
  User,
} from "./types";

export class ShopError extends Error {
  field?: string;
  constructor(
    public status: number,
    message: string,
    field?: string,
  ) {
    super(message);
    this.field = field;
  }
}

const CATEGORIES: CategoryId[] = ["it", "fashion", "home", "books"];
const SHIPPING_METHODS: ShippingMethod[] = ["standard", "express"];
const PAYMENT_METHODS: PaymentMethod[] = ["card", "transfer", "cod"];

export function listProducts(
  d: SessionData,
  opts: { q?: string; category?: CategoryId | "all"; sort?: "featured" | "price-asc" | "price-desc" } = {},
): Product[] {
  const q = opts.q?.trim().toLowerCase();
  let result = d.products.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (opts.category && opts.category !== "all" && p.category !== opts.category) return false;
    return true;
  });
  const sort = opts.sort ?? "featured";
  if (sort === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
  else result = [...result].sort((a, b) => Number(b.featured) - Number(a.featured)); // sort เสถียร: featured ก่อน แล้วตามลำดับเดิม
  return result;
}

export function getProduct(d: SessionData, id: string): Product {
  const product = d.products.find((p) => p.id === id);
  if (!product) throw new ShopError(404, "ไม่พบสินค้า");
  return product;
}

export function getCartSummary(d: SessionData): CartSummary {
  const items: CartLine[] = [];
  for (const item of d.cart) {
    const p = d.products.find((x) => x.id === item.productId);
    if (!p) continue;
    items.push({
      productId: p.id,
      name: p.name,
      price: p.price,
      quantity: item.quantity,
      lineTotal: p.price * item.quantity,
    });
  }
  const subtotal = items.reduce((sum, l) => sum + l.lineTotal, 0);
  const rate = d.coupon ? (COUPONS[d.coupon] ?? 0) : 0;
  const discount = Math.round(subtotal * rate);
  return {
    items,
    count: items.reduce((sum, l) => sum + l.quantity, 0),
    subtotal,
    discount,
    total: subtotal - discount,
    coupon: d.coupon,
  };
}

function assertQuantity(quantity: unknown): asserts quantity is number {
  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
    throw new ShopError(400, "จำนวนไม่ถูกต้อง");
  }
}

export function addToCart(d: SessionData, productId: string, quantity: number = 1): CartSummary {
  assertQuantity(quantity);
  const product = getProduct(d, productId);
  const existing = d.cart.find((i) => i.productId === productId);
  const next = (existing?.quantity ?? 0) + quantity;
  if (next > product.stock) throw new ShopError(409, "สินค้าในสต็อกไม่พอ");
  if (existing) existing.quantity = next;
  else d.cart.push({ productId, quantity });
  return getCartSummary(d);
}

export function setCartQuantity(d: SessionData, productId: string, quantity: number): CartSummary {
  assertQuantity(quantity);
  const product = getProduct(d, productId);
  const existing = d.cart.find((i) => i.productId === productId);
  if (!existing) throw new ShopError(404, "ไม่พบสินค้าในตะกร้า");
  if (quantity > product.stock) throw new ShopError(409, "สินค้าในสต็อกไม่พอ");
  existing.quantity = quantity;
  return getCartSummary(d);
}

export function removeFromCart(d: SessionData, productId: string): CartSummary {
  const index = d.cart.findIndex((i) => i.productId === productId);
  if (index === -1) throw new ShopError(404, "ไม่พบสินค้าในตะกร้า");
  d.cart.splice(index, 1);
  return getCartSummary(d);
}

export function clearCart(d: SessionData): CartSummary {
  d.cart = [];
  d.coupon = null;
  return getCartSummary(d);
}

export function applyCoupon(d: SessionData, code: string): CartSummary {
  const normalized = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (!normalized || !(normalized in COUPONS)) throw new ShopError(400, "โค้ดส่วนลดไม่ถูกต้อง");
  d.coupon = normalized;
  return getCartSummary(d);
}

export function placeOrder(
  d: SessionData,
  input: { customer: Customer; shipping: ShippingMethod; payment: PaymentMethod },
): Order {
  const summary = getCartSummary(d);
  if (summary.items.length === 0) throw new ShopError(400, "ตะกร้าว่าง");
  const c = input.customer;
  const filled = (v: unknown) => typeof v === "string" && v.trim() !== "";
  if (!c || !filled(c.name) || !filled(c.address) || !filled(c.phone)) {
    throw new ShopError(400, "ข้อมูลผู้รับไม่ครบ");
  }
  if (!SHIPPING_METHODS.includes(input.shipping) || !PAYMENT_METHODS.includes(input.payment)) {
    throw new ShopError(400, "ข้อมูลการจัดส่งหรือชำระเงินไม่ถูกต้อง");
  }
  for (const line of summary.items) {
    const p = getProduct(d, line.productId);
    if (line.quantity > p.stock) throw new ShopError(409, "สินค้าในสต็อกไม่พอ");
  }
  const shippingFee = SHIPPING_FEES[input.shipping];
  const order: Order = {
    id: formatOrderId(d.nextOrderNo),
    items: summary.items,
    subtotal: summary.subtotal,
    discount: summary.discount,
    shippingFee,
    total: summary.total + shippingFee,
    shipping: input.shipping,
    payment: input.payment,
    customer: { name: c.name.trim(), address: c.address.trim(), phone: c.phone.trim() },
    createdAt: new Date().toISOString(),
  };
  d.nextOrderNo += 1;
  for (const line of summary.items) getProduct(d, line.productId).stock -= line.quantity;
  d.orders.push(order);
  clearCart(d);
  return order;
}

export function addProduct(
  d: SessionData,
  input: { name: string; price: number; category: CategoryId; stock: number },
): Product {
  const { name, price, category, stock } = input ?? {};
  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    !CATEGORIES.includes(category) ||
    typeof stock !== "number" ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    throw new ShopError(400, "ข้อมูลสินค้าไม่ครบ");
  }
  const max = d.products.reduce((m, p) => Math.max(m, Number(p.id.slice(1))), 0);
  const id = `p${String(max + 1).padStart(2, "0")}`;
  const product: Product = {
    id,
    name: name.trim(),
    category,
    price,
    stock,
    featured: false,
    description: "สินค้าใหม่",
    image: "/products/default.svg",
  };
  d.products.push(product);
  return product;
}

export function deleteProduct(d: SessionData, id: string): void {
  const index = d.products.findIndex((p) => p.id === id);
  if (index === -1) throw new ShopError(404, "ไม่พบสินค้า");
  d.products.splice(index, 1);
  d.cart = d.cart.filter((i) => i.productId !== id);
}

function toPublic(u: User): PublicUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

export function registerUser(
  d: SessionData,
  input: { name: string; email: string; password: string },
): PublicUser {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const email = typeof input?.email === "string" ? input.email.trim() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  if (!name) throw new ShopError(400, "กรุณากรอกชื่อ", "name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ShopError(400, "รูปแบบอีเมลไม่ถูกต้อง", "email");
  if (password.length < 8) throw new ShopError(400, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", "password");
  const lower = email.toLowerCase();
  const taken = [...SEED_USERS, ...d.users].some((u) => u.email.toLowerCase() === lower);
  if (taken) throw new ShopError(409, "อีเมลนี้ถูกใช้แล้ว", "email");
  const user: User = { id: `u${SEED_USERS.length + d.users.length + 1}`, name, email, password, role: "user" };
  d.users.push(user);
  return toPublic(user);
}

export function findUserByCredentials(d: SessionData, email: string, password: string): User | null {
  const lower = typeof email === "string" ? email.trim().toLowerCase() : "";
  return (
    [...SEED_USERS, ...d.users].find((u) => u.email.toLowerCase() === lower && u.password === password) ?? null
  );
}

export function getOrder(d: SessionData, id: string): Order {
  const order = d.orders.find((o) => o.id === id);
  if (!order) throw new ShopError(404, "ไม่พบคำสั่งซื้อ");
  return order;
}
