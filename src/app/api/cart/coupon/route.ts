import { handle, readJson } from "@/lib/http";
import { getData } from "@/lib/session";
import { applyCoupon } from "@/lib/shop";

export const dynamic = "force-dynamic";

export function POST(req: Request) {
  return handle(async () => {
    const body = await readJson(req);
    return Response.json(applyCoupon(await getData(), String(body.code ?? "")));
  });
}
