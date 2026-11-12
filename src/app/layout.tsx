import type { ReactNode } from "react";
import { getCurrentUser, getData } from "@/lib/session";
import { getCartSummary } from "@/lib/shop";
import { Footer } from "./(components)/Footer";
import { Header } from "./(components)/Header";
import { OfflineBanner } from "./(components)/OfflineBanner";
import "./globals.css";

export const metadata = {
  title: "DN Shop",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [data, user] = await Promise.all([getData(), getCurrentUser()]);
  const cartCount = getCartSummary(data).count;
  return (
    <html lang="th">
      <body>
        <OfflineBanner />
        <Header cartCount={cartCount} user={user} />
        <main className="container">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
