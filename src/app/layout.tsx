import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "DN Shop",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
