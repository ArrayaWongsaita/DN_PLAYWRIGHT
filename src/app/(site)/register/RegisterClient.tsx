"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CATEGORY_LABELS } from "@/lib/constants";

const PROVINCES = ["กรุงเทพมหานคร", "เชียงใหม่", "ขอนแก่น", "ภูเก็ต", "ชลบุรี"];
const SOURCES = ["เพื่อนแนะนำ", "โซเชียลมีเดีย", "อื่นๆ"];

type Errors = Partial<Record<"name" | "email" | "password" | "confirm" | "terms", string>>;

export function RegisterClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [province, setProvince] = useState(PROVINCES[0]);
  const [source, setSource] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newsletter, setNewsletter] = useState(true);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [welcome, setWelcome] = useState<string | null>(null);

  function toggleInterest(id: string) {
    setInterests((cur) => (cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id]));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const next: Errors = {};
    if (!name.trim()) next.name = "กรุณากรอกชื่อ";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (password.length < 8) next.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    else if (confirm !== password) next.confirm = "รหัสผ่านไม่ตรงกัน";
    if (!terms) next.terms = "กรุณายอมรับเงื่อนไขการใช้งาน";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, province, source, interests, newsletter }),
    });
    const body = (await res.json().catch(() => ({}))) as { message?: string; field?: string; user?: { name: string } };
    if (!res.ok) {
      const field = body.field === "name" || body.field === "email" || body.field === "password" ? body.field : null;
      if (field) setErrors({ [field]: body.message });
      else setFormError(body.message ?? "เกิดข้อผิดพลาด");
      return;
    }
    setWelcome(body.user?.name ?? name);
    router.refresh();
  }

  if (welcome !== null) {
    return (
      <>
        <h1>สมัครสมาชิก</h1>
        <h2>สมัครสมาชิกสำเร็จ</h2>
        <p role="status">ยินดีต้อนรับ {welcome}</p>
      </>
    );
  }

  return (
    <>
      <h1>สมัครสมาชิก</h1>
      <form onSubmit={submit} noValidate className="checkout-form">
        <label>
          ชื่อ-นามสกุล
          <input value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
        </label>
        {errors.name && <p className="field-error">{errors.name}</p>}
        <label>
          อีเมล
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
        </label>
        {errors.email && <p className="field-error">{errors.email}</p>}
        <label>
          รหัสผ่าน
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-hint"
            aria-invalid={!!errors.password}
          />
        </label>
        <small id="password-hint">อย่างน้อย 8 ตัวอักษร</small>
        {errors.password && <p className="field-error">{errors.password}</p>}
        <label>
          ยืนยันรหัสผ่าน
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={!!errors.confirm}
          />
        </label>
        {errors.confirm && <p className="field-error">{errors.confirm}</p>}
        <label>
          จังหวัด
          <select value={province} onChange={(e) => setProvince(e.target.value)}>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>รู้จักเราจากช่องทางไหน</legend>
          {SOURCES.map((s) => (
            <label key={s}>
              <input type="radio" name="source" value={s} checked={source === s} onChange={() => setSource(s)} />
              {s}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>หมวดที่สนใจ</legend>
          {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
            <label key={id}>
              <input type="checkbox" checked={interests.includes(id)} onChange={() => toggleInterest(id)} />
              {label}
            </label>
          ))}
        </fieldset>
        <label>
          <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
          รับข่าวสารทางอีเมล
        </label>
        <label>
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          ฉันยอมรับเงื่อนไขการใช้งาน
        </label>
        {errors.terms && <p className="field-error">{errors.terms}</p>}
        {formError && <p role="alert">{formError}</p>}
        <button type="submit">สมัครสมาชิก</button>
      </form>
    </>
  );
}
