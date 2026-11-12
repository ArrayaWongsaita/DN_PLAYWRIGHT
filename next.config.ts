import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ตรวจ type เฉพาะ src/ เพื่อไม่ให้ build พังเมื่อผู้เรียนเขียนบทเรียนผิด
  typescript: { tsconfigPath: "tsconfig.app.json" },
  poweredByHeader: false,
};

export default nextConfig;
