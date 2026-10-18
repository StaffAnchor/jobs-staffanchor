import { createClient } from "@supabase/supabase-js";

// Public salary pages ("Sales Manager salary in Delhi NCR"). Only role-and-city groups an admin chose to publish, only
// when at least 20 profiles back them, and only aggregates: a typical figure and the middle range.

export type Benchmark = { cluster_slug: string; metro: string; n: number; p25: number; median: number; p75: number };

const TITLE: Record<string, string> = {
  sales_manager: "Sales Manager",
  sales_leadership: "Sales Head / Director",
  bd_exec: "Business Development Executive",
  sdr_bdr: "SDR / BDR",
  account_exec: "Account Executive",
  inside_sales: "Inside Sales Executive",
  field_sales: "Field Sales Executive",
  solution_eng: "Solution Engineer / Pre-sales",
  customer_success: "Customer Success Manager",
  account_mgmt: "Key Account Manager",
  channel_partner: "Channel Partnerships Manager",
  sales_ops: "Sales Operations / RevOps",
  retail_sales: "Retail Sales Executive",
  bfsi_rm: "Relationship Manager (BFSI)",
  edtech_counsellor: "EdTech Counsellor",
  cust_support: "Customer Support Executive",
  marketing_brand: "Brand and Content Marketing",
  ops_supply_chain: "Supply Chain and Operations",
};

export const slugify = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const roleTitle = (slug: string) => TITLE[slug] ?? slug.replace(/_/g, " ");
export const cityLabel = (metro: string) => metro.replace(/\s*\(.*\)\s*$/, "");
export const benchmarkSlug = (b: { cluster_slug: string; metro: string }) => `${slugify(roleTitle(b.cluster_slug))}-${slugify(cityLabel(b.metro))}`;

export async function getBenchmarks(): Promise<Benchmark[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qdbxrspvnglbrvzfqhhg.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_ZeMpC0wNCzhnQV5ElaqoqQ_PXE6XzHN";
  const { data } = await createClient(url, key, { auth: { persistSession: false } }).rpc("salary_benchmarks_public");
  return ((data ?? []) as Benchmark[]).map((r) => ({ ...r, n: Number(r.n), p25: Number(r.p25), median: Number(r.median), p75: Number(r.p75) }));
}
