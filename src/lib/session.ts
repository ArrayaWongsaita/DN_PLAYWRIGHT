import { cookies } from "next/headers";
import { getUserByToken } from "./auth";
import { AUTH_COOKIE, SESSION_COOKIE } from "./constants";
import { createSeedData } from "./seed";
import { getSessionData } from "./store";
import type { PublicUser, SessionData } from "./types";

export async function getData(): Promise<SessionData> {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  // ไม่มี sid (ไม่ควรเกิด เพราะ proxy ตั้งให้) -> seed ใหม่ที่ไม่ถูกเก็บ ไม่แชร์ state
  return sid ? getSessionData(sid) : createSeedData();
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  return getUserByToken(jar.get(AUTH_COOKIE)?.value);
}
