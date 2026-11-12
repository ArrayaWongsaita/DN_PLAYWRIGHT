"use client";

import { useState, type FormEvent } from "react";

export function AvatarForm() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!file) {
      setError("กรุณาเลือกไฟล์ก่อน");
      return;
    }
    const form = new FormData();
    form.append("avatar", file);
    const res = await fetch("/api/account/avatar", { method: "POST", body: form });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      setError(body.message ?? "เกิดข้อผิดพลาด");
      return;
    }
    setMessage("บันทึกรูปโปรไฟล์แล้ว");
  }

  return (
    <form onSubmit={submit} className="checkout-form">
      <label>
        รูปโปรไฟล์
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setMessage("");
            setError("");
          }}
        />
      </label>
      {file && <p>ไฟล์ที่เลือก: {file.name}</p>}
      <button type="submit">บันทึกรูป</button>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
