import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Top-of-funnel click logging for the Priority Applicant paid feature --
// same pattern as /api/log-click (quick_apply_clicks), moved server-side so
// we can read Vercel's IP-geolocation + Referer + User-Agent headers the
// browser never has access to. Distinct from priority_purchases (which
// already tracks checkout attempts/payments) -- this table exists purely to
// answer "how many people even saw/clicked a Priority Applicant CTA before
// ever reaching checkout", broken down by which placement drove the click.
//
// event_type:
//   "click"             -- candidate clicked a Priority Applicant CTA
//                           somewhere (job page teaser, floating nudge,
//                           portal tile, My Pipeline row action, etc).
//   "checkout_started"  -- candidate actually landed on /priority-applicant
//                           (the pack picker), i.e. didn't bounce before
//                           seeing the product page.
//
// Uses the anon key -- the "public can log priority applicant clicks" RLS
// policy on priority_applicant_clicks allows any insert with check(true).
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      mandateId?: string;
      candidateId?: string;
      placement?: string;
      eventType?: "click" | "checkout_started";
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    };

    const placement = typeof body.placement === "string" ? body.placement : null;
    if (!placement) {
      return NextResponse.json({ error: "placement is required." }, { status: 400 });
    }
    const eventType = body.eventType === "checkout_started" ? "checkout_started" : "click";
    const mandateId = typeof body.mandateId === "string" ? body.mandateId : null;
    const candidateId = typeof body.candidateId === "string" ? body.candidateId : null;

    const userAgent = req.headers.get("user-agent") ?? null;
    const referrer = req.headers.get("referer") ?? null;
    const city = req.headers.get("x-vercel-ip-city");
    const region = req.headers.get("x-vercel-ip-country-region");
    const country = req.headers.get("x-vercel-ip-country");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qdbxrspvnglbrvzfqhhg.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_ZeMpC0wNCzhnQV5ElaqoqQ_PXE6XzHN";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error } = await supabase.from("priority_applicant_clicks").insert({
      mandate_id: mandateId,
      candidate_id: candidateId,
      placement,
      event_type: eventType,
      referrer,
      utm_source: body.utmSource || null,
      utm_medium: body.utmMedium || null,
      utm_campaign: body.utmCampaign || null,
      device_type: classifyDevice(userAgent),
      browser: classifyBrowser(userAgent),
      user_agent: userAgent,
      city: city ? decodeURIComponent(city) : null,
      region: region ? decodeURIComponent(region) : null,
      country,
    });

    if (error) {
      // Best-effort logging -- never surface a failure to the candidate.
      console.error("Failed to log priority applicant click", error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("log-priority-click route error", err);
    // Still 200 -- this is fire-and-forget analytics, never block the candidate.
    return NextResponse.json({ ok: false });
  }
}

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
