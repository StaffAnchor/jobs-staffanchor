import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseTouch } from "@/lib/attribution";

export const runtime = "nodejs";

const BOT = /bot|crawl|spider|headless|preview|facebookexternalhit|slurp|bingpreview|whatsapp\/|telegram/i;

// One row per visit that arrived from somewhere (a post, a search, a shared link), so the CRM can count visits per post.
// Best effort: it never fails the page, and ignores crawlers.
export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get("user-agent") ?? "";
    if (BOT.test(ua)) return NextResponse.json({ ok: true });
    const body = (await req.json().catch(() => ({}))) as { visitorId?: unknown; touch?: unknown };
    const touch = parseTouch(JSON.stringify(body.touch ?? null));
    if (!touch) return NextResponse.json({ ok: true });
    const visitorId = typeof body.visitorId === "string" && /^[0-9a-f-]{20,40}$/i.test(body.visitorId) ? body.visitorId : null;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ ok: true });
    const admin = createClient(url, key, { auth: { persistSession: false } });

    // Which role the visitor landed on: a long id in the address, or a short code.
    let mandateId: string | null = null;
    const full = /^\/jobs\/([0-9a-f-]{36})/i.exec(touch.p)?.[1];
    if (full) mandateId = full;
    else if (touch.k) {
      const { data } = await admin.rpc("resolve_job_code", { p_code: touch.k });
      if (typeof data === "string") mandateId = data;
    }

    const city = req.headers.get("x-vercel-ip-city");
    await admin.from("traffic_events").insert({
      visitor_id: visitorId,
      kind: "visit",
      source: touch.s,
      medium: touch.m,
      campaign: touch.c,
      content: touch.k,
      referrer_host: touch.r,
      landing_path: touch.p,
      mandate_id: mandateId,
      device_type: /ipad|tablet(?!.*mobile)/i.test(ua) ? "tablet" : /mobi|iphone|android/i.test(ua) ? "mobile" : "desktop",
      city: city ? decodeURIComponent(city) : null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
