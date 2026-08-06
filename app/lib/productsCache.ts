import { unstable_cache } from "next/cache";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";

export const PRODUCTS_TAG = "products";

export const getAllProducts = unstable_cache(
  async () => {
    const res = await fetch(`${BACKEND}/api/products`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  ["all-products"],
  { tags: [PRODUCTS_TAG], revalidate: false }
);

export async function getProductById(id: string) {
  const products = await getAllProducts();
  return products.find((p: { _id: string }) => p._id === id) ?? null;
}
