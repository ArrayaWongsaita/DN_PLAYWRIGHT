import { revokeToken } from "@/lib/auth";
import { AUTH_COOKIE } from "@/lib/constants";
import { handle } from "@/lib/http";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export function POST() {
  return handle(async () => {
    const jar = await cookies();
    const token = jar.get(AUTH_COOKIE)?.value;
    if (token) revokeToken(token);
    jar.delete(AUTH_COOKIE);
    return new Response(null, { status: 204 });
  });
}
