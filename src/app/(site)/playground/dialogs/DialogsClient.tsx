"use client";

import { useState } from "react";

export function DialogsClient() {
  const [result, setResult] = useState("");
  return (
    <>
      <h1>Dialogs</h1>
      <p className="row">
        <button type="button" onClick={() => alert("นี่คือ alert")}>
          แสดง alert
        </button>
        <button
          type="button"
          onClick={() => setResult(confirm("ยืนยันใช่ไหม?") ? "ผลลัพธ์: ตกลง" : "ผลลัพธ์: ยกเลิก")}
        >
          แสดง confirm
        </button>
        <button
          type="button"
          onClick={() => {
            const name = prompt("กรุณาใส่ชื่อของคุณ");
            setResult(name === null ? "ผลลัพธ์: ยกเลิก" : `สวัสดี, ${name}`);
          }}
        >
          แสดง prompt
        </button>
      </p>
      {result && <p role="status">{result}</p>}
    </>
  );
}
