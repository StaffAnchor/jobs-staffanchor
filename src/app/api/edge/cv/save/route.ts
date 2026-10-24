import { NextRequest, NextResponse } from "next/server";
import { crmCall } from "@/lib/pro-sessions";

export const dynamic = "force-dynamic";

// Autosave and submit for the Sales CV form. The CRM checks the private link and cleans the answers.
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as { token?: string; data?: unknown; consent?: boolean; submit?: boolean } | null;
  if (!b || typeof b.token !== "string") return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 400 });
  const r = await crmCall("/api/internal/cv-brief/save", { token: b.token, data: b.data, consent: b.consent === true, submit: b.submit === true });
  if (!r.json.ok) return NextResponse.json({ ok: false, error: r.json.error ?? "Couldn't save." }, { status: r.status === 404 ? 404 : 502 });
  return NextResponse.json({ ok: true });
}
