import { formatBaht } from "@/lib/format";
import { handle } from "@/lib/http";

import { getData } from "@/lib/session";
import { getOrder } from "@/lib/shop";

export const dynamic = "force-dynamic";

export function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const o = getOrder(await getData(), id);
    const lines = [
      "DN Shop - ใบเสร็จ",
      `หมายเลขคำสั่งซื้อ: ${o.id}`,
      `ผู้รับ: ${o.customer.name}`,
      `ที่อยู่: ${o.customer.address}`,
      `โทรศัพท์: ${o.customer.phone}`,
      "",
      ...o.items.map((i) => `${i.name} x${i.quantity} = ${formatBaht(i.lineTotal)}`),
      "",
      `ยอดสินค้า: ${formatBaht(o.subtotal)}`,
      `ส่วนลด: ${formatBaht(o.discount)}`,
      `ค่าจัดส่ง: ${formatBaht(o.shippingFee)}`,
      `ยอดรวมทั้งสิ้น: ${formatBaht(o.total)}`,
    ];
    return new Response(lines.join("\n") + "\n", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="receipt-${o.id}.txt"`,
      },
    });
  });
}
