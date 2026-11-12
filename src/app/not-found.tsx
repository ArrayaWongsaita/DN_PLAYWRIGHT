import Link from "next/link";

export const metadata = {
  title: "ไม่พบหน้านี้ | DN Shop",
};

export default function NotFound() {
  return (
    <>
      <h1>ไม่พบหน้านี้</h1>
      <p>หน้าที่คุณต้องการอาจถูกย้ายหรือไม่มีอยู่</p>
      <Link href="/">กลับหน้าแรก</Link>
    </>
  );
}
