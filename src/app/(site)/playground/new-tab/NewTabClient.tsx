"use client";

import Link from "next/link";

export function NewTabClient() {
  return (
    <>
      <h1>New tab</h1>
      <p>
        <Link href="/help/ordering" target="_blank">
          เปิดคู่มือการสั่งซื้อในแท็บใหม่
        </Link>
      </p>
      <p>
        <button type="button" onClick={() => window.open("/playground/chat", "chat", "popup,width=400,height=600")}>
          เปิดหน้าต่างแชท
        </button>
      </p>
    </>
  );
}
