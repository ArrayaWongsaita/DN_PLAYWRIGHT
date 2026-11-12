"use client";

import { useEffect, useState } from "react";

export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "สวัสดีตอนเช้า";
  if (hour >= 12 && hour < 17) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
}

/** render หลัง mount เท่านั้น เพราะขึ้นกับเวลาเครื่องผู้ใช้ */
export function Greeting() {
  const [text, setText] = useState("");
  useEffect(() => setText(greetingFor(new Date().getHours())), []);
  return <p data-testid="greeting">{text}</p>;
}
