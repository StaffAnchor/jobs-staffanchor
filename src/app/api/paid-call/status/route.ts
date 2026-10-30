import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Whether a recruiter call is already booked for this application, so the offer is not shown to someone who paid.
export async function GET(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const candidateId = req.nextUrl.searchParams.get("candidateId");
  const mandateId = req.nextUrl.searchParams.get("mandateId");
  if (!serviceKey || !candidateId || !mandateId) return NextResponse.json({ paid: false });
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { data } = await admin.from("candidate_mandate_links").select("call_paid_at").eq("candidate_id", candidateId).eq("mandate_id", mandateId).maybeSingle();
  return NextResponse.json({ paid: !!data?.call_paid_at });
}
