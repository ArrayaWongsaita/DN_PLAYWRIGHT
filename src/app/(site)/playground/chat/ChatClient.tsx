"use client";

import { useState, type FormEvent } from "react";

export function ChatClient() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setMessages((m) => [...m, text.trim()]);
    setText("");
  }

  return (
    <>
      <h1>แชทกับร้าน</h1>
      <ul aria-label="ข้อความแชท">
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
      <form onSubmit={send} className="row">
        <label>
          ข้อความ <input value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <button type="submit">ส่ง</button>
      </form>
    </>
  );
}
