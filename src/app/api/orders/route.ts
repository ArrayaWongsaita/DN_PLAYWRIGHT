import { handle, readJson } from "@/lib/http";
import { getData } from "@/lib/session";
import { placeOrder } from "@/lib/shop";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(async () => Response.json({ orders: (await getData()).orders }));
}

export function POST(req: Request) {
  return handle(async () => {
    const body = await readJson(req);
    const order = placeOrder(await getData(), body as Parameters<typeof placeOrder>[1]);
    return Response.json(order, { status: 201 });
  });
}
