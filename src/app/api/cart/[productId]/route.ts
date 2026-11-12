import { handle, readJson } from "@/lib/http";
import { getData } from "@/lib/session";
import { removeFromCart, setCartQuantity } from "@/lib/shop";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ productId: string }> };

export function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    const { productId } = await params;
    const body = await readJson(req);
    return Response.json(setCartQuantity(await getData(), productId, body.quantity as number));
  });
}

export function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const { productId } = await params;
    return Response.json(removeFromCart(await getData(), productId));
  });
}
