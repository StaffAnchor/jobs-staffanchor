import { createClient } from "@supabase/supabase-js";
import type { JobListing } from "@/modules/jobs/api";

// Server-side reads of the public job listings, for pages search engines and job feeds can see. Uses the same public
// (anon) functions the browser uses, so nothing private is exposed.
const client = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qdbxrspvnglbrvzfqhhg.supabase.co", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_ZeMpC0wNCzhnQV5ElaqoqQ_PXE6XzHN", { auth: { persistSession: false } });

// The default share picture (1200x630), for pages that set their own sharing data and so do not inherit it.
export const SHARE_IMAGES = [{ url: "https://jobs.staffanchor.com/opengraph-image.png", width: 1200, height: 630, alt: "StaffAnchor Jobs" }];

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobs.staffanchor.com";

export async function getOpenJobsServer(): Promise<JobListing[]> {
  const { data } = await client().rpc("get_open_job_listings");
  return (data ?? []) as JobListing[];
}

export async function getJobByIdServer(id: string): Promise<JobListing | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await client().rpc("get_open_job_listing", { p_mandate_id: id });
  const rows = (data ?? []) as JobListing[];
  return rows[0] ?? null;
}

export async function getJobByCodeServer(code: string): Promise<JobListing | null> {
  const clean = code.trim().toLowerCase();
  if (!/^[a-z0-9]{4,12}$/.test(clean)) return null;
  const { data } = await client().rpc("resolve_job_code", { p_code: clean });
  return typeof data === "string" ? getJobByIdServer(data) : null;
}
