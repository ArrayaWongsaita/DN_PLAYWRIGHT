import { getData } from "@/lib/session";
import { getCartSummary } from "@/lib/shop";
import { CartClient } from "./CartClient";

export const metadata = {
  title: "ตะกร้าสินค้า | DN Shop",
};

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const summary = getCartSummary(await getData());
  return <CartClient initial={summary} />;
}
