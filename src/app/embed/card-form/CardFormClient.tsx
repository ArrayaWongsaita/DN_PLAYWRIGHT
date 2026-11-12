"use client";

import { useState, type FormEvent } from "react";
import { VALID_CARD } from "@/lib/constants";

export function CardFormClient() {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [result, setResult] = useState<"idle" | "ok" | "invalid">("idle");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (number.trim() === VALID_CARD) {
      setResult("ok");
      window.parent.postMessage({ type: "card-verified" }, window.location.origin);
    } else {
      setResult("invalid");
    }
  }

  return (
    <form onSubmit={submit} className="checkout-form">
      <label>
        หมายเลขบัตร
        <input value={number} onChange={(e) => setNumber(e.target.value)} inputMode="numeric" />
      </label>
      <label>
        วันหมดอายุ
        <input placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
      </label>
      <label>
        CVV
        <input value={cvv} onChange={(e) => setCvv(e.target.value)} inputMode="numeric" />
      </label>
      <button type="submit">ยืนยันบัตร</button>
      {result === "ok" && <p role="status">บัตรผ่านการตรวจสอบ</p>}
      {result === "invalid" && <p role="alert">บัตรไม่ถูกต้อง</p>}
    </form>
  );
}
