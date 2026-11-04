import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const BOT = /bot|crawl|spider|headless|preview|facebookexternalhit|slurp|bingpreview|whatsapp\/|telegram/i;
const FLOWS = new Set(["edge", "resume"]);
const STEPS = new Set(["view", "slot", "ready", "pay_click", "pay_open", "pay_dismiss", "paid", "error"]);

// One row per step a visitor takes on the Edge booking and resume order pages, so the CRM can show where people drop off.
// Best effort: it never fails the page, ignores crawlers and anything that does not look like a real step.
export async function POST(req: NextRequest) {
  try {
    if (BOT.test(req.headers.get("user-agent") ?? "")) return NextResponse.json({ ok: true });
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
    const sid = str(b.sid, 60);
    const flow = str(b.flow, 10);
    const step = str(b.step, 20);
    if (!sid || !/^[0-9a-z-]{10,60}$/i.test(sid) || !flow || !FLOWS.has(flow) || !step || !STEPS.has(step)) return NextResponse.json({ ok: true });
    const service = str(b.service, 60);
    const source = str(b.src, 40);
    const bookingId = typeof b.bookingId === "string" && /^[0-9a-f-]{36}$/i.test(b.bookingId) ? b.bookingId : null;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ ok: true });
    const ua = req.headers.get("user-agent") ?? "";
    await createClient(url, key, { auth: { persistSession: false } }).from("edge_funnel_events").insert({
      sid,
      flow,
      service: service && /^[a-z0-9_-]+$/i.test(service) ? service : null,
      step,
      booking_id: bookingId,
      source: source && /^[a-z0-9_-]+$/i.test(source) ? source : null,
      device: /ipad|tablet(?!.*mobile)/i.test(ua) ? "tablet" : /mobi|iphone|android/i.test(ua) ? "mobile" : "desktop",
      note: str(b.note, 120),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
