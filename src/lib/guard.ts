import { getCurrentUser } from "./session";
import { ShopError } from "./shop";
import type { PublicUser } from "./types";

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new ShopError(401, "กรุณาเข้าสู่ระบบ");
  return user;
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new ShopError(403, "ไม่มีสิทธิ์");
  return user;
}
