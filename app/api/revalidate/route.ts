import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== process.env.ADMIN_INTERNAL_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tag = req.nextUrl.searchParams.get("tag") || "products";
  revalidateTag(tag);
  return NextResponse.json({ revalidated: true, tag });
}
