"use client";

import { useRef, useState } from "react";

export function FilesClient() {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);

  return (
    <>
      <h1>Files</h1>
      <p>
        <label>
          เลือกไฟล์ (หลายไฟล์ได้){" "}
          <input
            ref={input}
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? [], (f) => ({ name: f.name, size: f.size })))}
          />
        </label>
      </p>
      <ul aria-label="ไฟล์ที่เลือก">
        {files.map((f) => (
          <li key={f.name}>
            {f.name} ({f.size} bytes)
          </li>
        ))}
      </ul>
      <p>
        <button
          type="button"
          onClick={() => {
            if (input.current) input.current.value = "";
            setFiles([]);
          }}
        >
          ล้างไฟล์
        </button>
      </p>
      <ul>
        <li>
          <a href="/api/products/export">ดาวน์โหลดรายการสินค้า (CSV)</a>
        </li>
        <li>
          <a href="/downloads/guide.txt" download>
            ดาวน์โหลดคู่มือ (TXT)
          </a>
        </li>
      </ul>
    </>
  );
}
