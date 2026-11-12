import { handle } from "@/lib/http";
import { getData } from "@/lib/session";

export const dynamic = "force-dynamic";

const quote = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);

export function GET() {
  return handle(async () => {
    const d = await getData();
    const lines = ["id,name,category,price,stock"];
    for (const p of d.products) lines.push([p.id, quote(p.name), p.category, p.price, p.stock].join(","));
    return new Response(lines.join("\n") + "\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="products.csv"',
      },
    });
  });
}
