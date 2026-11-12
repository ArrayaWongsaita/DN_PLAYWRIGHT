import Link from "next/link";
import { SiteChrome } from "./(components)/SiteChrome";

export const metadata = {
  title: "ไม่พบหน้านี้ | DN Shop",
};

export default function NotFound() {
  return (
    <SiteChrome>
      <h1>ไม่พบหน้านี้</h1>
      <p>หน้าที่คุณต้องการอาจถูกย้ายหรือไม่มีอยู่</p>
      <Link href="/">กลับหน้าแรก</Link>
    </SiteChrome>
  );
}
