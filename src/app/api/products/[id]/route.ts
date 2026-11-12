import { requireAdmin } from "@/lib/guard";
import { handle } from "@/lib/http";
import { getData } from "@/lib/session";
import { deleteProduct, getProduct } from "@/lib/shop";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    return Response.json(getProduct(await getData(), id));
  });
}

export function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    deleteProduct(await getData(), id);
    return new Response(null, { status: 204 });
  });
}
