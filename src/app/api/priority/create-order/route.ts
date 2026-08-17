import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPackByTier } from "@/lib/priority-plans";

export const runtime = "nodejs";

// Creates a Razorpay order for a Priority Applicant pack and records it as
// 'created' in priority_purchases before the candidate ever sees the
// checkout modal. Credits are NOT granted here -- only after /api/priority/verify
// confirms the payment signature server-side. Using the Orders API (raw
// REST call, no razorpay npm dependency needed) rather than a Payment Page
// keeps checkout embedded on staffanchor.com and lets us attach our own
// candidate/application metadata to the order.
export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!keyId || !keySecret || !serviceKey) {
    return NextResponse.json(
      { error: "Priority Applicant isn't fully configured yet (missing Razorpay or Supabase credentials)." },
      { status: 503 }
    );
  }

  let body: { candidateId?: string; tier?: number; mandateId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { candidateId, tier, mandateId } = body;
  if (!candidateId) return NextResponse.json({ error: "candidateId is required." }, { status: 400 });
  const pack = getPackByTier(Number(tier));
  if (!pack) return NextResponse.json({ error: "Invalid pack tier." }, { status: 400 });

  const admin = createSupabaseClient(supabaseUrl, serviceKey);

  // Confirm the candidate is real before we create an order for them.
  const { data: candidate, error: candidateErr } = await admin
    .from("candidates")
    .select("id, full_name, email")
    .eq("id", candidateId)
    .single();
  if (candidateErr || !candidate) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  // If bought mid-apply-flow (a specific mandate/job was in context), resolve
  // that to the actual candidate_mandate_links row so verify() can auto-spend
  // the first credit on it -- confirms it belongs to this candidate and isn't
  // already priority, avoiding a paid order for something already flagged.
  let applyToLinkId: string | null = null;
  if (mandateId) {
    const { data: link } = await admin
      .from("candidate_mandate_links")
      .select("id, candidate_id, is_priority")
      .eq("candidate_id", candidateId)
      .eq("mandate_id", mandateId)
      .maybeSingle();
    if (link) {
      if (link.is_priority) {
        return NextResponse.json({ error: "This application is already Priority." }, { status: 400 });
      }
      applyToLinkId = link.id;
    }
  }

  const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
    },
    body: JSON.stringify({
      amount: pack.amountPaise,
      currency: "INR",
      notes: {
        candidate_id: candidateId,
        pack_tier: String(pack.tier),
        apply_to_link_id: applyToLinkId ?? "",
      },
    }),
  });

  if (!razorpayRes.ok) {
    const errText = await razorpayRes.text();
    console.error("Razorpay order creation failed:", errText);
    return NextResponse.json({ error: "Couldn't start payment. Please try again." }, { status: 502 });
  }

  const order = (await razorpayRes.json()) as { id: string; amount: number; currency: string };

  const { error: insertErr } = await admin.from("priority_purchases").insert({
    candidate_id: candidateId,
    razorpay_order_id: order.id,
    pack_tier: pack.tier,
    amount_paise: pack.amountPaise,
    credits_granted: 0,
    status: "created",
    applied_to_link_id: applyToLinkId ?? null,
  });
  if (insertErr) {
    console.error("Failed to record priority_purchases row:", insertErr);
    return NextResponse.json({ error: "Couldn't start payment. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId, // public key_id -- safe to send to the client, it's designed for this
    candidateName: candidate.full_name,
    candidateEmail: candidate.email,
  });
}
