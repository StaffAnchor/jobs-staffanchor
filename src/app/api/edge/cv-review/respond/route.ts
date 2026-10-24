import { NextRequest, NextResponse } from "next/server";
import { crmCall } from "@/lib/pro-sessions";

export const dynamic = "force-dynamic";

// The candidate's answer on their CV: approve it, or ask for changes. The CRM checks the private link and keeps the answer.
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as { token?: string; decision?: string; comments?: unknown; general?: string } | null;
  if (!b || typeof b.token !== "string") return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 400 });
  const r = await crmCall("/api/internal/cv-doc/respond", { token: b.token, decision: b.decision, comments: b.comments, general: b.general });
  if (!r.json.ok) return NextResponse.json({ ok: false, error: r.json.error ?? "Couldn't send your answer." }, { status: r.status === 404 ? 404 : r.status === 400 || r.status === 409 ? r.status : 502 });
  return NextResponse.json({ ok: true, decision: r.json.decision });
}
