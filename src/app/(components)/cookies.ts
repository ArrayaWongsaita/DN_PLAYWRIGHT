export function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

/** เปิดใช้เมื่อมี ?flag=1 (แล้วจำใน cookie) หรือมี cookie อยู่แล้ว และยังไม่ถูกปิด/ตอบรับ */
export function overlayEnabled(flag: string, cookie: string, doneCookie: string): boolean {
  if (new URLSearchParams(window.location.search).get(flag) === "1") writeCookie(cookie, "1");
  return readCookie(cookie) === "1" && readCookie(doneCookie) === undefined;
}

export function randomDelay(): number {
  return 500 + Math.random() * 2000;
}
