export const metadata = {
  title: "A11y - Playground | DN Shop",
};

/* หน้านี้ตั้งใจให้ผิดหลัก accessibility เพื่อให้ axe เจอปัญหา: image-alt, button-name, label, color-contrast */
export default function A11yPage() {
  return (
    <>
      <h1>หน้านี้มีปัญหา accessibility โดยตั้งใจ</h1>
      <img src="/products/p01.svg" width={80} height={80} />
      <p>
        <button type="button">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" />
          </svg>
        </button>
      </p>
      <p>
        ช่องนี้ไม่มี label: <input type="text" />
      </p>
      <p style={{ color: "#c8c8c8", backgroundColor: "#ffffff" }}>ข้อความนี้สีจางมาก อ่านยาก</p>
    </>
  );
}
