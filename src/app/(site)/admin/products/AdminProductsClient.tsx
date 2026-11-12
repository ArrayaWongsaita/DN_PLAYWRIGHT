"use client";

import { useState, type FormEvent } from "react";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatBaht } from "@/lib/format";
import type { CategoryId, Product } from "@/lib/types";

export function AdminProductsClient({ initial }: { initial: Product[] }) {
  const [products, setProducts] = useState(initial);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<CategoryId>("it");
  const [stock, setStock] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function add(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price: Number(price), category, stock: Number(stock) }),
    });
    const body = (await res.json().catch(() => ({}))) as Product & { message?: string };
    if (!res.ok) {
      setError(body.message ?? "เกิดข้อผิดพลาด");
      return;
    }
    setProducts((cur) => [...cur, body]);
    setName("");
    setPrice("");
    setStock("");
    setMessage("เพิ่มสินค้าแล้ว");
  }

  async function remove(p: Product) {
    if (!window.confirm(`ต้องการลบสินค้า "${p.name}" ใช่ไหม?`)) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      setError(body.message ?? "เกิดข้อผิดพลาด");
      return;
    }
    setProducts((cur) => cur.filter((x) => x.id !== p.id));
  }

  return (
    <>
      <h1>จัดการสินค้า</h1>
      <p>
        <a href="/api/products/export">ส่งออกรายการสินค้า (CSV)</a>
      </p>
      <table aria-label="ตารางสินค้า">
        <thead>
          <tr>
            <th>ชื่อสินค้า</th>
            <th>หมวดหมู่</th>
            <th>ราคา</th>
            <th>คงเหลือ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{CATEGORY_LABELS[p.category]}</td>
              <td>{formatBaht(p.price)}</td>
              <td>{p.stock}</td>
              <td>
                <button type="button" onClick={() => remove(p)}>
                  ลบ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>เพิ่มสินค้าใหม่</h2>
      <form onSubmit={add} className="checkout-form">
        <label>
          ชื่อสินค้า
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          ราคา
          <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label>
          หมวดหมู่
          <select value={category} onChange={(e) => setCategory(e.target.value as CategoryId)}>
            {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          จำนวนคงเหลือ
          <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
        </label>
        <button type="submit">เพิ่มสินค้า</button>
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}
      </form>
    </>
  );
}
