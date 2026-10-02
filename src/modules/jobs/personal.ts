import { supabase } from "@/lib/supabaseClient";

// Candidate-specific job data: match scores (computed in the database from the
// candidate's profile, with the reasons), saved roles and job alerts. All of it
// is scoped to the signed-in candidate by the RPCs themselves.

export type JobMatch = {
  mandate_id: string;
  score: number;
  reasons: string[];
  applied: boolean;
};

export type JobAlert = {
  id: string;
  category: string | null;
  city: string | null;
  keyword: string | null;
  created_at: string;
};

export type MatchTier = "strong" | "good" | "possible";

// Below 40 we show nothing rather than a discouraging number.
export function matchTier(score: number): MatchTier | null {
  if (score >= 75) return "strong";
  if (score >= 55) return "good";
  if (score >= 40) return "possible";
  return null;
}

export const MATCH_TIER_LABEL: Record<MatchTier, string> = {
  strong: "Strong match",
  good: "Good match",
  possible: "Possible fit",
};

export const MATCH_TIER_CLASSES: Record<MatchTier, string> = {
  strong: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  good: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  possible: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export async function loadJobMatches(): Promise<JobMatch[]> {
  const { data, error } = await supabase.rpc("get_my_job_matches");
  if (error) throw new Error(error.message);
  return (data ?? []) as JobMatch[];
}

export async function loadSavedJobIds(): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_my_saved_jobs");
  if (error) throw new Error(error.message);
  return ((data ?? []) as { mandate_id: string }[]).map((r) => r.mandate_id);
}

// Returns the new state: true = now saved, false = removed.
export async function toggleSavedJob(mandateId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("toggle_saved_job", { p_mandate_id: mandateId });
  if (error) throw new Error(error.message);
  return !!data;
}

export async function loadJobAlerts(): Promise<JobAlert[]> {
  const { data, error } = await supabase.rpc("get_my_job_alerts");
  if (error) throw new Error(error.message);
  return (data ?? []) as JobAlert[];
}

export async function createJobAlert(input: { category?: string; city?: string; keyword?: string }): Promise<void> {
  const { error } = await supabase.rpc("create_my_job_alert", {
    p_category: input.category ?? "",
    p_city: input.city ?? "",
    p_keyword: input.keyword ?? "",
  });
  if (error) throw new Error(error.message);
}

export async function deleteJobAlert(id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_my_job_alert", { p_id: id });
  if (error) throw new Error(error.message);
}

export function describeAlert(a: { category: string | null; city: string | null; keyword: string | null }): string {
  const cat: Record<string, string> = { b2b_sales: "B2B Sales", b2c_sales: "B2C Sales", non_sales: "Non-Sales" };
  const parts = [a.keyword ? `“${a.keyword}”` : null, a.category ? cat[a.category] ?? a.category : null, a.city].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Any new role";
}
