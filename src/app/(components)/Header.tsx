"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicUser } from "@/lib/types";

export function Header({ cartCount, user }: { cartCount: number; user: PublicUser | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        DN Shop
      </Link>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen((v) => !v)}
      >
        เปิดเมนู
      </button>
      <nav id="main-nav" aria-label="เมนูหลัก" className={open ? "main-nav open" : "main-nav"}>
        <Link href="/">หน้าแรก</Link>
        <Link href="/products">สินค้า</Link>
        <Link href="/cart">
          ตะกร้า (<span data-testid="cart-count">{cartCount}</span>)
        </Link>
        {user ? (
          <>
            {user.role === "admin" && <Link href="/admin/products">จัดการสินค้า</Link>}
            <Link href="/account">บัญชีของฉัน</Link>
            <button type="button" onClick={logout}>
              ออกจากระบบ
            </button>
          </>
        ) : (
          <Link href="/login">เข้าสู่ระบบ</Link>
        )}
      </nav>
    </header>
  );
}
