import { handle } from "@/lib/http";

import { getData } from "@/lib/session";
import { getOrder } from "@/lib/shop";

export const dynamic = "force-dynamic";

export function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    return Response.json(getOrder(await getData(), id));
  });
}
