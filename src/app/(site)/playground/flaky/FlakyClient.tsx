"use client";

import { useEffect, useState } from "react";

export function FlakyClient({ failRate, delayMax }: { failRate: number; delayMax: number }) {
  const [result, setResult] = useState("");

  useEffect(() => {
    const timer = setTimeout(
      () => setResult(Math.random() < failRate ? "ผลลัพธ์: ล้มเหลว" : "ผลลัพธ์: สำเร็จ"),
      Math.random() * delayMax,
    );
    return () => clearTimeout(timer);
  }, [failRate, delayMax]);

  return (
    <>
      <h1>Flaky</h1>
      {result && <p role="status">{result}</p>}
    </>
  );
}
