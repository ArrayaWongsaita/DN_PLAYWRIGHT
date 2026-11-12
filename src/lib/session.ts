import { cookies } from "next/headers";
import { getUserByToken } from "./auth";
import { AUTH_COOKIE, SESSION_COOKIE } from "./constants";
import { getSessionData } from "./store";
import type { PublicUser, SessionData } from "./types";

/** sid มาจาก src/proxy.ts ที่ตั้งให้ทุก request */
export async function getSid(): Promise<string> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? "anonymous";
}

export async function getData(): Promise<SessionData> {
  return getSessionData(await getSid());
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  return getUserByToken(jar.get(AUTH_COOKIE)?.value);
}
