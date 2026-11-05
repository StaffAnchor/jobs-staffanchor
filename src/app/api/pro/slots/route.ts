import { NextRequest, NextResponse } from "next/server";
import { CRM } from "@/lib/pro-sessions";

export const dynamic = "force-dynamic";

// Free times for a session, read from the CRM (which checks the calendar).
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("service") ?? "";
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) return NextResponse.json({ ok: false, error: "Unknown session." }, { status: 404 });
  const minutes = req.nextUrl.searchParams.get("minutes");
  const res = await fetch(`${CRM}/api/pro/slots?service=${slug}${minutes && /^\d{2,3}$/.test(minutes) ? `&minutes=${minutes}` : ""}`, { cache: "no-store" }).catch(() => null);
  if (!res) return NextResponse.json({ ok: false, error: "Times are unavailable right now. Please try again shortly." }, { status: 503 });
  return NextResponse.json(await res.json().catch(() => ({ ok: false, error: "Times are unavailable right now." })), { status: res.status });
}
