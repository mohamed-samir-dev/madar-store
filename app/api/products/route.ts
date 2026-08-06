import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "../../lib/productsCache";

function normalizeArabic(str: string) {
  return str
    .replace(/[أإآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const brand = req.nextUrl.searchParams.get("brand") || "";
  const products = await getAllProducts();

  let result = products;

  if (brand) {
    result = result.filter(
      (p: { brand?: string }) => p.brand?.toLowerCase() === brand.toLowerCase()
    );
  }

  if (q) {
    const normalized = normalizeArabic(q.trim());
    result = result.filter((p: { name?: string }) =>
      normalizeArabic(p.name || "").includes(normalized)
    );
  }

  return NextResponse.json(result);
}
