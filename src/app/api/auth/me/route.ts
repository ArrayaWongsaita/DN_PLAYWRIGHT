import { requireUser } from "@/lib/guard";
import { handle } from "@/lib/http";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(async () => Response.json({ user: await requireUser() }));
}
