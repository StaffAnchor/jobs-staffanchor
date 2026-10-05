import { NextRequest, NextResponse } from "next/server";
import { getClientContext } from "@/lib/client-auth";

export const runtime = "nodejs";

// A client may open the resume of a candidate that is shortlisted on one of
// *their own* roles, and nobody else's. Checked here with the service role
// because a client's own database session cannot see the shortlist tables.
export async function POST(req: NextRequest) {
  const ctx = await getClientContext(req.headers.get("authorization"));
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = (await req.json().catch(() => ({}))) as { path?: unknown };
  if (typeof body.path !== "string" || !body.path) return NextResponse.json({ error: "path is required" }, { status: 400 });
  const clean = body.path.replace(/^resumes\//, "");

  const { data: cands } = await ctx.admin.from("candidates").select("id").in("resume_file_url", [clean, `resumes/${clean}`]);
  const ids = (cands ?? []).map((c) => c.id as string);
  if (ids.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: links } = await ctx.admin
    .from("candidate_mandate_links")
    .select("id, mandates!inner(client_id)")
    .in("candidate_id", ids)
    .eq("in_shortlist", true)
    .eq("mandates.client_id", ctx.clientId)
    .limit(1);
  if (!links || links.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await ctx.admin.storage.from("resumes").createSignedUrl(clean, 3600);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Could not open this resume." }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
