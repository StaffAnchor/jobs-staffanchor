import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { getClientContext } from "@/lib/client-auth";

export const runtime = "nodejs";

// A client may open the resume of a candidate that is shortlisted on one of
// *their own* roles, and nobody else's. Checked here with the service role
// because a client's own database session cannot see the shortlist tables.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { path?: unknown; previewToken?: unknown };

  // An admin preview carries the short-lived token minted in the CRM instead of a client session.
  let admin: SupabaseClient;
  let clientId: string;
  if (typeof body.previewToken === "string" && body.previewToken) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "This feature isn't fully configured yet." }, { status: 503 });
    if (!/^[0-9a-f-]{36}$/i.test(body.previewToken)) return NextResponse.json({ error: "Preview expired." }, { status: 401 });
    admin = createSupabaseClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: tok } = await admin.from("portal_preview_tokens").select("client_id").eq("token", body.previewToken).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (!tok?.client_id) return NextResponse.json({ error: "Preview expired." }, { status: 401 });
    clientId = tok.client_id as string;
  } else {
    const ctx = await getClientContext(req.headers.get("authorization"));
    if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    admin = ctx.admin;
    clientId = ctx.clientId;
  }

  if (typeof body.path !== "string" || !body.path) return NextResponse.json({ error: "path is required" }, { status: 400 });
  const clean = body.path.replace(/^resumes\//, "");

  const { data: cands } = await admin.from("candidates").select("id").in("resume_file_url", [clean, `resumes/${clean}`]);
  const ids = (cands ?? []).map((c) => c.id as string);
  if (ids.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: links } = await ctx.admin
    .from("candidate_mandate_links")
    .select("id, mandates!inner(client_id)")
    .in("candidate_id", ids)
    .eq("in_shortlist", true)
    .eq("mandates.client_id", clientId)
    .limit(1);
  if (!links || links.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await admin.storage.from("resumes").createSignedUrl(clean, 3600);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Could not open this resume." }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
