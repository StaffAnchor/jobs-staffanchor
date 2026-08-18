import { supabase } from "@/lib/supabaseClient";

// Fire-and-forget click beacon for the Priority Applicant funnel -- mirrors
// logQuickApplyClick/logQuickApplyFormOpened in src/modules/jobs/api.ts, but
// for the paid Priority Applicant feature instead of the free Quick Apply
// flow. The actual insert + header-derived enrichment (IP geolocation,
// referrer, user-agent) happens server-side in /api/log-priority-click --
// see that route for why. This just does the staff-skip check and reads
// whatever UTM params are on the current URL, exactly like the Quick Apply
// version.
//
// `placement` identifies which of the several Priority Applicant CTAs was
// clicked (job page teaser, floating nudge, portal tile, My Pipeline row
// action, etc) -- see the priority_applicant_clicks.placement check
// constraint for the full allowed list.
export type PriorityClickPlacement =
  | "job_teaser"
  | "floating_nudge"
  | "apply_confirmation"
  | "portal_home"
  | "my_pipeline_cta"
  | "my_pipeline_spend_credit"
  | "checkout_landed"
  | "nav_pill";

export async function logPriorityClick(
  placement: PriorityClickPlacement,
  opts?: { mandateId?: string | null; candidateId?: string | null; eventType?: "click" | "checkout_started" }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: ownProfile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (ownProfile) return; // signed in as staff -- don't count this event
    }
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    await fetch("/api/log-priority-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placement,
        eventType: opts?.eventType ?? "click",
        mandateId: opts?.mandateId ?? undefined,
        candidateId: opts?.candidateId ?? undefined,
        utmSource: params?.get("utm_source") ?? undefined,
        utmMedium: params?.get("utm_medium") ?? undefined,
        utmCampaign: params?.get("utm_campaign") ?? undefined,
      }),
      keepalive: true,
    });
  } catch {
    // Best-effort only -- a failed event log should never break the page.
  }
}
