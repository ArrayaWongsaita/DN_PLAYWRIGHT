import { SESSION_TTL_MS } from "./constants";
import { createSeedData } from "./seed";
import type { SessionData } from "./types";

declare global {
  var __dnShopSessions: Map<string, SessionData> | undefined;
}

function sessions(): Map<string, SessionData> {
  globalThis.__dnShopSessions ??= new Map();
  return globalThis.__dnShopSessions;
}

export function getSessionData(sid: string): SessionData {
  const map = sessions();
  const now = Date.now();
  for (const [key, value] of map) {
    if (key !== sid && now - value.lastSeen > SESSION_TTL_MS) map.delete(key);
  }
  let data = map.get(sid);
  if (!data) {
    data = createSeedData();
    map.set(sid, data);
  }
  data.lastSeen = now;
  return data;
}
