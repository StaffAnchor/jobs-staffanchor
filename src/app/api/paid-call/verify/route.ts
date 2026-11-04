import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { PROFILE_CALL_MANDATE_ID, dueDate } from "@/lib/paid-call";

export const runtime = "nodejs";

// Confirms the payment server-side, then marks the application as a paid recruiter call with its deadline.
export async function POST(req: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!keySecret || !serviceKey) return NextResponse.json({ error: "Payment isn't set up yet." }, { status: 503 });

  const b = (await req.json().catch(() => ({}))) as { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
  if (!b.razorpay_order_id || !b.razorpay_payment_id || !b.razorpay_signature) return NextResponse.json({ error: "Missing payment details." }, { status: 400 });

  const expected = crypto.createHmac("sha256", keySecret).update(`${b.razorpay_order_id}|${b.razorpay_payment_id}`).digest("hex");
  const a = Buffer.from(expected);
  const c = Buffer.from(b.razorpay_signature);
  if (a.length !== c.length || !crypto.timingSafeEqual(a, c)) return NextResponse.json({ error: "Payment signature didn't match." }, { status: 400 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { data: order } = await admin.from("paid_call_orders").select("id, status, link_id, candidate_id, mandate_id").eq("razorpay_order_id", b.razorpay_order_id).maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ ok: true });

  const now = new Date();
  await admin.from("paid_call_orders").update({ status: "paid", razorpay_payment_id: b.razorpay_payment_id, paid_at: now.toISOString() }).eq("id", order.id);
  // A call for future roles gets its link only now that it is paid, so unpaid attempts leave nothing behind in the CRM.
  let linkId = order.link_id as string | null;
  if (!linkId && order.mandate_id === PROFILE_CALL_MANDATE_ID && order.candidate_id) {
    const { data: existing } = await admin.from("candidate_mandate_links").select("id").eq("candidate_id", order.candidate_id).eq("mandate_id", PROFILE_CALL_MANDATE_ID).maybeSingle();
    if (existing) linkId = existing.id as string;
    else {
      const { data: made } = await admin.from("candidate_mandate_links").insert({ candidate_id: order.candidate_id, mandate_id: PROFILE_CALL_MANDATE_ID }).select("id").maybeSingle();
      linkId = (made?.id as string | undefined) ?? null;
    }
    if (linkId) await admin.from("paid_call_orders").update({ link_id: linkId }).eq("id", order.id);
  }
  if (linkId) {
    await admin
      .from("candidate_mandate_links")
      .update({ call_paid_at: now.toISOString(), call_due_at: dueDate(now).toISOString() })
      .eq("id", linkId)
      .is("call_paid_at", null);
  }
  return NextResponse.json({ ok: true });
}
