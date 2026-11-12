"use client";

import { useEffect, useState } from "react";
import { ModalDialog } from "./ModalDialog";
import { overlayEnabled, randomDelay, writeCookie } from "./cookies";

/** ปิดไว้เป็นค่าเริ่มต้น: เปิดด้วย ?promo=1 */
export function PromoPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!overlayEnabled("promo", "dn_promo", "dn_promo_closed")) return;
    const timer = setTimeout(() => setVisible(true), randomDelay());
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <ModalDialog titleId="promo-title">
      <h2 id="promo-title">โปรโมชันพิเศษ</h2>
      <p>ใช้โค้ด DN10 ลด 10%</p>
      <button
        type="button"
        onClick={() => {
          writeCookie("dn_promo_closed", "1");
          setVisible(false);
        }}
      >
        ปิด
      </button>
    </ModalDialog>
  );
}
