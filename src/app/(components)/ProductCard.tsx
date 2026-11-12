import Link from "next/link";
import type { ReactNode } from "react";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatBaht } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  headingLevel = 2,
  children,
}: {
  product: Product;
  headingLevel?: 2 | 3;
  children?: ReactNode;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <li className="product-card">
      <img src={product.image} alt={product.name} width={400} height={300} />
      <Heading>
        <Link href={`/products/${product.id}`}>{product.name}</Link>
      </Heading>
      <p className="category">{CATEGORY_LABELS[product.category]}</p>
      <p className="price">{formatBaht(product.price)}</p>
      {children}
    </li>
  );
}
