import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Spends one credit from a candidate's balance on a specific, already-
// submitted application -- the "make this application priority" action
// on the confirmation page and the portal's application list. Separate
// from the auto-apply that happens inside /api/priority/verify (which
// covers the apply-flow-checkout case); this route covers every other
// case where the candidate already has a balance and is pointing it at
// an application after the fact.
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Not fully configured yet." }, { status: 503 });
  }

  let body: { candidateId?: string; linkId?: string; mandateId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { candidateId, mandateId } = body;
  let { linkId } = body;
  if (!candidateId || (!linkId && !mandateId)) {
    return NextResponse.json({ error: "candidateId and either linkId or mandateId are required." }, { status: 400 });
  }

  const admin = createSupabaseClient(supabaseUrl, serviceKey);

  const { data: candidate, error: candErr } = await admin
    .from("candidates")
    .select("id, priority_credits, priority_credits_expire_at")
    .eq("id", candidateId)
    .single();
  if (candErr || !candidate) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  const expired = candidate.priority_credits_expire_at
    ? new Date(candidate.priority_credits_expire_at).getTime() < Date.now()
    : false;
  if (expired || (candidate.priority_credits ?? 0) < 1) {
    return NextResponse.json({ error: "No priority credits available.", noCredits: true }, { status: 400 });
  }

  if (!linkId && mandateId) {
    const { data: resolved } = await admin
      .from("candidate_mandate_links")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("mandate_id", mandateId)
      .maybeSingle();
    linkId = resolved?.id;
  }
  if (!linkId) {
    return NextResponse.json({ error: "Application not found for this candidate." }, { status: 404 });
  }

  const { data: link, error: linkErr } = await admin
    .from("candidate_mandate_links")
    .select("id, candidate_id, is_priority")
    .eq("id", linkId)
    .single();
  if (linkErr || !link || link.candidate_id !== candidateId) {
    return NextResponse.json({ error: "Application not found for this candidate." }, { status: 404 });
  }
  if (link.is_priority) {
    return NextResponse.json({ error: "This application is already Priority." }, { status: 400 });
  }

  const { error: updateLinkErr } = await admin
    .from("candidate_mandate_links")
    .update({ is_priority: true, priority_used_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("is_priority", false);
  if (updateLinkErr) {
    return NextResponse.json({ error: "Couldn't apply priority to this application." }, { status: 500 });
  }

  const newBalance = candidate.priority_credits - 1;
  await admin.from("candidates").update({ priority_credits: newBalance }).eq("id", candidateId);

  return NextResponse.json({ ok: true, remainingBalance: newBalance });
}
