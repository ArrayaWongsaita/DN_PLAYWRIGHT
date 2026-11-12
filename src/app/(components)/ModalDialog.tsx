"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** <dialog> แบบ modal จริง: เนื้อหาอื่นถูก inert จึงบังการคลิกทั้งหมด */
export function ModalDialog({ titleId, children }: { titleId: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);
  return (
    <dialog ref={ref} aria-labelledby={titleId} className="overlay-dialog" onCancel={(e) => e.preventDefault()}>
      {children}
    </dialog>
  );
}
