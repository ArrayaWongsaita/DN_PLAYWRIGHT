"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/types";

export function ProductDetailClient({
  product,
  categoryLabel,
  priceText,
}: {
  product: Product;
  categoryLabel: string;
  priceText: string;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [tip, setTip] = useState(false);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function addToCart() {
    setAdding(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "เพิ่มลงตะกร้าไม่สำเร็จ");
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMessage("เพิ่มลงตะกร้าแล้ว");
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <p>
        <Link href="/products">← กลับไปหน้าสินค้า</Link>
      </p>
      <h1>{product.name}</h1>
      <figure>
        <img
          src={product.image}
          alt={product.name}
          width={400}
          height={300}
          className={zoomed ? "detail-image zoomed" : "detail-image"}
          onDoubleClick={() => setZoomed((v) => !v)}
        />
        <figcaption>{zoomed ? "ดับเบิลคลิกเพื่อย่อรูป" : "ดับเบิลคลิกเพื่อขยายรูป"}</figcaption>
      </figure>
      <p className="price">{priceText}</p>
      <p>{product.description}</p>
      <p className="category">{categoryLabel}</p>
      <p>
        <span title="จำนวนที่เหลือในคลัง">คงเหลือ {product.stock} ชิ้น</span>
      </p>

      <div className="quantity">
        <button type="button" onClick={() => setQuantity((n) => n - 1)} disabled={quantity <= 1}>
          ลดจำนวน
        </button>
        <input aria-label="จำนวน" value={quantity} readOnly />
        <button type="button" onClick={() => setQuantity((n) => n + 1)} disabled={quantity >= product.stock}>
          เพิ่มจำนวน
        </button>
      </div>

      <p>
        <button type="button" onClick={addToCart} disabled={adding || product.stock === 0}>
          เพิ่มลงตะกร้า
        </button>
      </p>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      <div className="tooltip-wrap">
        <button
          type="button"
          aria-describedby={tip ? "shipping-tip" : undefined}
          onMouseEnter={() => setTip(true)}
          onMouseLeave={() => setTip(false)}
          onFocus={() => setTip(true)}
          onBlur={() => setTip(false)}
        >
          ข้อมูลการจัดส่ง
        </button>
        {tip && (
          <span role="tooltip" id="shipping-tip" className="tooltip">
            จัดส่งภายใน 1–3 วันทำการ
          </span>
        )}
      </div>
    </>
  );
}
