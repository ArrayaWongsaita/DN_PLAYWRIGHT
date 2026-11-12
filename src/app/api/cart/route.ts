import { handle, readJson } from "@/lib/http";
import { getData } from "@/lib/session";
import { addToCart, clearCart, getCartSummary } from "@/lib/shop";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(async () => Response.json(getCartSummary(await getData())));
}

export function POST(req: Request) {
  return handle(async () => {
    const body = await readJson(req);
    const quantity = body.quantity === undefined ? 1 : (body.quantity as number);
    const summary = addToCart(await getData(), String(body.productId ?? ""), quantity);
    return Response.json(summary, { status: 201 });
  });
}

export function DELETE() {
  return handle(async () => Response.json(clearCart(await getData())));
}
