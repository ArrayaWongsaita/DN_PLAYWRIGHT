"use client";

import { useEffect, useRef, useState } from "react";

export function KeyboardClient() {
  const [lastKey, setLastKey] = useState("-");
  const [open, setOpen] = useState(false);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      setLastKey(e.key);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) search.current?.focus();
  }, [open]);

  return (
    <>
      <h1>Keyboard</h1>
      <p>
        <label>
          พิมพ์ที่นี่ <input />
        </label>
      </p>
      <p role="status">คีย์ล่าสุด: {lastKey}</p>
      {open && (
        <div className="modal-backdrop">
          <div role="dialog" aria-modal="true" aria-labelledby="quick-search-title" className="modal">
            <h2 id="quick-search-title">ค้นหาด่วน</h2>
            <label>
              ค้นหา <input ref={search} />
            </label>
          </div>
        </div>
      )}
    </>
  );
}
