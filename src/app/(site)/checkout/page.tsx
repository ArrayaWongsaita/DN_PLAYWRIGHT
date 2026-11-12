import { redirect } from "next/navigation";
import { getCurrentUser, getData } from "@/lib/session";
import { getCartSummary } from "@/lib/shop";
import { CheckoutClient } from "./CheckoutClient";

export const metadata = {
  title: "ชำระเงิน | DN Shop",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [data, user] = await Promise.all([getData(), getCurrentUser()]);
  const cart = getCartSummary(data);
  if (cart.items.length === 0) redirect("/cart");
  return <CheckoutClient total={cart.total} defaultName={user?.name ?? ""} />;
}
