import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getBackend, forwardCookies } from "../_lib";
import { COMPANY_TAG } from "../../../lib/companyCache";

export async function GET(req: NextRequest) {
  const res = await fetch(`${getBackend()}/api/admin/company`, forwardCookies(req, {}));
  if (!res.ok) return NextResponse.json({ error: "Backend unavailable" }, { status: res.status });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${getBackend()}/api/admin/company`, forwardCookies(req, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
  if (!res.ok) return NextResponse.json({ error: "Backend unavailable" }, { status: res.status });
  const data = await res.json();
  revalidateTag(COMPANY_TAG);
  revalidatePath("/");
  return NextResponse.json(data, { status: res.status });
}
