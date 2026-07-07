import { supabase } from "@/lib/supabaseClient";

export type JobListing = {
  id: string;
  role_title: string | null;
  category: string | null;
  sub_domain: string | null;
  city: string | null;
  budget_min: number | null;
  budget_max: number | null;
  client_display: string | null;
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
  if (min && max && min !== max) return `₹${min}L - ₹${max}L`;
  return `₹${min ?? max}L`;
}

export async function listOpenJobs(): Promise<JobListing[]> {
  const { data, error } = await supabase.rpc("get_open_job_listings");
  if (error) throw new Error(error.message);
  return (data ?? []) as JobListing[];
}

export async function getOpenJob(mandateId: string): Promise<JobListing | null> {
  const { data, error } = await supabase.rpc("get_open_job_listing", { p_mandate_id: mandateId });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as JobListing[];
  return rows[0] ?? null;
}

export type QuickApplyPayload = {
  full_name: string;
  email: string;
  phone: string;
  current_location: string;
  total_experience_years: number | null;
  current_fixed_ctc: number | null;
  notice_period: string;
  consent: boolean;
};

export async function submitQuickApply(mandateId: string, payload: QuickApplyPayload) {
  const { data, error } = await supabase.rpc("quick_apply", {
    payload,
    p_mandate_id: mandateId,
  });
  if (error) throw new Error(error.message);
  return data as string;
}
