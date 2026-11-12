import { createAuthToken } from "@/lib/auth";
import { AUTH_COOKIE } from "@/lib/constants";
import { handle, readJson } from "@/lib/http";
import { getData } from "@/lib/session";
import { findUserByCredentials, ShopError } from "@/lib/shop";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export function POST(req: Request) {
  return handle(async () => {
    const body = await readJson(req);
    const user = findUserByCredentials(await getData(), String(body.email ?? ""), String(body.password ?? ""));
    if (!user) throw new ShopError(401, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    const { password: _password, ...publicUser } = user;
    const jar = await cookies();
    jar.set(AUTH_COOKIE, createAuthToken(publicUser), { httpOnly: true, sameSite: "lax", path: "/" });
    return Response.json({ user: publicUser });
  });
}
