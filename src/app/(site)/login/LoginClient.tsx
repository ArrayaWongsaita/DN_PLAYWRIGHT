"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/** รับเฉพาะ path ภายในเว็บ กัน open redirect */
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export function LoginClient({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "เกิดข้อผิดพลาด");
        return;
      }
      router.push(safeNext(next));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>เข้าสู่ระบบ</h1>
      <form onSubmit={submit} className="checkout-form">
        <label>
          อีเมล
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          รหัสผ่าน
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={!email || !password || busy}>
          เข้าสู่ระบบ
        </button>
      </form>
      <p>
        <Link href="/register">สมัครสมาชิก</Link>
      </p>
    </>
  );
}
