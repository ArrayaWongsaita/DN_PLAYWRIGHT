import { createAuthToken } from "@/lib/auth";
import { AUTH_COOKIE } from "@/lib/constants";
import { handle, readJson } from "@/lib/http";
import { getData } from "@/lib/session";
import { registerUser } from "@/lib/shop";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export function POST(req: Request) {
  return handle(async () => {
    const body = await readJson(req);
    const user = registerUser(await getData(), body as Parameters<typeof registerUser>[1]);
    const jar = await cookies();
    jar.set(AUTH_COOKIE, createAuthToken(user), { httpOnly: true, sameSite: "lax", path: "/" });
    return Response.json({ user }, { status: 201 });
  });
}
