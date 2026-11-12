import { redirect } from "next/navigation";
import { formatBaht } from "@/lib/format";
import { getCurrentUser, getData } from "@/lib/session";
import { AvatarForm } from "./AvatarForm";

export const metadata = {
  title: "บัญชีของฉัน | DN Shop",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/account")}`);
  const data = await getData();
  return (
    <>
      <h1>บัญชีของฉัน</h1>
      <p>ชื่อ: {user.name}</p>
      <p>อีเมล: {user.email}</p>
      <p>สิทธิ์: {user.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}</p>
      <AvatarForm />
      <h2>ประวัติคำสั่งซื้อ</h2>
      {data.orders.length === 0 ? (
        <p>ยังไม่มีคำสั่งซื้อ</p>
      ) : (
        <ul aria-label="ประวัติคำสั่งซื้อ">
          {data.orders.map((o) => (
            <li key={o.id}>
              <a href={`/orders/${o.id}`}>{o.id}</a> - {formatBaht(o.total + o.shippingFee)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
