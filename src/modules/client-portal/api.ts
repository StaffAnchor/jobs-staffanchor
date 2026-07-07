import { supabase } from "@/lib/supabaseClient";

export type ClientMandate = {
  id: string;
  role_title: string;
  category: string | null;
  sub_domain: string | null;
  city: string | null;
  status: string;
  job_description: string | null;
  budget_min: number | null;
  budget_max: number | null;
  experience_min: number | null;
  experience_max: number | null;
  created_at: string;
  shortlisted_count: number;
};

export type ShortlistCandidate = {
  link_id: string;
  mandate_id: string;
  role_title: string;
  candidate_id: string;
  full_name: string;
  current_job_title: string | null;
  current_employer: string | null;
  current_location: string | null;
  total_experience_years: number | null;
  expected_fixed_ctc: number | null;
  expected_variable_ctc: number | null;
  category: string | null;
  sub_domain: string | null;
  secondary_sub_domains: string[] | null;
  industries: string[] | null;
  ai_summary: string | null;
  overall_recommendation: string | null;
  verified_relocation: string | null;
  verified_notice: string | null;
  resume_file_url: string | null;
  stage: string;
  client_feedback: string | null;
};

export async function getOrCreateMyClientId(): Promise<string> {
  const { data, error } = await supabase.rpc("get_or_create_my_client_user");
  if (error) throw new Error(error.message);
  return data as string;
}

export async function listMyMandates(): Promise<ClientMandate[]> {
  const { data, error } = await supabase.rpc("get_my_client_mandates");
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientMandate[];
}

export async function getMyShortlist(mandateId: string): Promise<ShortlistCandidate[]> {
  const { data, error } = await supabase.rpc("get_my_client_shortlist", { p_mandate_id: mandateId });
  if (error) throw new Error(error.message);
  return (data ?? []) as ShortlistCandidate[];
}

export async function submitMyFeedback(linkId: string, feedback: string): Promise<void> {
  const { error } = await supabase.rpc("submit_my_client_feedback", { p_link_id: linkId, p_feedback: feedback });
  if (error) throw new Error(error.message);
}

export async function getResumeSignedUrl(resumeFileUrl: string): Promise<string | null> {
  const cleanPath = resumeFileUrl.replace(/^resumes\//, "");
  const { data, error } = await supabase.storage.from("resumes").createSignedUrl(cleanPath, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}
