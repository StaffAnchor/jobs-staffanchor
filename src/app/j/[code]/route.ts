import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Short job links: /j/<code> opens the normal /jobs/<id> page. The code is
// resolved server-side by a read-only function that only returns open jobs.
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qdbxrspvnglbrvzfqhhg.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_ZeMpC0wNCzhnQV5ElaqoqQ_PXE6XzHN",
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = code.trim().toLowerCase();
  let jobId: string | null = null;
  if (/^[a-z0-9]{4,12}$/.test(clean)) {
    const { data } = await supabase.rpc("resolve_job_code", { p_code: clean });
    jobId = typeof data === "string" ? data : null;
  }
  // Keep any tracking params (utm_source, ref, ...) on the way through.
  const target = new URL(jobId ? `/jobs/${jobId}` : "/jobs", req.url);
  req.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  return NextResponse.redirect(target, 307);
}
