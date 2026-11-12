import { MAX_DELAY_MS } from "@/lib/constants";
import { requireAdmin } from "@/lib/guard";
import { handle, readJson } from "@/lib/http";
import { getData } from "@/lib/session";
import { addProduct, listProducts } from "@/lib/shop";
import type { CategoryId } from "@/lib/types";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    const sp = new URL(req.url).searchParams;
    const delay = Math.min(Math.max(Number(sp.get("delay")) || 0, 0), MAX_DELAY_MS);
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    const d = await getData();
    const sort = sp.get("sort");
    const products = listProducts(d, {
      q: sp.get("q") ?? undefined,
      category: (sp.get("category") as CategoryId | "all" | null) ?? undefined,
      sort: sort === "price-asc" || sort === "price-desc" ? sort : "featured",
    });
    return Response.json({ products, total: products.length });
  });
}

export function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const body = await readJson(req);
    const product = addProduct(await getData(), body as Parameters<typeof addProduct>[1]);
    return Response.json(product, { status: 201 });
  });
}
