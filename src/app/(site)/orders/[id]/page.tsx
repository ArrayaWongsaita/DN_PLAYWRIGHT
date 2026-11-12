import { notFound } from "next/navigation";
import { formatBaht } from "@/lib/format";
import { getData } from "@/lib/session";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(id: string): Promise<Order | null> {
  return (await getData()).orders.find((o) => o.id === id) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await load(id);
  return { title: order ? `คำสั่งซื้อ ${order.id} | DN Shop` : "ไม่พบหน้านี้ | DN Shop" };
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await load((await params).id);
  if (!order) notFound();
  return (
    <>
      <h1>สั่งซื้อสำเร็จ</h1>
      <p>หมายเลขคำสั่งซื้อ: {order.id}</p>
      <ul aria-label="รายการสินค้า">
        {order.items.map((line) => (
          <li key={line.productId}>
            {line.name} x {line.quantity} - {formatBaht(line.lineTotal)}
          </li>
        ))}
      </ul>
      <p>ค่าจัดส่ง: {formatBaht(order.shippingFee)}</p>
      <p>
        ยอดสุทธิ: <strong>{formatBaht(order.total)}</strong>
      </p>
      <a className="button" href={`/api/orders/${order.id}/receipt`}>
        ดาวน์โหลดใบเสร็จ
      </a>
    </>
  );
}
