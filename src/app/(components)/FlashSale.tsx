"use client";

import { useEffect, useState } from "react";
import { FLASH_SALE_END } from "@/lib/constants";

const pad = (n: number) => String(n).padStart(2, "0");

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "Flash Sale จบแล้ว";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hms = `${pad(Math.floor((total % 86400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return days >= 1 ? `เหลือเวลา ${days} วัน ${hms}` : `เหลือเวลา ${hms}`;
}

export function FlashSale() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = now === null ? null : new Date(FLASH_SALE_END).getTime() - now;
  return (
    <section aria-labelledby="flash-sale-title" className="flash-sale">
      <h2 id="flash-sale-title">Flash Sale</h2>
      <p>ลด 50% ทุกชิ้นในหมวดหนังสือ</p>
      <div role="timer" aria-label="เวลาที่เหลือ" className="timer">
        {remaining === null ? "" : formatRemaining(remaining)}
      </div>
    </section>
  );
}
