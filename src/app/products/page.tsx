import { Suspense } from "react";
import { ProductsClient } from "./ProductsClient";

export const metadata = {
  title: "สินค้าทั้งหมด | DN Shop",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<h1>สินค้าทั้งหมด</h1>}>
      <ProductsClient />
    </Suspense>
  );
}
