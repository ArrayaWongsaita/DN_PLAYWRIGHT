import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "./lib/constants";

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const sid = crypto.randomUUID();
  // ให้ route handler / server component ใน request เดียวกันเห็น sid ใหม่ทันที
  const headers = new Headers(request.headers);
  const existing = headers.get("cookie");
  headers.set("cookie", existing ? `${existing}; ${SESSION_COOKIE}=${sid}` : `${SESSION_COOKIE}=${sid}`);

  const response = NextResponse.next({ request: { headers } });
  // ไม่ใส่ maxAge/expires จึงเป็น session cookie
  response.cookies.set(SESSION_COOKIE, sid, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|txt)$).*)"],
};
