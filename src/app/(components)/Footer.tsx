import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <p>© 2026 DN Shop — ร้านตัวอย่างสำหรับฝึกเขียน test</p>
      <p>
        <Link href="/stores">สาขาของเรา</Link> · <Link href="/playground">Playground</Link>
      </p>
    </footer>
  );
}
