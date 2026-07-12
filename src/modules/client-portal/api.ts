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

export type AiPassport = {
  headline?: string;
  compensation_line?: string;
  targets_line?: string;
  resume_highlights?: string[];
  profile_incomplete?: boolean;
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
  ai_passport: AiPassport | null;
  overall_recommendation: string | null;
  verified_relocation: string | null;
  verified_notice: string | null;
  notice_period: string | null;
  resume_file_url: string | null;
  stage: string;
  client_feedback: string | null;
  requested_interview_at: string | null;
  confirmed_interview_at: string | null;
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

export async function submitMyFeedback(linkId: string, feedback: string, interviewAt?: string): Promise<void> {
  const { error } = await supabase.rpc("submit_my_client_feedback", {
    p_link_id: linkId,
    p_feedback: feedback,
    p_interview_at: interviewAt ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function getResumeSignedUrl(resumeFileUrl: string): Promise<string | null> {
  const cleanPath = resumeFileUrl.replace(/^resumes\//, "");
  const { data, error } = await supabase.storage.from("resumes").createSignedUrl(cleanPath, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}

// Self-service hiring-brief intake for a client who already has portal
// access -- same review-gate as the public shareable link (submit_employer_
// inquiry / the token flow): this always lands in employer_inquiries, never
// directly in mandates, so a recruiter still has to review and explicitly
// click "Create Mandate" in the CRM. Company name and contact details are
// resolved server-side from the caller's own client_users row, so the client
// can't spoof a different client's identity.
export async function submitMyMandateRequest(payload: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.rpc("submit_my_client_mandate_request", { payload });
  if (error) throw new Error(error.message);
  return data as string;
}

export type MandateOptionSets = {
  selling_style: { value: string; label: string }[];
  industries: { value: string; label: string }[];
  languages: { value: string; label: string }[];
};

const EMPTY_OPTION_SETS: MandateOptionSets = { selling_style: [], industries: [], languages: [] };

// Same shared mandate_option_sets table that backs the CRM's mandate forms
// and the public staffanchor.com mandate-request page -- one source of
// truth for these three option lists across all three surfaces.
export async function getMandateOptionSets(): Promise<MandateOptionSets> {
  const { data, error } = await supabase.rpc("get_mandate_option_sets");
  if (error) throw new Error(error.message);
  return {
    selling_style: data?.selling_style ?? [],
    industries: data?.industries ?? [],
    languages: data?.languages ?? [],
  };
}
export { EMPTY_OPTION_SETS };
