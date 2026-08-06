import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "../../../lib/productsCache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}
