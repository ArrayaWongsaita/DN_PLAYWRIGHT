import type { PublicUser } from "./types";

declare global {
  var __dnShopTokens: Map<string, PublicUser> | undefined;
}

// เก็บแบบ global ไม่ผูกกับ dn_sid เพื่อให้ storageState ที่ไม่มี dn_sid ยัง login อยู่ได้
function tokens(): Map<string, PublicUser> {
  globalThis.__dnShopTokens ??= new Map();
  return globalThis.__dnShopTokens;
}

export function createAuthToken(user: PublicUser): string {
  const token = crypto.randomUUID();
  tokens().set(token, { id: user.id, name: user.name, email: user.email, role: user.role });
  return token;
}

export function getUserByToken(token: string | undefined): PublicUser | null {
  if (!token) return null;
  return tokens().get(token) ?? null;
}

export function revokeToken(token: string): void {
  tokens().delete(token);
}
