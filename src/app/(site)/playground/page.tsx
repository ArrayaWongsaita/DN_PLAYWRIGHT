import Link from "next/link";

export const metadata = {
  title: "Playground | DN Shop",
};

const pages = [
  ["dialogs", "Dialogs", "alert, confirm และ prompt"],
  ["new-tab", "New tab", "แท็บใหม่และหน้าต่างป๊อปอัป"],
  ["chat", "Chat", "หน้าแชทที่เปิดเป็นป๊อปอัป"],
  ["files", "Files", "อัปโหลดและดาวน์โหลดไฟล์"],
  ["drag-drop", "Drag and drop", "ลากการ์ดข้ามคอลัมน์"],
  ["keyboard", "Keyboard", "คีย์ลัดและการกดแป้น"],
  ["hover", "Hover", "เมนูที่เปิดเมื่อชี้เมาส์"],
  ["slow", "Slow", "หน้าที่ตอบสนองช้า"],
  ["iframe", "Iframe", "กล่องแชทใน iframe"],
  ["console", "Console", "console และ error ที่ไม่มีใครจับ"],
  ["a11y", "A11y", "หน้าที่มีปัญหา accessibility โดยตั้งใจ"],
  ["flaky", "Flaky", "ผลลัพธ์ที่สุ่มสำเร็จหรือล้มเหลว"],
] as const;

export default function PlaygroundPage() {
  return (
    <>
      <h1>Playground</h1>
      <p>หน้าสำหรับฝึกเทคนิคเฉพาะทางของ Playwright</p>
      <ul>
        {pages.map(([slug, name, desc]) => (
          <li key={slug}>
            <Link href={`/playground/${slug}`}>{name}</Link> — {desc}
          </li>
        ))}
      </ul>
    </>
  );
}
