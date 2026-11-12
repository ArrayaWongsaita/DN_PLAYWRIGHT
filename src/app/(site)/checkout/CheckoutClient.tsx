"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { SHIPPING_FEES } from "@/lib/constants";
import { formatBaht } from "@/lib/format";
import type { Order, PaymentMethod, ShippingMethod } from "@/lib/types";

const PHONE_PATTERN = /^\d{10}$/;

export function CheckoutClient({ total, defaultName }: { total: number; defaultName: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [shipping, setShipping] = useState<ShippingMethod>("standard");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [accepted, setAccepted] = useState(false);
  const [cardVerified, setCardVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string } | null;
      if (data?.type === "card-verified") setCardVerified(true);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const phoneInvalid = phone !== "" && !PHONE_PATTERN.test(phone);
  const complete =
    name.trim() !== "" &&
    address.trim() !== "" &&
    PHONE_PATTERN.test(phone) &&
    accepted &&
    (payment !== "card" || cardVerified);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!complete || submitting) return;
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer: { name: name.trim(), address: address.trim(), phone }, shipping, payment }),
    });
    if (res.ok) {
      const order = (await res.json()) as Order;
      router.push(`/orders/${order.id}`);
      router.refresh();
    } else {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      setError(body.message ?? "สั่งซื้อไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1>ชำระเงิน</h1>
      <form onSubmit={submit} className="checkout-form">
        <fieldset>
          <legend>ข้อมูลผู้รับ</legend>
          <label>
            ชื่อ-นามสกุล
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            ที่อยู่
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <label>
            เบอร์โทรศัพท์
            <input
              placeholder="0812345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              aria-invalid={phoneTouched && phoneInvalid}
            />
          </label>
          {phoneTouched && phoneInvalid && <p className="field-error">เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก</p>}
        </fieldset>

        <fieldset>
          <legend>วิธีจัดส่ง</legend>
          <label>
            <input
              type="radio"
              name="shipping"
              checked={shipping === "standard"}
              onChange={() => setShipping("standard")}
            />
            ส่งธรรมดา (50 บาท)
          </label>
          <label>
            <input
              type="radio"
              name="shipping"
              checked={shipping === "express"}
              onChange={() => setShipping("express")}
            />
            ส่งด่วน (100 บาท)
          </label>
        </fieldset>

        <label>
          วิธีชำระเงิน
          <select value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod)}>
            <option value="card">บัตรเครดิต</option>
            <option value="transfer">โอนผ่านธนาคาร</option>
            <option value="cod">เก็บเงินปลายทาง</option>
          </select>
        </label>

        {payment === "card" && (
          <div>
            <iframe title="ฟอร์มบัตรเครดิต" src="/embed/card-form" className="card-frame" />
            {cardVerified && <p role="status">ยืนยันบัตรแล้ว</p>}
          </div>
        )}

        <label>
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          ฉันยอมรับเงื่อนไขการสั่งซื้อ
        </label>

        <p>
          ยอดที่ต้องชำระ: <strong data-testid="order-total">{formatBaht(total + SHIPPING_FEES[shipping])}</strong>
        </p>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={!complete || submitting}>
          ยืนยันคำสั่งซื้อ
        </button>
      </form>
    </>
  );
}
