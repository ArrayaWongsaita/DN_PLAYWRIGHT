"use client";

import { useState } from "react";

export function HelpWidgetClient() {
  const [started, setStarted] = useState(false);
  return (
    <>
      <h1>ช่วยเหลือ</h1>
      <button type="button" onClick={() => setStarted(true)}>
        เริ่มแชท
      </button>
      {started && <p>เจ้าหน้าที่จะตอบกลับภายใน 5 นาที</p>}
    </>
  );
}
