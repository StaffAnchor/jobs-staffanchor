import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getPackByTier, PRIORITY_CREDIT_VALIDITY_DAYS } from "@/lib/priority-plans";

export const runtime = "nodejs";

// Called from the client immediately after Razorpay Checkout reports
// success. This is the ONLY place credits get granted -- the HMAC signature
// is recomputed here with the server-only key_secret and compared against
// what Razorpay sent, so a candidate (or anyone) tampering with the
// client-side "success" response can't grant themselves free credits.
export async function POST(req: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!keySecret || !serviceKey) {
    return NextResponse.json({ error: "Priority Applicant isn't fully configured yet." }, { status: 503 });
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const admin = createSupabaseClient(supabaseUrl, serviceKey);

  const { data: purchase, error: purchaseErr } = await admin
    .from("priority_purchases")
    .select("id, candidate_id, pack_tier, status, applied_to_link_id")
    .eq("razorpay_order_id", razorpay_order_id)
    .single();
  if (purchaseErr || !purchase) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  // Idempotency -- if this order was already verified (e.g. a client retry
  // or double-fire of the success handler), don't grant credits twice.
  if (purchase.status === "paid") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  const pack = getPackByTier(purchase.pack_tier);
  if (!pack) {
    return NextResponse.json({ error: "Invalid pack on this order." }, { status: 500 });
  }

  const expiresAt = new Date(Date.now() + PRIORITY_CREDIT_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: updatePurchaseErr } = await admin
    .from("priority_purchases")
    .update({
      razorpay_payment_id,
      status: "paid",
      credits_granted: pack.credits,
      paid_at: new Date().toISOString(),
    })
    .eq("id", purchase.id);
  if (updatePurchaseErr) {
    console.error("Failed to mark priority_purchases as paid:", updatePurchaseErr);
    return NextResponse.json({ error: "Payment verified but couldn't be recorded. Contact support." }, { status: 500 });
  }

  const { data: candidate } = await admin
    .from("candidates")
    .select("priority_credits")
    .eq("id", purchase.candidate_id)
    .single();

  const newBalance = (candidate?.priority_credits ?? 0) + pack.credits;
  await admin
    .from("candidates")
    .update({ priority_credits: newBalance, priority_credits_expire_at: expiresAt })
    .eq("id", purchase.candidate_id);

  // If this purchase was made mid-apply-flow (a specific application was in
  // context), auto-spend one credit on it immediately -- the candidate
  // shouldn't have to take a second action to see the effect of what they
  // just paid for.
  let autoAppliedToLinkId: string | null = null;
  if (purchase.applied_to_link_id) {
    const { data: applied } = await admin
      .from("candidate_mandate_links")
      .update({ is_priority: true, priority_used_at: new Date().toISOString() })
      .eq("id", purchase.applied_to_link_id)
      .eq("is_priority", false)
      .select("id")
      .maybeSingle();
    if (applied) {
      autoAppliedToLinkId = applied.id;
      await admin
        .from("candidates")
        .update({ priority_credits: newBalance - 1 })
        .eq("id", purchase.candidate_id);
    }
  }

  return NextResponse.json({
    ok: true,
    creditsGranted: pack.credits,
    remainingBalance: autoAppliedToLinkId ? newBalance - 1 : newBalance,
    autoAppliedToLinkId,
  });
}
