import { redirect } from "next/navigation";
import { getCurrentUser, getData } from "@/lib/session";
import { AdminProductsClient } from "./AdminProductsClient";

export const metadata = {
  title: "จัดการสินค้า | DN Shop",
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/admin/products")}`);
  if (user.role !== "admin") return <h1>คุณไม่มีสิทธิ์เข้าหน้านี้</h1>;
  const data = await getData();
  return <AdminProductsClient initial={data.products} />;
}
