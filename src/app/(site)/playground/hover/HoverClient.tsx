"use client";

import Link from "next/link";
import { useState } from "react";

export function HoverClient() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <h1>Hover</h1>
      <div
        className="hover-menu"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <button type="button" aria-haspopup="true" aria-expanded={open}>
          บริการลูกค้า
        </button>
        {open && (
          <ul className="hover-menu-list">
            <li>
              <Link href="/help/ordering">ติดตามพัสดุ</Link>
            </li>
            <li>
              <Link href="/help/ordering">คืนสินค้า</Link>
            </li>
          </ul>
        )}
      </div>
    </>
  );
}
