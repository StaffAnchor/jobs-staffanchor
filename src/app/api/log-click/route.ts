import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { LAST_COOKIE, parseTouch } from "@/lib/attribution";

export const runtime = "nodejs";

// Server-side landing spot for Quick Apply funnel logging. Moved here from a
// direct client-side insert (see jobs-staffanchor's src/modules/jobs/api.ts)
// specifically so we can read request headers the browser never has access
// to: Vercel's automatic IP-geolocation headers (x-vercel-ip-city/-country/
// -country-region) for approximate location, the Referer header for
// traffic-source, and User-Agent for a lightweight device/browser breakdown.
//
// Two event types share this route (see the quick_apply_clicks.event_type
// check constraint added alongside these columns):
//   "click"       -- candidate clicked the Quick Apply CTA on the listing page
//   "form_opened" -- candidate's apply form/card actually rendered, i.e. they
//                     didn't bounce before ever seeing the form. This is a new
//                     funnel stage between "clicked" and "submitted" that
//                     lets the CRM show where candidates are dropping off.
//
// Uses the anon key (not service-role) -- the "public can log quick apply
// clicks" RLS policy on quick_apply_clicks already allows any insert with
// check(true), same as the client-side insert this replaces.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      mandateId?: string;
      eventType?: "click" | "form_opened" | "paid_call_click" | "submitted";
      spot?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    };

    const mandateId = typeof body.mandateId === "string" ? body.mandateId : null;
    if (!mandateId) {
      return NextResponse.json({ error: "mandateId is required." }, { status: 400 });
    }
    const eventType =
      body.eventType === "form_opened" || body.eventType === "paid_call_click" || body.eventType === "submitted" ? body.eventType : "click";
    // Where the ₹199 offer was tapped (list, preview, detail, bar, confirm); anything else is dropped.
    const spot = eventType === "paid_call_click" && ["list", "preview", "detail", "bar", "confirm"].includes(body.spot ?? "") ? body.spot : null;

    const userAgent = req.headers.get("user-agent") ?? null;
    // The Referer header here is always this site's own page (the beacon is sent from it), so the real origin comes from
    // the cookie set when the visitor first landed.
    const remembered = parseTouch(decodeURIComponent(req.cookies.get(LAST_COOKIE)?.value ?? ""));
    const referrer = remembered ? (remembered.r ? `https://${remembered.r}/` : null) : (req.headers.get("referer") ?? null);
    const city = req.headers.get("x-vercel-ip-city");
    const region = req.headers.get("x-vercel-ip-country-region");
    const country = req.headers.get("x-vercel-ip-country");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qdbxrspvnglbrvzfqhhg.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_ZeMpC0wNCzhnQV5ElaqoqQ_PXE6XzHN";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error } = await supabase.from("quick_apply_clicks").insert({
      mandate_id: mandateId,
      event_type: eventType,
      spot,
      referrer,
      utm_source: body.utmSource || remembered?.s || null,
      utm_medium: body.utmMedium || remembered?.m || null,
      utm_campaign: body.utmCampaign || remembered?.c || null,
      device_type: classifyDevice(userAgent),
      browser: classifyBrowser(userAgent),
      user_agent: userAgent,
      city: city ? decodeURIComponent(city) : null,
      region: region ? decodeURIComponent(region) : null,
      country,
    });

    if (error) {
      // Best-effort logging -- never surface a failure to the candidate.
      console.error("Failed to log quick apply event", error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("log-click route error", err);
    // Still 200 -- this is fire-and-forget analytics, never block the candidate.
    return NextResponse.json({ ok: false });
  }
}

// Deliberately lightweight -- this drives an internal funnel breakdown, not a
// precise analytics product, so a small hand-rolled parser covering the
// overwhelming majority of real traffic (mobile vs desktop vs tablet; the
// handful of major browsers) beats pulling in a UA-parsing dependency.
function classifyDevice(ua: string | null): string | null {
  if (!ua) return null;
  const s = ua.toLowerCase();
  if (/ipad|tablet(?!.*mobile)/.test(s)) return "tablet";
  if (/mobi|iphone|android/.test(s)) return "mobile";
  return "desktop";
}

function classifyBrowser(ua: string | null): string | null {
  if (!ua) return null;
  const s = ua.toLowerCase();
  if (s.includes("edg/")) return "Edge";
  if (s.includes("opr/") || s.includes("opera")) return "Opera";
  if (s.includes("crios") || (s.includes("chrome/") && !s.includes("chromium"))) return "Chrome";
  if (s.includes("fxios") || s.includes("firefox/")) return "Firefox";
  if (s.includes("safari/") && !s.includes("chrome/") && !s.includes("crios")) return "Safari";
  return "Other";
}
