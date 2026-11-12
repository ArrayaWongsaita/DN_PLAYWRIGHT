import type { ReactNode } from "react";
import { getCurrentUser, getData } from "@/lib/session";
import { getCartSummary } from "@/lib/shop";
import { CookieBanner } from "./CookieBanner";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { OfflineBanner } from "./OfflineBanner";
import { PromoPopup } from "./PromoPopup";

export async function SiteChrome({ children }: { children: ReactNode }) {
  const [data, user] = await Promise.all([getData(), getCurrentUser()]);
  const cartCount = getCartSummary(data).count;
  return (
    <>
      <OfflineBanner />
      <Header cartCount={cartCount} user={user} />
      <main className="container">{children}</main>
      <Footer />
      <CookieBanner />
      <PromoPopup />
    </>
  );
}
