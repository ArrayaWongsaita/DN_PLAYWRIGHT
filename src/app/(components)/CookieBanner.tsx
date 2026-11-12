"use client";

import { useEffect, useState } from "react";
import { ModalDialog } from "./ModalDialog";
import { overlayEnabled, randomDelay, writeCookie } from "./cookies";

/** ปิดไว้เป็นค่าเริ่มต้น: เปิดด้วย ?cookieBanner=1 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!overlayEnabled("cookieBanner", "dn_cookie_banner", "dn_cookie_consent")) return;
    const timer = setTimeout(() => setVisible(true), randomDelay());
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  function answer(value: "accepted" | "rejected") {
    writeCookie("dn_cookie_consent", value);
    setVisible(false);
  }

  return (
    <ModalDialog titleId="cookie-title">
      <h2 id="cookie-title">การใช้คุกกี้</h2>
      <p>เว็บไซต์นี้ใช้คุกกี้เพื่อพัฒนาประสบการณ์การใช้งาน</p>
      <p className="row">
        <button type="button" onClick={() => answer("accepted")}>
          ยอมรับทั้งหมด
        </button>
        <button type="button" onClick={() => answer("rejected")}>
          ปฏิเสธ
        </button>
      </p>
    </ModalDialog>
  );
}
