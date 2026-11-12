"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SlowClient({ delay }: { delay: number }) {
  const router = useRouter();
  const [preparing, setPreparing] = useState(true);
  const [formReady, setFormReady] = useState(false);
  const [loadStatus, setLoadStatus] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");

  useEffect(() => {
    const overlay = setTimeout(() => setPreparing(false), 1000);
    const form = setTimeout(() => setFormReady(true), 1500);
    return () => {
      clearTimeout(overlay);
      clearTimeout(form);
    };
  }, []);

  function load() {
    setLoadStatus("กำลังโหลด...");
    setTimeout(() => setLoadStatus("โหลดข้อมูลเสร็จแล้ว"), delay);
  }

  return (
    <>
      {preparing && <div className="page-overlay">กำลังเตรียมหน้า...</div>}
      <h1>Slow</h1>
      <p>
        <button type="button" onClick={load}>
          โหลดข้อมูล
        </button>
      </p>
      {loadStatus && <p role="status">{loadStatus}</p>}
      <p>
        <button type="button" disabled={!formReady} onClick={() => setSubmitStatus("ส่งฟอร์มแล้ว")}>
          {formReady ? "ส่งฟอร์ม" : "รอสักครู่..."}
        </button>
      </p>
      {submitStatus && <p role="status">{submitStatus}</p>}
      <p>
        <button type="button" onClick={() => setTimeout(() => router.push("/playground/slow/done"), 1000)}>
          ไปหน้าถัดไป
        </button>
      </p>
    </>
  );
}
