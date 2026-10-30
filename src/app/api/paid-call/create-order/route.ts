import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PAID_CALL_PAISE } from "@/lib/paid-call";

export const runtime = "nodejs";

// Starts the ₹199 recruiter-call payment for an application that already exists. Nothing is granted here: the call is
// only marked paid after /api/paid-call/verify checks the payment signature.
export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!keyId || !keySecret || !serviceKey) return NextResponse.json({ error: "Payment isn't set up yet." }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { candidateId?: string; mandateId?: string };
  if (!body.candidateId || !body.mandateId) return NextResponse.json({ error: "candidateId and mandateId are required." }, { status: 400 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { data: link } = await admin
    .from("candidate_mandate_links")
    .select("id, call_paid_at, candidates(full_name, email)")
    .eq("candidate_id", body.candidateId)
    .eq("mandate_id", body.mandateId)
    .maybeSingle();
  if (!link) return NextResponse.json({ error: "Apply for the role first." }, { status: 404 });
  if (link.call_paid_at) return NextResponse.json({ error: "A recruiter call is already booked for this application." }, { status: 400 });
  const cand = (Array.isArray(link.candidates) ? link.candidates[0] : link.candidates) as { full_name: string | null; email: string | null } | null;

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64") },
    body: JSON.stringify({ amount: PAID_CALL_PAISE, currency: "INR", notes: { kind: "paid_call", candidate_id: body.candidateId, mandate_id: body.mandateId, link_id: link.id } }),
  });
  if (!res.ok) {
    console.error("Razorpay order creation failed:", await res.text());
    return NextResponse.json({ error: "Couldn't start payment. Please try again." }, { status: 502 });
  }
  const order = (await res.json()) as { id: string; amount: number; currency: string };
  const { error } = await admin.from("paid_call_orders").insert({
    candidate_id: body.candidateId,
    mandate_id: body.mandateId,
    link_id: link.id,
    razorpay_order_id: order.id,
    amount_paise: PAID_CALL_PAISE,
  });
  if (error) {
    console.error("Failed to record paid_call_orders row:", error);
    return NextResponse.json({ error: "Couldn't start payment. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId, candidateName: cand?.full_name ?? null, candidateEmail: cand?.email ?? null });
}
