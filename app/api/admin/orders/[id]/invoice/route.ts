import { NextRequest, NextResponse } from "next/server";
import { getBackend } from "../../../_lib";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookie = req.headers.get("cookie") || "";
  const [orderRes, companyRes] = await Promise.all([
    fetch(`${getBackend()}/api/checkout/${id}`, { headers: { cookie } }),
    fetch(`${getBackend()}/api/admin/company`, { headers: { cookie } }),
  ]);
  const order = await orderRes.json();
  const company = await companyRes.json();
  return NextResponse.json({ order, company });
}
