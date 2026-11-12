"use client";

import { useEffect } from "react";
import { greetingFor } from "../../../(components)/Greeting";

declare global {
  interface Window {
    dnShop: { version: string; getGreeting(): string };
  }
}

export function ConsoleClient() {
  useEffect(() => {
    console.log("หน้า console พร้อมแล้ว");
    window.dnShop = {
      version: "1.0.0",
      getGreeting: () => greetingFor(new Date().getHours()),
    };
  }, []);

  return (
    <>
      <h1>Console</h1>
      <p className="row">
        <button type="button" onClick={() => console.log("กดปุ่มแล้ว")}>
          log ข้อความ
        </button>
        <button type="button" onClick={() => console.warn("ระวัง: สินค้าใกล้หมด")}>
          เตือน
        </button>
        <button
          type="button"
          onClick={() => {
            // โยนนอก event handler ของ React เพื่อให้เป็น uncaught error (pageerror)
            setTimeout(() => {
              throw new Error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
            }, 0);
          }}
        >
          ทำให้ error
        </button>
      </p>
    </>
  );
}
