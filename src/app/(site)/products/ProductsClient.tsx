"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ProductCard } from "../../(components)/ProductCard";
import type { Product } from "@/lib/types";

type LoadState = "loading" | "done" | "error";

export function ProductsClient() {
  const router = useRouter();
  const params = useSearchParams();
  // ตัวกรองเก็บใน state (เริ่มจาก URL) แล้วเขียนกลับ URL เพื่อแชร์ลิงก์ได้
  // ไม่อ่าน URL ซ้ำ เพื่อไม่ให้เปลี่ยนตัวกรองสองตัวติดกันแล้วตัวแรกหาย
  const [filters, setFilters] = useState({
    q: params.get("q") ?? "",
    category: params.get("category") ?? "all",
    sort: params.get("sort") ?? "featured",
  });
  const { q, category, sort } = filters;
  const delay = params.get("delay") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState("");
  const [cartError, setCartError] = useState("");
  const [query, setQuery] = useState(q);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (category !== "all") search.set("category", category);
    if (sort !== "featured") search.set("sort", sort);
    if (delay) search.set("delay", delay);
    setState("loading");
    fetch(`/api/products?${search}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { products: Product[] };
        setProducts(body.products);
        setState("done");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState("error");
      });
    return () => controller.abort();
  }, [q, category, sort, delay, attempt]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function update(changes: Partial<typeof filters>) {
    const next = { ...filters, ...changes };
    setFilters(next);
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.category !== "all") sp.set("category", next.category);
    if (next.sort !== "featured") sp.set("sort", next.sort);
    if (delay) sp.set("delay", delay);
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `/products?${qs}` : "/products");
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    update({ q: query.trim() });
  }

  async function addToCart(product: Product) {
    setMessage("");
    setCartError("");
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    });
    if (res.ok) {
      setMessage(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว`);
      router.refresh();
    } else {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      setCartError(body.message ?? "เพิ่มลงตะกร้าไม่สำเร็จ");
    }
  }

  return (
    <>
      <h1>สินค้าทั้งหมด</h1>
      <form role="search" onSubmit={onSearch} className="toolbar">
        <label>
          ค้นหาสินค้า
          <input
            ref={searchRef}
            type="search"
            placeholder="พิมพ์ชื่อสินค้า แล้วกด Enter"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button type="submit">ค้นหา</button>
        <label>
          หมวดหมู่
          <select value={category} onChange={(e) => update({ category: e.target.value })}>
            <option value="all">ทั้งหมด</option>
            <option value="it">อุปกรณ์ไอที</option>
            <option value="fashion">เสื้อผ้า</option>
            <option value="home">ของใช้ในบ้าน</option>
            <option value="books">หนังสือ</option>
          </select>
        </label>
        <label>
          เรียงตาม
          <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
            <option value="featured">แนะนำ</option>
            <option value="price-asc">ราคาต่ำไปสูง</option>
            <option value="price-desc">ราคาสูงไปต่ำ</option>
          </select>
        </label>
      </form>

      {message && <p role="status">{message}</p>}
      {cartError && <p role="alert">{cartError}</p>}
      {state === "loading" && <p role="status">กำลังโหลดสินค้า...</p>}
      {state === "error" && (
        <div role="alert">
          โหลดสินค้าไม่สำเร็จ กรุณาลองใหม่{" "}
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            ลองใหม่
          </button>
        </div>
      )}
      {state === "done" && (
        <>
          <p>พบสินค้า {products.length} รายการ</p>
          {products.length === 0 && <p>ไม่พบสินค้าที่ค้นหา</p>}
          <ul aria-label="รายการสินค้า" className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p}>
                {p.stock > 0 ? (
                  <button type="button" onClick={() => addToCart(p)}>
                    เพิ่มลงตะกร้า
                  </button>
                ) : (
                  <button type="button" disabled>
                    สินค้าหมด
                  </button>
                )}
              </ProductCard>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
