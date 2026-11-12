import { notFound } from "next/navigation";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatBaht } from "@/lib/format";
import { getData } from "@/lib/session";
import { getProduct, ShopError } from "@/lib/shop";
import type { Product } from "@/lib/types";
import { ProductDetailClient } from "./ProductDetailClient";

export const dynamic = "force-dynamic";

async function load(id: string): Promise<Product | null> {
  try {
    return getProduct(await getData(), id);
  } catch (e) {
    if (e instanceof ShopError) return null;
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const product = await load((await params).id);
  return { title: `${product?.name ?? "ไม่พบหน้านี้"} | DN Shop` };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const product = await load((await params).id);
  if (!product) notFound();
  return (
    <ProductDetailClient
      product={product}
      categoryLabel={CATEGORY_LABELS[product.category]}
      priceText={formatBaht(product.price)}
    />
  );
}
