import { supabase } from "@/lib/supabaseClient";

export type JobListing = {
  id: string;
  role_title: string | null;
  category: string | null;
  sub_domain: string | null;
  sub_domains: string[] | null;
  city: string | null;
  cities: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  experience_min: number | null;
  experience_max: number | null;
  client_display: string | null;
  job_description: string | null;
  jd_overview: string | null;
  jd_responsibilities: string | null;
  jd_candidate_profile: string | null;
  jd_compensation_benefits: string | null;
  created_at: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  b2b_sales: "B2B Sales",
  b2c_sales: "B2C Sales",
  non_sales: "Non-Sales / Other",
};

export function categoryLabel(category: string | null) {
  if (!category) return "General";
  return CATEGORY_LABEL[category] ?? category;
}

export function budgetLabel(min: number | null, max: number | null) {
  if (!min && !max) return "Compensation not disclosed";
  if (min && max && min !== max) return `₹${min}-${max}L`;
  return `₹${min ?? max}L`;
}

export function experienceLabel(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `${min}-${max} yrs`;
  return `${min ?? max} yrs`;
}

export function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  if (days < 30) return `Posted ${days} days ago`;
  const months = Math.floor(days / 30);
  return `Posted ${months} month${months === 1 ? "" : "s"} ago`;
}

export async function listOpenJobs(): Promise<JobListing[]> {
  const { data, error } = await supabase.rpc("get_open_job_listings");
  if (error) throw new Error(error.message);
  return (data ?? []) as JobListing[];
}

// Fire-and-forget event beacon for the Quick Apply funnel on a mandate's
// public listing/apply pages -- lets the CRM show a Clicked -> Form opened ->
// Submitted -> Profile Completed funnel per mandate, broken down by location,
// referrer/UTM source, and device/browser. Never blocks navigation to the
// form, and never throws.
//
// The actual insert (and the header-derived enrichment: IP geolocation,
// referrer, user-agent) happens server-side in /api/log-click, since Vercel's
// geo headers and a reliable Referer header are only available there -- see
// that route for details. This function's own job is just the staff-skip
// check and reading whatever UTM params are on the current URL.
//
// Recruiters/admins have no login flow on this public site at all (their
// accounts live in the CRM), so in practice every visitor here is a genuine
// external candidate. As a defensive check anyway -- e.g. a staff member who
// happens to also be signed in as a candidate on this device -- we skip
// logging if the current session's own `profiles` row (readable only via
// the "read own profile" RLS policy) resolves to a recruiter/admin role.
async function logQuickApplyEvent(mandateId: string, eventType: "click" | "form_opened") {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: ownProfile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (ownProfile) return; // signed in as staff -- don't count this event
    }
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    await fetch("/api/log-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mandateId,
        eventType,
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

export async function logQuickApplyClick(mandateId: string) {
  await logQuickApplyEvent(mandateId, "click");
}

// New funnel stage: fired once when the candidate's actual apply form/card
// mounts (ApplyForm.tsx / SignedInApplyCard.tsx), distinct from the CTA
// click above -- lets the CRM show candidates who clicked but never even saw
// the form (slow load, bounced) separately from those who saw it but didn't
// submit.
export async function logQuickApplyFormOpened(mandateId: string) {
  await logQuickApplyEvent(mandateId, "form_opened");
}

export async function getOpenJob(mandateId: string): Promise<JobListing | null> {
  const { data, error } = await supabase.rpc("get_open_job_listing", { p_mandate_id: mandateId });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as JobListing[];
  return rows[0] ?? null;
}

