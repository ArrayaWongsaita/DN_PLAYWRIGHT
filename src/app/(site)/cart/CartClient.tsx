"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { formatBaht } from "@/lib/format";
import type { CartSummary } from "@/lib/types";

export function CartClient({ initial }: { initial: CartSummary }) {
  const router = useRouter();
  const [cart, setCart] = useState(initial);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function call(url: string, init: RequestInit): Promise<boolean> {
    setError("");
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json" },
    });
    const body = (await res.json().catch(() => ({}))) as Partial<CartSummary> & { message?: string };
    if (!res.ok) {
      setError(body.message ?? "เกิดข้อผิดพลาด");
      return false;
    }
    setCart(body as CartSummary);
    router.refresh();
    return true;
  }

  function setQuantity(productId: string, quantity: number) {
    setMessage("");
    return call(`/api/cart/${productId}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
  }

  async function remove(productId: string, name: string) {
    if (!window.confirm(`ต้องการลบ "${name}" ออกจากตะกร้าใช่ไหม?`)) return;
    setMessage("");
    await call(`/api/cart/${productId}`, { method: "DELETE" });
  }

  async function applyCoupon(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const trimmed = code.trim();
    const ok = await call("/api/cart/coupon", { method: "POST", body: JSON.stringify({ code: trimmed }) });
    if (ok) setMessage(`ใช้โค้ด ${trimmed.toUpperCase()} แล้ว ลด 10%`);
  }

  const empty = cart.items.length === 0;

  return (
    <>
      <h1>ตะกร้าสินค้า</h1>
      {empty ? (
        <>
          <p>ตะกร้าของคุณยังว่างอยู่</p>
          <Link href="/products">เลือกซื้อสินค้า</Link>
        </>
      ) : (
        <ul aria-label="สินค้าในตะกร้า" className="cart-list">
          {cart.items.map((line) => (
            <li key={line.productId} className="cart-line">
              <strong>{line.name}</strong>
              <span>{formatBaht(line.price)}</span>
              <button
                type="button"
                disabled={line.quantity <= 1}
                onClick={() => setQuantity(line.productId, line.quantity - 1)}
              >
                ลดจำนวน
              </button>
              <input aria-label="จำนวน" value={line.quantity} readOnly size={3} />
              <button type="button" onClick={() => setQuantity(line.productId, line.quantity + 1)}>
                เพิ่มจำนวน
              </button>
              <span>{formatBaht(line.lineTotal)}</span>
              <button type="button" onClick={() => remove(line.productId, line.name)}>
                ลบ
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={applyCoupon} className="toolbar">
        <label>
          โค้ดส่วนลด
          <input value={code} onChange={(e) => setCode(e.target.value)} />
        </label>
        <button type="submit" disabled={code.trim() === ""}>
          ใช้โค้ด
        </button>
      </form>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      <dl className="summary">
        <dt>ยอดรวมสินค้า</dt>
        <dd data-testid="subtotal">{formatBaht(cart.subtotal)}</dd>
        <dt>ส่วนลด</dt>
        <dd data-testid="discount">{formatBaht(cart.discount)}</dd>
        <dt>ยอดสุทธิ</dt>
        <dd data-testid="total">{formatBaht(cart.total)}</dd>
      </dl>
      <button type="button" disabled={empty} onClick={() => router.push("/checkout")}>
        ไปชำระเงิน
      </button>
    </>
  );
}
