import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const fingerprint = req.cookies.get("_fp")?.value || null;

  try {
    const r = await fetch(`${BACKEND}/api/secret/blocked-devices/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint, ip }),
      signal: AbortSignal.timeout(3000),
    });
    if (r.ok) {
      const data = await r.json();
      return NextResponse.json({ blocked: data.blocked ?? false });
    }
  } catch {}

  return NextResponse.json({ blocked: false });
}
