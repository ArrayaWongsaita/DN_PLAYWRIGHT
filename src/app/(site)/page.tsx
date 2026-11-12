import Link from "next/link";
import { FlashSale } from "../(components)/FlashSale";
import { Greeting } from "../(components)/Greeting";
import { ProductCard } from "../(components)/ProductCard";
import { Today } from "../(components)/Today";
import { getData } from "@/lib/session";
import { listProducts } from "@/lib/shop";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "หน้าแรก | DN Shop",
};

export default async function HomePage() {
  const featured = listProducts(await getData(), {}).filter((p) => p.featured);
  return (
    <>
      <h1>DN Shop</h1>
      <p>ร้านค้าตัวอย่างสำหรับฝึก Playwright</p>
      <Greeting />
      <Today />
      <p>
        <Link href="/products" className="button">
          ดูสินค้าทั้งหมด
        </Link>
      </p>
      <h2>สินค้าแนะนำ</h2>
      <ul aria-label="สินค้าแนะนำ" className="product-grid">
        {featured.map((p) => (
          <ProductCard key={p.id} product={p} headingLevel={3} />
        ))}
      </ul>
      <FlashSale />
    </>
  );
}
